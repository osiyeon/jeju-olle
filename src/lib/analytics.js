// 방문 통계 (GoatCounter: 쿠키 없음, 개인 식별 없음)
// - 실제 사이트에서만 집계, 사이트 코드는 VITE_GOATCOUNTER (없으면 아무것도 안 함)
// - 주소는 항상 '/'로만 보냄: 주소창의 ?w=(걷기 시작 위치·시각)가 통계로 새지 않게
// - 기능 사용은 이름만 셈 (위치·기록 내용은 보내지 않음)
const CODE = import.meta.env.VITE_GOATCOUNTER || ''
const PROD_HOST = 'jeju-olle.norara.app'
export const analyticsOn = () => !!CODE && location.hostname === PROD_HOST

// GoatCounter는 주소창의 물음표 뒷부분(?w= 걷기 위치 등)을 q로 따로 보낸다.
// 보내는 순간에만 주소를 '/'로 바꿨다가 되돌려서 아무 쿼리도 새지 않게 함 (count는 동기로 데이터를 만듦)
function countClean(opts) {
  const saved = location.href
  try {
    history.replaceState(history.state, '', location.pathname)
    window.goatcounter?.count?.(opts)
  } catch {
    // 통계 실패는 앱 동작과 무관
  } finally {
    if (location.href !== saved) history.replaceState(history.state, '', saved)
  }
}

// 출처 정보(referrer)가 비어 있을 때: 앱 안 브라우저 이름으로 어디서 열었는지 추정
// (인스타그램·카톡 등은 링크를 앱 안 브라우저로 열고, 이때 referrer가 비는 경우가 많음)
function inAppSource() {
  const ua = navigator.userAgent
  if (/Instagram/i.test(ua)) return 'instagram.com'
  if (/KAKAOTALK/i.test(ua)) return 'kakaotalk'
  if (/FBAN|FBAV|FB_IAB/i.test(ua)) return 'facebook.com'
  if (/Barcelona|Threads/i.test(ua)) return 'threads.net'
  if (/NAVER\(inapp/i.test(ua)) return 'naver app'
  if (/ Line\//i.test(ua)) return 'line'
  return ''
}

export function initAnalytics() {
  if (!analyticsOn()) return
  const params = new URLSearchParams(location.search)
  const ref = params.get('ref') || params.get('utm_source')
  const s = document.createElement('script')
  s.async = true
  s.src = 'https://gc.zgo.at/count.js'
  s.dataset.goatcounter = `https://${CODE}.goatcounter.com/count`
  s.dataset.goatcounterSettings = JSON.stringify({ no_onload: true })
  s.onload = () => {
    countClean({ path: '/', title: '올레 기록장', referrer: ref || document.referrer || inAppSource() })
    // 유입 꼬리표는 집계 후 주소창에서 지움 (홈 화면에 추가할 때 남지 않게)
    if (ref) {
      const u = new URL(location.href)
      u.searchParams.delete('ref')
      u.searchParams.delete('utm_source')
      history.replaceState(null, '', u)
    }
  }
  document.head.appendChild(s)
}

// 기능 사용 횟수 (예: track('walk-start', '걷기 시작'))
export function track(name, title) {
  if (!analyticsOn()) return
  countClean({ path: name, title, event: true })
}
