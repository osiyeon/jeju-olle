import { get, set, del } from 'idb-keyval'

import { COURSES } from './courses'
import { safeUrl } from './mapLink'

export const load = async (key, fallback) => (await get(key)) ?? fallback

// 저장 실패(저장 공간 부족, 브라우저가 저장을 막음 등)는 한 번만 알린다
let warned = false
export const save = (key, value) =>
  set(key, value).catch((e) => {
    console.error('save failed', key, e)
    if (warned) return
    warned = true
    alert('기기에 기록을 저장하지 못했어요.\n저장 공간이 부족하거나 브라우저가 저장을 막고 있어요. 기록 탭에서 백업을 받아 두세요.')
  })

// localStorage는 Safari '모든 쿠키 차단' 등에서 접근만 해도 예외가 난다
export const lsGet = (k) => {
  try {
    return localStorage.getItem(k)
  } catch {
    return null
  }
}
export const lsSet = (k, v) => {
  try {
    if (v == null) localStorage.removeItem(k)
    else localStorage.setItem(k, v)
  } catch {
    // 저장 못 해도 앱은 계속 동작
  }
}

export const savePhoto = (id, blob) => set(`photo:${id}`, blob)
export const loadPhoto = (id) => get(`photo:${id}`)
export const delPhoto = (id) => del(`photo:${id}`)

export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7)

// 휴대폰 사진은 크니까 저장 전에 줄인다 (EXIF 회전은 <img> 디코딩이 반영)
export function resizeImage(file, max = 1600) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const s = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight))
      const c = document.createElement('canvas')
      c.width = Math.round(img.naturalWidth * s)
      c.height = Math.round(img.naturalHeight * s)
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height)
      URL.revokeObjectURL(url)
      c.toBlob((b) => (b ? resolve(b) : reject(new Error('resize failed'))), 'image/jpeg', 0.85)
    }
    img.onerror = reject
    img.src = url
  })
}

const blobToDataURL = (b) =>
  new Promise((res) => {
    const r = new FileReader()
    r.onload = () => res(r.result)
    r.readAsDataURL(b)
  })

export async function exportAll() {
  const walks = await load('walks', [])
  const places = await load('places', [])
  const done = await load('done', {})
  const photos = {}
  for (const p of places) if (p.photo) {
    const b = await loadPhoto(p.id)
    if (b) photos[p.id] = await blobToDataURL(b)
  }
  return { version: 1, exportedAt: Date.now(), walks, places, done, photos }
}

// ---- 백업 복원: 파일 내용을 그대로 믿지 않고 형식을 하나씩 확인 ----
const isObj = (x) => x && typeof x === 'object' && !Array.isArray(x)
const num = (x) => (typeof x === 'number' && Number.isFinite(x) ? x : null)
const str = (x, max = 500) => (typeof x === 'string' ? x.slice(0, max) : '')
const COURSE_IDS = new Set(COURSES.map((c) => c.id))
const ID_RE = /^[\w-]{1,40}$/
const PHOTO_RE = /^data:image\/(jpeg|png|webp|gif);base64,[A-Za-z0-9+/=]+$/
const MAX_PHOTO = 8 * 1024 * 1024 // dataURL 글자 수 기준

function cleanWalk(w) {
  if (!isObj(w) || !ID_RE.test(String(w.id)) || !COURSE_IDS.has(w.courseId) || num(w.startedAt) == null) return null
  const points = Array.isArray(w.points)
    ? w.points
        .filter((p) => Array.isArray(p) && num(p[0]) != null && num(p[1]) != null && num(p[2]) != null && Math.abs(p[0]) <= 90 && Math.abs(p[1]) <= 180)
        .map((p) => (p[3] === 1 || p[3] === 2 ? [p[0], p[1], p[2], p[3]] : [p[0], p[1], p[2]]))
    : []
  return {
    id: String(w.id), courseId: w.courseId, startedAt: w.startedAt, endedAt: num(w.endedAt) ?? undefined,
    points, distance: Math.max(0, num(w.distance) ?? 0), completed: !!w.completed,
    pausedMs: Math.max(0, num(w.pausedMs) ?? 0), gapMs: num(w.gapMs) ?? undefined, gapDist: num(w.gapDist) ?? undefined,
  }
}

function cleanPlace(p) {
  if (!isObj(p) || !ID_RE.test(String(p.id)) || !str(p.name).trim()) return null
  const lat = num(p.lat), lng = num(p.lng)
  const ok = lat != null && lng != null && Math.abs(lat) <= 90 && Math.abs(lng) <= 180
  return {
    id: String(p.id), createdAt: num(p.createdAt) ?? Date.now(), name: str(p.name, 100).trim(), memo: str(p.memo, 2000),
    rating: Math.min(5, Math.max(0, Math.round(num(p.rating) ?? 0))), courseId: COURSE_IDS.has(p.courseId) ? p.courseId : '',
    lat: ok ? lat : undefined, lng: ok ? lng : undefined, link: safeUrl(p.link), address: str(p.address, 200), photo: !!p.photo,
  }
}

function cleanDone(d) {
  const out = {}
  if (!isObj(d)) return out
  for (const [id, r] of Object.entries(d)) {
    if (!COURSE_IDS.has(id) || !isObj(r) || !/^\d{4}-\d{2}-\d{2}$/.test(r.date)) continue
    out[id] = { date: r.date, memo: str(r.memo, 2000), km: num(r.km) ?? undefined, minutes: num(r.minutes) ?? undefined, walkId: ID_RE.test(String(r.walkId)) ? String(r.walkId) : undefined }
  }
  return out
}

// 형식이 맞지 않으면 예외. 성공하면 복원한 개수를 돌려준다
export async function importAll(data) {
  if (!isObj(data) || (!Array.isArray(data.walks) && !Array.isArray(data.places) && !isObj(data.done))) throw new Error('not a backup')
  const walks = (data.walks || []).map(cleanWalk).filter(Boolean)
  const places = (data.places || []).map(cleanPlace).filter(Boolean)
  const done = cleanDone(data.done)
  const ids = new Set(places.map((p) => p.id))
  await set('walks', walks)
  await set('places', places)
  await set('done', done)
  let photos = 0
  for (const [id, dataUrl] of Object.entries(isObj(data.photos) ? data.photos : {})) {
    if (!ids.has(id) || typeof dataUrl !== 'string' || dataUrl.length > MAX_PHOTO || !PHOTO_RE.test(dataUrl)) continue
    const blob = await (await fetch(dataUrl)).blob() // data: 주소만 통과하므로 바깥으로 요청이 나가지 않음
    await set(`photo:${id}`, blob)
    photos++
  }
  return { walks: walks.length, places: places.length, done: Object.keys(done).length, photos }
}
