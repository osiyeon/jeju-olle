import { get, set, del } from 'idb-keyval'

export const load = async (key, fallback) => (await get(key)) ?? fallback
export const save = (key, value) => set(key, value)

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

export async function importAll(data) {
  await save('walks', data.walks || [])
  await save('places', data.places || [])
  await save('done', data.done || {})
  for (const [id, dataUrl] of Object.entries(data.photos || {})) {
    const blob = await (await fetch(dataUrl)).blob()
    await savePhoto(id, blob)
  }
}
