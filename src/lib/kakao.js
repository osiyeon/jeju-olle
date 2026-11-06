// 카카오 지도 JavaScript SDK의 주소·장소 검색으로 가게 좌표 찾기.
// 키는 VITE_KAKAO_JS_KEY (JavaScript 키는 브라우저에 노출되는 용도라 공개돼도 되고,
// 카카오 개발자 콘솔에 등록한 도메인에서만 동작). 키가 없으면 모든 함수가 null을 돌려준다.
const KEY = import.meta.env.VITE_KAKAO_JS_KEY || ''
let sdk = null

export const kakaoReady = () => !!KEY

function loadSdk() {
  if (!KEY) return Promise.resolve(null)
  if (!sdk) {
    sdk = new Promise((resolve) => {
      const s = document.createElement('script')
      s.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KEY}&libraries=services&autoload=false`
      s.onload = () => window.kakao.maps.load(() => resolve(window.kakao))
      s.onerror = () => resolve(null)
      document.head.appendChild(s)
    })
  }
  return sdk
}

const withTimeout = (p, ms = 6000) => Promise.race([p, new Promise((r) => setTimeout(() => r(null), ms))])

// 도로명/지번 주소 → { lat, lng }
export async function geocodeAddress(address) {
  const kakao = await loadSdk()
  if (!kakao || !address) return null
  return withTimeout(
    new Promise((resolve) => {
      new kakao.maps.services.Geocoder().addressSearch(address, (res, status) =>
        resolve(status === kakao.maps.services.Status.OK && res[0] ? { lat: +res[0].y, lng: +res[0].x } : null),
      )
    }),
  )
}

// 가게 이름 → { lat, lng, name, address, url }
// 거리순 정렬은 이름이 덜 맞아도 가까운 곳을 고르기 쉬워서 쓰지 않는다(정확도순).
// 결과 중 제주 주소만 남기고, 이름이 정확히(공백 무시) 맞는 곳 → 이름을 포함하는 곳 → 첫 결과 순으로 고른다.
export async function searchPlace(name) {
  const kakao = await loadSdk()
  if (!kakao || !name) return null
  const norm = (x) => String(x || '').replace(/\s/g, '')
  const q = norm(name)
  return withTimeout(
    new Promise((resolve) => {
      new kakao.maps.services.Places().keywordSearch(`제주 ${name}`, (res, status) => {
        if (status !== kakao.maps.services.Status.OK) return resolve(null)
        const jeju = res.filter((r) => /^제주/.test(r.road_address_name || r.address_name))
        const r = jeju.find((x) => norm(x.place_name) === q) || jeju.find((x) => norm(x.place_name).includes(q)) || jeju[0]
        resolve(r ? { lat: +r.y, lng: +r.x, name: r.place_name, address: r.road_address_name || r.address_name, url: r.place_url } : null)
      })
    }),
  )
}

// 지도 앱에서 붙여넣은 정보로 가게 위치 찾기: 주소 우선, 없으면 이름 검색
// via: 'address'(주소로 찾음, 정확) | 'name'(이름 검색 첫 결과, 다른 가게일 수 있음)
export async function locatePlace({ address, name }) {
  const byAddr = await geocodeAddress(address)
  if (byAddr) return { ...byAddr, via: 'address' }
  const byName = await searchPlace(name)
  return byName ? { ...byName, via: 'name' } : null
}
