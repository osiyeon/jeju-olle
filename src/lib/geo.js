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

export const todayISO = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
