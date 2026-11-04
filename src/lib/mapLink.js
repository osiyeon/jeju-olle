// 네이버 지도 / 카카오맵 앱에서 "공유 → 복사"한 글을 해석한다.
// 예) "[네이버 지도]\n자매국수 본점\n제주 제주시 항골남길 46\nhttps://naver.me/xxxx"
//     "[카카오맵] 자매국수 본점\n제주 제주시 항골남길 46\nhttps://kko.to/xxxx"
//     "https://place.map.kakao.com/12345"  (링크만)
const URL_RE = /https?:\/\/[^\s<>"']+/
const PREFIX_RE = /^\[\s*(네이버\s*지도|naver\s*map|카카오\s*맵|kakao\s*map|구글\s*지도|google\s*maps?)\s*\]\s*/i

export function parseShared(text = '') {
  const url = text.match(URL_RE)?.[0] || ''
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.replace(URL_RE, '').replace(PREFIX_RE, '').trim())
    .filter(Boolean)
  return { url, name: lines[0] || '', address: lines[1] || '' }
}

export function mapSource(url = '') {
  if (/naver\.(me|com)/.test(url)) return '네이버 지도'
  if (/kko\.to|kakao\.com/.test(url)) return '카카오맵'
  if (/goo\.gl|google\./.test(url)) return '구글 지도'
  return '지도 링크'
}

// 가게 찾기용 검색 링크 (iOS에서 앱이 깔려 있으면 앱으로 열림)
export const searchLinks = (name) => {
  const q = encodeURIComponent(`제주 ${name}`.trim())
  return [
    ['네이버 지도', `https://map.naver.com/p/search/${q}`],
    ['카카오맵', `https://map.kakao.com/?q=${q}`],
  ]
}

// 클립보드에서 읽기. 안 되면(권한·브라우저) null
export async function readClipboard() {
  try {
    return await navigator.clipboard.readText()
  } catch {
    return null
  }
}
