import { fmtKm, fmtDurationKo, fmtPace, fmtDate } from './geo'

const FONT = '-apple-system, "Apple SD Gothic Neo", "Noto Sans KR", sans-serif'
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
  const stroke = (color, width) => {
    ctx.beginPath()
    P.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)))
    ctx.strokeStyle = color
    ctx.lineWidth = width
    ctx.stroke()
  }
  stroke('rgba(255,255,255,0.95)', 26)
  stroke('#F28C28', 14)

  const dot = ([x, y], fill) => {
    ctx.beginPath()
    ctx.arc(x, y, 20, 0, Math.PI * 2)
    ctx.fillStyle = '#fff'
    ctx.fill()
    ctx.beginPath()
    ctx.arc(x, y, 12, 0, Math.PI * 2)
    ctx.fillStyle = fill
    ctx.fill()
  }
  dot(P[0], '#2E9E5B')
  dot(P[P.length - 1], '#D8432F')
}

export async function makeShareCard({ walk, course, photoBlob, placeCount = 0 }) {
  const c = document.createElement('canvas')
  c.width = W
  c.height = H
  const ctx = c.getContext('2d')

  // 바다 그라데이션 배경
  const g = ctx.createLinearGradient(0, 0, 0, H)
  g.addColorStop(0, '#0B4F7A')
  g.addColorStop(1, '#1D86BF')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, W, H)

  let routeBox = { x: 120, y: 560, w: 840, h: 700 }
  if (photoBlob) {
    const img = await loadImg(photoBlob)
    drawCover(ctx, img, 0, 0, W, 1080)
    const fade = ctx.createLinearGradient(0, 700, 0, 1080)
    fade.addColorStop(0, 'rgba(11,79,122,0)')
    fade.addColorStop(1, 'rgba(11,79,122,1)')
    ctx.fillStyle = fade
    ctx.fillRect(0, 700, W, 380)
    routeBox = { x: 700, y: 1100, w: 280, h: 260 }
  }

  // 텍스트
  ctx.fillStyle = '#fff'
  ctx.textBaseline = 'alphabetic'
  const titleY = photoBlob ? 1210 : 260
  ctx.font = `600 44px ${FONT}`
  ctx.fillStyle = '#FFD7A8'
  ctx.fillText('JEJU OLLE · 제주올레', 80, titleY - 110)
  ctx.fillStyle = '#fff'
  ctx.font = `800 150px ${FONT}`
  ctx.fillText(`${course.id}코스`, 72, titleY + 30)
  ctx.font = `600 52px ${FONT}`
  ctx.fillText(course.name, 80, titleY + 110)
  ctx.font = `500 40px ${FONT}`
  ctx.fillStyle = 'rgba(255,255,255,0.8)'
  ctx.fillText(`${fmtDate(walk.startedAt)} 완주`, 80, titleY + 175)

  drawRoute(ctx, walk.points, routeBox)

  // 통계
  const stats = []
  if (walk.distance > 0) stats.push(['거리', `${fmtKm(walk.distance)}km`])
  if (walk.endedAt && walk.startedAt && walk.endedAt > walk.startedAt) stats.push(['시간', fmtDurationKo(walk.endedAt - walk.startedAt)])
  if (walk.distance > 0) stats.push(['페이스', `${fmtPace(walk.endedAt - walk.startedAt, walk.distance)}/km`])
  if (placeCount > 0) stats.push(['맛집', `${placeCount}곳`])

  // 4개면 2x2, 아니면 한 줄
  const cols = stats.length === 4 ? 2 : Math.max(stats.length, 1)
  const rows = Math.ceil(stats.length / cols)
  const colW = (W - 160) / cols
  stats.forEach(([label, val], i) => {
    const x = 80 + colW * (i % cols)
    const y = 1640 - (rows - 1) * 150 + Math.floor(i / cols) * 150 - 80
    ctx.fillStyle = 'rgba(255,255,255,0.7)'
    ctx.font = `500 36px ${FONT}`
    ctx.fillText(label, x, y)
    ctx.fillStyle = '#fff'
    ctx.font = `800 64px ${FONT}`
    ctx.fillText(val, x, y + 80)
  })

  // 하단 리본
  ctx.fillStyle = '#F28C28'
  ctx.fillRect(80, 1740, 120, 14)
  ctx.fillStyle = '#5FC3F0'
  ctx.fillRect(210, 1740, 120, 14)
  ctx.fillStyle = 'rgba(255,255,255,0.85)'
  ctx.font = `500 36px ${FONT}`
  ctx.fillText(`#제주올레 #올레${course.id}코스 #올레길`, 80, 1820)

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
