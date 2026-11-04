import { fmtKm, fmtDurationKo, fmtPace, fmtDate } from './geo'

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

function drawRoute(ctx, points, box) {
  if (!points || points.length < 2) return
  const lat0 = points[0][0]
  const k = Math.cos((lat0 * Math.PI) / 180)
  const xy = points.map(([lat, lng]) => [lng * k, -lat])
  const xs = xy.map((p) => p[0])
  const ys = xy.map((p) => p[1])
  const minX = Math.min(...xs), maxX = Math.max(...xs)
  const minY = Math.min(...ys), maxY = Math.max(...ys)
  const s = Math.min(box.w / (maxX - minX || 1e-9), box.h / (maxY - minY || 1e-9))
  const ox = box.x + (box.w - (maxX - minX) * s) / 2
  const oy = box.y + (box.h - (maxY - minY) * s) / 2
  const P = xy.map(([x, y]) => [ox + (x - minX) * s, oy + (y - minY) * s])

  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'
  ctx.beginPath()
  P.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)))
  ctx.strokeStyle = TANG
  ctx.lineWidth = box.w > 500 ? 12 : 8
  ctx.stroke()

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
    stamp = walk.points?.length > 1 ? [W - 230, 1290, 125] : [W / 2 + 60, 960, 210]
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

  drawRoute(ctx, walk.points, routeBox)
  drawStamp(ctx, ...stamp, date)

  // 통계
  const stats = []
  if (walk.distance > 0) stats.push(['거리', `${fmtKm(walk.distance)}`, 'km'])
  if (walk.endedAt && walk.startedAt && walk.endedAt > walk.startedAt) stats.push(['시간', fmtDurationKo(walk.endedAt - walk.startedAt), ''])
  if (walk.distance > 0) stats.push(['페이스', fmtPace(walk.endedAt - walk.startedAt, walk.distance), '/km'])
  if (placeCount > 0) stats.push(['맛집', `${placeCount}`, '곳'])

  const cols = stats.length === 4 ? 2 : Math.max(stats.length, 1)
  const rows = Math.ceil(stats.length / cols)
  const colW = (W - 160) / cols
  const top = 1660 - rows * 150
  if (stats.length) {
    ctx.fillStyle = INK
    ctx.fillRect(80, top - 20, W - 160, 3)
  }
  stats.forEach(([label, val, unit], i) => {
    const x = 80 + colW * (i % cols)
    const y = top + 50 + Math.floor(i / cols) * 150
    ctx.fillStyle = MUTED
    ctx.font = `500 34px ${FONT}`
    ctx.fillText(label, x, y)
    ctx.fillStyle = INK
    ctx.font = `700 66px ${SERIF}`
    ctx.fillText(val, x, y + 80)
    if (unit) {
      const w = ctx.measureText(val).width
      ctx.font = `500 32px ${FONT}`
      ctx.fillText(unit, x + w + 8, y + 80)
    }
  })

  ctx.fillStyle = MUTED
  ctx.font = `500 32px ${FONT}`
  ctx.fillText(`#제주올레 #올레${course.id}코스`, 80, 1830)

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
