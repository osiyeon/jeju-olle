// 걷는 중 기록(active)을 세 군데에 저장한다.
// iOS Safari는 화면이 꺼진 사이 탭을 정리하고 저장소까지 비울 때가 있어서
// (1) IndexedDB (2) localStorage (3) 주소창 URL(?w=)에 시작 정보를 남겨 둔다.
// URL은 탭이 다시 불러와져도 남으므로, 최악의 경우에도 시작 시각·코스·시작점으로 이어서 계산할 수 있다.
import { load, lsGet, lsSet, save } from './store'
import { courseById } from './courses'

const LS_KEY = 'olle-active'
const SEP = '~'
const DECLINED = 'olle-declined-walk'

// 주소창 걷기 정보로 이어 걷기를 거절하면 다시 묻지 않음
export const declineUrlWalk = (id) => (lsSet(DECLINED, id), saveActive(null))

function writeUrl(a) {
  const u = new URL(location.href)
  if (a) {
    const s = a.points?.[0]
    u.searchParams.set('w', [a.id, a.courseId, a.startedAt, a.pausedMs || 0, a.pausedAt || 0, s ? s[0].toFixed(3) : '', s ? s[1].toFixed(3) : ''].join(SEP))
  } else u.searchParams.delete('w')
  if (u.href !== location.href) history.replaceState(null, '', u)
}

function readUrl() {
  const w = new URLSearchParams(location.search).get('w')
  if (!w) return null
  const [id, courseId, startedAt, pausedMs, pausedAt, lat, lng] = w.split(SEP)
  if (!id || !courseId || !courseById(courseId) || !+startedAt) return null
  if (Date.now() - +startedAt > 24 * 3600e3 || lsGet(DECLINED) === id) return null
  const a = { id, courseId, startedAt: +startedAt, pausedMs: +pausedMs || 0, pausedAt: +pausedAt || null, points: [], distance: 0, restoredFrom: 'url' }
  if (lat && lng) a.points.push([+lat, +lng, +startedAt])
  return a
}

export function saveActive(a) {
  save('active', a)
  lsSet(LS_KEY, a ? JSON.stringify(a) : null) // 실패해도 IndexedDB와 URL에는 남아 있음
  try {
    writeUrl(a)
  } catch {
    // history API를 못 쓰는 환경
  }
}

export async function loadActive() {
  const fromIdb = await load('active', null).catch(() => null)
  let fromLs = null
  try {
    fromLs = JSON.parse(lsGet(LS_KEY) || 'null')
  } catch {
    fromLs = null
  }
  // 둘 다 있으면 점이 더 많은(더 최근) 쪽
  const best = [fromIdb, fromLs].filter(Boolean).sort((x, y) => (y.points?.length || 0) - (x.points?.length || 0))[0]
  if (best) return best
  return readUrl()
}

// 브라우저에 "이 사이트 저장소는 지우지 말아 달라"고 요청 (지원하는 곳만)
export const askPersist = () => navigator.storage?.persist?.().catch(() => {})
