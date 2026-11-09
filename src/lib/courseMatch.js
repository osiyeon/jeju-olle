// 위치를 올레 코스 경로에 맞추기: 가장 가까운 코스 찾기, 경로 위로 붙이기, 빈 구간 채우기용 경로 고르기
import { COURSES, courseById, courseTrack } from './courses'
import { fillAlongCourse, haversine } from './geo'

const M = 111320
const TRACKED = COURSES.filter((c) => courseTrack(c.id))

// 경로(구간들)에서 pt와 가장 가까운 점 → { lat, lng, d(m) }
export function nearestOnTrack(segs, pt) {
  if (!segs) return null
  const k = Math.cos((pt[0] * Math.PI) / 180)
  const px = pt[1] * M * k, py = pt[0] * M
  let best = null
  for (const seg of segs) {
    for (let i = 0; i < seg.length - 1; i++) {
      const ax = seg[i][1] * M * k, ay = seg[i][0] * M
      const bx = seg[i + 1][1] * M * k, by = seg[i + 1][0] * M
      const dx = bx - ax, dy = by - ay
      const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy || 1e-9)))
      const qx = ax + t * dx, qy = ay + t * dy
      const d = Math.hypot(qx - px, qy - py)
      // 경로의 맨 처음/맨 끝 점으로 붙는 경우 표시 (경로 밖으로 걸어 나간 것일 수 있음)
      const end = (i === 0 && t === 0) || (i === seg.length - 2 && t === 1)
      if (!best || d < best.d) best = { lat: qy / M, lng: qx / (M * k), d, end }
    }
  }
  return best
}

// pt에서 maxD(m) 안에 있는 가장 가까운 코스 → { id, d } | null
export function nearestCourse(pt, maxD = 400) {
  let best = null
  for (const c of TRACKED) {
    const n = nearestOnTrack(courseTrack(c.id), pt)
    if (n && n.d <= maxD && (!best || n.d < best.d)) best = { id: c.id, d: n.d }
  }
  return best
}

// 걷는 코스 경로를 고름: 선택한 코스가 가까우면 그것, 아니면 가장 가까운 다른 코스
function trackFor(courseId, pt, maxD) {
  const own = nearestOnTrack(courseTrack(courseId), pt)
  if (own && own.d <= maxD) return courseId
  return nearestCourse(pt, maxD)?.id || null
}

// GPS 오차로 길에서 벗어난 점을 코스 선 위로 붙임 (maxOff m 안일 때만). 아니면 원래 점
// 경로 끝점으로 붙는 경우는 그대로 둠: 경로 밖으로 걸어 나가면 모든 점이 끝점에 쌓여 거리가 안 늘기 때문
export function snapToCourse(courseId, pt, maxOff = 30) {
  const id = trackFor(courseId, pt, maxOff)
  if (!id) return pt
  const n = nearestOnTrack(courseTrack(id), pt)
  if (n.end) return pt
  return [n.lat, n.lng, ...pt.slice(2)]
}

// 화면이 꺼져 끊긴 a→b 구간을 코스 경로로 채움. 두 점이 같은 코스 근처일 때만
// → { pts, dist, courseId } | null
export function fillGap(courseId, a, b, maxOff = 400) {
  const ids = [courseId, nearestCourse(a, maxOff)?.id, nearestCourse(b, maxOff)?.id].filter(Boolean)
  for (const id of [...new Set(ids)]) {
    const segs = courseTrack(id)
    const c = courseById(id)
    const len = Math.max(...segs.map((sg) => sg.reduce((m, q, i) => (i ? m + haversine(sg[i - 1], q) : 0), 0)))
    const scale = c?.km && len ? Math.min(1, (c.km * 1000) / len) : 1
    const f = fillAlongCourse(segs, a, b, { maxOff, scale })
    if (f) return { ...f, courseId: id }
  }
  return null
}

// 위치가 이만큼 넘게 끊겼다가(화면 꺼짐 등) 이만큼 넘게 떨어진 곳에서 들어오면 빈 구간으로 봄
export const GAP_MS = 45000
export const GAP_M = 100

// 저장된 걷기를 (다른) 코스 기준으로 다시 계산: 점을 길에 붙이고, 빈 구간은 코스 경로로 채움
export function rebuildWalk(w, courseId) {
  const out = []
  let distance = 0, gapMs = 0, gapDist = 0
  for (const p of w.points || []) {
    if (p[3] === 2) continue // 예전에 채운 점은 버리고 다시 계산
    const q = snapToCourse(courseId, p)
    const last = out[out.length - 1]
    if (last && p[3] !== 1) {
      const dt = q[2] - last[2], d = haversine(last, q)
      if (dt > GAP_MS && d > GAP_M) {
        const f = fillGap(courseId, last, q)
        if (f) out.push(...f.pts.map((m, i) => [m[0], m[1], Math.round(last[2] + (dt * (i + 1)) / (f.pts.length + 1)), 2]))
        const gd = f ? f.dist : d
        distance += gd; gapDist += gd; gapMs += dt
      } else distance += d
    }
    out.push(p[3] === 1 ? [q[0], q[1], q[2], 1] : [q[0], q[1], q[2]])
  }
  return { ...w, courseId, points: out, distance, gapMs, gapDist }
}
