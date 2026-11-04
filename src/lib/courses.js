import TRACKS from './courseTracks.json'

// 제주올레 정규 코스 27개 (3코스·15코스의 A/B는 하나로 취급)
// km: 공식 안내 거리 (A/B 코스는 A 기준, kmNote에 둘 다)
// start/end: 19·20코스만. OSM의 올레 시작점 표지(guidepost) 좌표 기준
export const COURSES = [
  { id: '1', name: '시흥-광치기 올레', km: 15.1 },
  { id: '1-1', name: '우도 올레', km: 13.1 },
  { id: '2', name: '광치기-온평 올레', km: 15.6 },
  { id: '3', name: '온평-표선 올레 (A/B)', km: 20.9, kmNote: 'A 20.9km · B 14.6km' },
  { id: '4', name: '표선-남원 올레', km: 19 },
  { id: '5', name: '남원-쇠소깍 올레', km: 13.4 },
  { id: '6', name: '쇠소깍-제주올레 여행자센터 올레', km: 11 },
  { id: '7', name: '제주올레 여행자센터-월평 올레', km: 17.6 },
  { id: '7-1', name: '월드컵경기장-제주올레 여행자센터 올레', km: 15.7 },
  { id: '8', name: '월평-대평 올레', km: 19.6 },
  { id: '9', name: '대평-화순 올레', km: 11.8 },
  { id: '10', name: '화순-모슬포 올레', km: 15.6 },
  { id: '10-1', name: '가파도 올레', km: 4.2 },
  { id: '11', name: '모슬포-무릉 올레', km: 17.3 },
  { id: '12', name: '무릉-용수 올레', km: 17.5 },
  { id: '13', name: '용수-저지 올레', km: 16.2 },
  { id: '14', name: '저지-한림 올레', km: 19.1 },
  { id: '14-1', name: '저지-서광 올레', km: 9.3 },
  { id: '15', name: '한림-고내 올레 (A/B)', km: 16.5, kmNote: 'A 16.5km · B 13km' },
  { id: '16', name: '고내-광령 올레', km: 15.8 },
  { id: '17', name: '광령-제주원도심 올레', km: 18.1 },
  { id: '18', name: '제주원도심-조천 올레', km: 19.8 },
  { id: '18-1', name: '상추자 올레', km: 11.4 },
  { id: '18-2', name: '하추자 올레', km: 9.7 },
  {
    id: '19', name: '조천-김녕 올레', km: 19.4,
    start: { name: '조천 만세동산', lat: 33.53968, lng: 126.64191 },
    end: { name: '김녕 서포구', lat: 33.5575, lng: 126.745 },
  },
  {
    id: '20', name: '김녕-하도 올레', km: 17.6,
    start: { name: '김녕 서포구', lat: 33.5575, lng: 126.745 },
    end: { name: '제주해녀박물관', lat: 33.52209, lng: 126.86354 },
  },
  { id: '21', name: '하도-종달 올레', km: 11.3 },
]

export const courseById = (id) => COURSES.find((c) => c.id === id)

// 코스 경로: OpenStreetMap 기여자 데이터(ODbL)를 단순화한 것. 공식 경로와 다를 수 있음.
// [[ [lat, lng], ... ], ...] 구간 배열. 없는 코스는 null
export const courseTrack = (id) => TRACKS[id]?.segs || null
