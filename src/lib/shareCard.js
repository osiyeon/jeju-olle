import { fmtKm, fmtPace, fmtDate } from './geo'
import { courseTrack } from './courses'

const FONT = '-apple-system, "Apple SD Gothic Neo", "Noto Sans KR", sans-serif'
const SERIF = 'AppleMyungjo, "Nanum Myeongjo", "Noto Serif KR", serif'
const PAPER = '#F3EFE6'
const INK = '#24221E'
const MUTED = '#827B6E'
const TANG = '#DC6B25'
const SEA = '#24577A'
const STAMP = '#B8432C'
const W = 1080
const H = 1920

function loadImg(blob) {
  return new Promise((res, rej) => {
    const url = URL.createObjectURL(blob)
    const img = new Image()
    img.onload = () => res(img)
    img.onerror = rej
    img.src = url
  })
}

function drawCover(ctx, img, x, y, w, h) {
  const s = Math.max(w / img.naturalWidth, h / img.naturalHeight)
  const iw = img.naturalWidth * s
  const ih = img.naturalHeight * s
  ctx.save()
  ctx.beginPath()
  ctx.rect(x, y, w, h)
  ctx.clip()
  ctx.drawImage(img, x + (w - iw) / 2, y + (h - ih) / 2, iw, ih)
  ctx.restore()
}

// 걸은 경로(walk)와 코스 경로(course, 구간 배열)를 같은 축척으로 그림.
// 걸은 경로가 없으면 코스 경로를 주인공으로 그린다.
function drawRoute(ctx, walkPts, courseSegs, box, ends) {
  const walk = walkPts?.length > 1 ? walkPts : null
  const course = courseSegs?.length ? courseSegs : null
  if (!walk && !course) return false
  const all = [...(walk || []), ...(course || []).flat()]
  const k = Math.cos((all[0][0] * Math.PI) / 180)
  const xs = all.map((p) => p[1] * k)
  const ys = all.map((p) => -p[0])
  const minX = Math.min(...xs), maxX = Math.max(...xs)
  const minY = Math.min(...ys), maxY = Math.max(...ys)
  const s = Math.min(box.w / (maxX - minX || 1e-9), box.h / (maxY - minY || 1e-9))
  const ox = box.x + (box.w - (maxX - minX) * s) / 2
  const oy = box.y + (box.h - (maxY - minY) * s) / 2
  const proj = (pts) => pts.map(([lat, lng]) => [ox + (lng * k - minX) * s, oy + (-lat - minY) * s])
  const big = box.w > 500
  const line = (P, color, width, dash = []) => {
    ctx.beginPath()
    P.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)))
    ctx.setLineDash(dash)
    ctx.strokeStyle = color
    ctx.lineWidth = width
    ctx.stroke()
    ctx.setLineDash([])
  }
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'

  if (course) {
    // 걸은 경로가 있으면 코스는 옅은 점선으로 뒤에, 없으면 진하게
    course.forEach((seg) => line(proj(seg), walk ? 'rgba(36,87,122,0.35)' : TANG, walk ? (big ? 6 : 4) : big ? 12 : 8, walk ? [2, big ? 16 : 11] : []))
  }
  let P
  if (walk) {
    P = proj(walk)
    line(P, TANG, big ? 12 : 8)
  } else {
    // 코스만 그릴 때: 공식 시작/종점에 가장 가까운 선 끝에 점. 좌표 없는 코스는 점 생략
    if (!ends) return true
    const tips = course.flatMap((seg) => [seg[0], seg[seg.length - 1]])
    const near = (pt) => tips.reduce((a, b) => (dist2(a, pt) <= dist2(b, pt) ? a : b))
    P = proj([near(ends[0]), near(ends[1])])
  }

  const r = box.w > 500 ? 14 : 10
  const [sx, sy] = P[0]
  ctx.beginPath()
  ctx.arc(sx, sy, r, 0, Math.PI * 2)
  ctx.fillStyle = PAPER
  ctx.fill()
  ctx.lineWidth = 5
  ctx.strokeStyle = INK
  ctx.stroke()
  const [ex, ey] = P[P.length - 1]
  ctx.beginPath()
  ctx.arc(ex, ey, r, 0, Math.PI * 2)
  ctx.fillStyle = INK
  ctx.fill()
  return true
}

// 고무 도장 느낌의 완주 스탬프
function drawStamp(ctx, cx, cy, r, date) {
  ctx.save()
  ctx.translate(cx, cy)
  ctx.rotate(-0.22)
  ctx.globalAlpha = 0.86
  ctx.strokeStyle = STAMP
  ctx.fillStyle = STAMP
  ctx.lineWidth = 7
  ctx.beginPath()
  ctx.arc(0, 0, r, 0, Math.PI * 2)
  ctx.stroke()
  ctx.lineWidth = 2.5
  ctx.beginPath()
  ctx.arc(0, 0, r - 14, 0, Math.PI * 2)
  ctx.stroke()
  ctx.textAlign = 'center'
  ctx.font = `700 ${Math.round(r * 0.5)}px ${SERIF}`
  ctx.fillText('완주', 0, r * 0.08)
  ctx.font = `600 ${Math.round(r * 0.2)}px ${FONT}`
  ctx.fillText(date, 0, r * 0.45)
  ctx.restore()
}

// 5시간 12분 → ['5', '시간', '12', '분']
function durParts(ms) {
  const m = Math.round(ms / 60000)
  const h = Math.floor(m / 60)
  return h > 0 ? [String(h), '시간', String(m % 60), '분'] : [String(m), '분']
}

const dist2 = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2

export async function makeShareCard({ walk, course, photoBlob, placeCount = 0 }) {
  const c = document.createElement('canvas')
  c.width = W
  c.height = H
  const ctx = c.getContext('2d')
  const date = fmtDate(walk.startedAt)

  ctx.fillStyle = PAPER
  ctx.fillRect(0, 0, W, H)

  // 올레 리본 (주황·파랑)
  const ribbon = (x, y) => {
    ctx.fillStyle = TANG
    ctx.fillRect(x, y, 16, 90)
    ctx.fillStyle = SEA
    ctx.fillRect(x + 22, y, 16, 90)
  }

  let titleY, routeBox, stamp
  if (photoBlob) {
    const img = await loadImg(photoBlob)
    drawCover(ctx, img, 60, 60, W - 120, 860)
    titleY = 1000
    routeBox = { x: 660, y: 1010, w: 340, h: 320 }
    stamp = [W - 190, 860, 115]
  } else {
    ribbon(W - 140, 0)
    titleY = 140
    routeBox = { x: 100, y: 660, w: 880, h: 620 }
    stamp = walk.points?.length > 1 || courseTrack(course.id) ? [W - 230, 1290, 125] : [W / 2 + 60, 960, 210]
  }

  ctx.textBaseline = 'alphabetic'
  ctx.textAlign = 'left'
  ctx.fillStyle = MUTED
  ctx.font = `600 38px ${FONT}`
  ctx.fillText('제주올레', 80, titleY + 40)
  ctx.fillStyle = INK
  ctx.font = `700 ${photoBlob ? 180 : 230}px ${SERIF}`
  const numY = titleY + (photoBlob ? 210 : 270)
  ctx.fillText(course.id, 70, numY)
  const numW = ctx.measureText(course.id).width
  ctx.font = `700 ${photoBlob ? 64 : 80}px ${SERIF}`
  ctx.fillText('코스', 70 + numW + 16, numY)
  ctx.font = `500 50px ${FONT}`
  ctx.fillText(course.name, 80, numY + 90)
  ctx.fillStyle = MUTED
  ctx.font = `500 38px ${FONT}`
  ctx.fillText(date, 80, numY + 150)

  const ends = course.start && [[course.start.lat, course.start.lng], [course.end.lat, course.end.lng]]
  drawRoute(ctx, walk.points, courseTrack(course.id), routeBox, ends)
  drawStamp(ctx, ...stamp, date)

  // 거리 · 시간을 크게, 페이스 · 맛집은 아래 한 줄로
  const ms = walk.endedAt && walk.startedAt ? walk.endedAt - walk.startedAt : 0
  const hero = []
  if (walk.distance > 0) hero.push(['거리', [fmtKm(walk.distance), 'km']])
  if (ms > 0) hero.push(['걸린 시간', durParts(ms)])
  const sub = []
  if (walk.distance > 0 && ms > 0) sub.push(`페이스 ${fmtPace(ms, walk.distance)}/km`)
  if (placeCount > 0) sub.push(`맛집 ${placeCount}곳`)

  if (hero.length) {
    ctx.fillStyle = INK
    ctx.fillRect(80, 1460, W - 160, 3)
    const colW = (W - 160) / 2
    hero.forEach(([label, parts], i) => {
      const x = 80 + colW * i
      ctx.fillStyle = MUTED
      ctx.font = `500 34px ${FONT}`
      ctx.fillText(label, x, 1530)
      // [값, 단위, 값, 단위...] 를 이어서 그림
      let cx = x
      for (let k = 0; k < parts.length; k++) {
        const isUnit = k % 2 === 1
        ctx.fillStyle = INK
        ctx.font = isUnit ? `500 38px ${FONT}` : `700 104px ${SERIF}`
        ctx.fillText(parts[k], cx, 1645)
        cx += ctx.measureText(parts[k]).width + (isUnit ? 18 : 8)
      }
    })
  }
  if (sub.length) {
    ctx.fillStyle = MUTED
    ctx.font = `500 34px ${FONT}`
    ctx.fillText(sub.join('   ·   '), 80, 1730)
  }

  ctx.fillStyle = MUTED
  ctx.font = `500 32px ${FONT}`
  ctx.fillText(`#제주올레 #올레${course.id}코스`, 80, 1830)
  if (courseTrack(course.id)) {
    ctx.textAlign = 'right'
    ctx.font = `500 22px ${FONT}`
    ctx.fillText('코스 경로 © OpenStreetMap', W - 80, 1830)
    ctx.textAlign = 'left'
  }

  return new Promise((res) => c.toBlob(res, 'image/jpeg', 0.92))
}

export async function shareOrDownload(blob, filename, text) {
  const file = new File([blob], filename, { type: blob.type })
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], text })
      return 'shared'
    } catch (e) {
      if (e.name === 'AbortError') return 'cancelled'
    }
  }
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  a.click()
  return 'downloaded'
}
