export function haversine(a, b) {
  const R = 6371000
  const toRad = (d) => (d * Math.PI) / 180
  const dLat = toRad(b[0] - a[0])
  const dLng = toRad(b[1] - a[1])
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(s))
}

export const fmtKm = (m) => (m / 1000).toFixed(m < 10000 ? 2 : 1)

export function fmtDuration(ms) {
  const s = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}` : `${m}:${String(sec).padStart(2, '0')}`
}

export function fmtDurationKo(ms) {
  const m = Math.round(ms / 60000)
  const h = Math.floor(m / 60)
  return h > 0 ? `${h}시간 ${m % 60}분` : `${m}분`
}

// 분/km
export function fmtPace(ms, m) {
  if (m < 50) return '-'
  const secPerKm = ms / 1000 / (m / 1000)
  const mm = Math.floor(secPerKm / 60)
  const ss = Math.round(secPerKm % 60)
  return `${mm}'${String(ss).padStart(2, '0')}"`
}

export const fmtDate = (t) => {
  const d = new Date(t)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

// 기기 시간대 기준 YYYY-MM-DD (toISOString은 UTC라 한국 오전 9시 전이면 전날이 됨)
export const localISO = (t = Date.now()) => {
  const d = new Date(t)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export const todayISO = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// 걸은 시간(쉬는 시간 제외). 진행 중이면 now 기준, 일시정지 중이면 멈춘 시점까지
export function walkMs(w, now = Date.now()) {
  if (!w?.startedAt) return 0
  const end = w.pausedAt || w.endedAt || now
  return Math.max(0, end - w.startedAt - (w.pausedMs || 0))
}

// 일시정지로 끊긴 경로를 구간별로 나눔. 점의 4번째 값이 1이면 새 구간 시작
export function segments(points = []) {
  const out = []
  for (const p of points) {
    if (!out.length || p[3] === 1) out.push([]) // 2는 화면 꺼진 구간을 코스로 채운 점(선은 이어짐)
    out[out.length - 1].push([p[0], p[1]])
  }
  return out
}

// ---- 화면이 꺼져 있던 구간을 코스 경로를 따라 채우기 ----
const M_PER_DEG = 111320
function project(seg, cum, pt) {
  const k = Math.cos((pt[0] * Math.PI) / 180)
  const xy = (q) => [q[1] * M_PER_DEG * k, q[0] * M_PER_DEG]
  const P = xy(pt)
  let best = null
  for (let i = 0; i < seg.length - 1; i++) {
    const A = xy(seg[i]), B = xy(seg[i + 1])
    const dx = B[0] - A[0], dy = B[1] - A[1]
    const L2 = dx * dx + dy * dy || 1e-9
    const t = Math.max(0, Math.min(1, ((P[0] - A[0]) * dx + (P[1] - A[1]) * dy) / L2))
    const d = Math.hypot(A[0] + t * dx - P[0], A[1] + t * dy - P[1])
    if (!best || d < best.d) best = { i, t, d, along: cum[i] + t * (cum[i + 1] - cum[i]) }
  }
  return best
}

// segs: 코스 경로 구간들, a/b: [lat, lng]. 둘 다 코스에서 maxOff(m) 안이면
// { pts: 사이의 코스 꼭짓점들, dist: 코스를 따라간 거리(m) }, 아니면 null
export function fillAlongCourse(segs, a, b, { maxOff = 400, scale = 1 } = {}) {
  if (!segs) return null
  for (const seg of segs) {
    if (seg.length < 2) continue
    const cum = [0]
    for (let i = 1; i < seg.length; i++) cum.push(cum[i - 1] + haversine(seg[i - 1], seg[i]))
    const pa = project(seg, cum, a), pb = project(seg, cum, b)
    if (pa.d > maxOff || pb.d > maxOff) continue
    const pts = []
    if (pa.along <= pb.along) for (let i = pa.i + 1; i <= pb.i; i++) pts.push(seg[i])
    else for (let i = pa.i; i > pb.i; i--) pts.push(seg[i])
    return { pts, dist: Math.abs(pb.along - pa.along) * scale + pa.d + pb.d }
  }
  return null
}
