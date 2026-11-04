# CLAUDE.md

제주올레길 걷기 기록 모바일 웹앱 "올레 기록장". 사용자가 제주에서 직접 걸으며 아이폰 Safari로 쓴다.

## 목적
- 올레길 걷기 경로(GPS) 기록, 코스 완주 스탬프북, 걷다가 맛집 저장, 완주 카드 SNS 공유
- 일정: 2026-11-05 19코스(조천-김녕), 2026-11-06 20코스(김녕-하도)
- 프로젝트 문서(노션): https://app.notion.com/p/40ebb7ca021f80a0a0f6fedbcbff7a64

## 스택 · 원칙
- React 19 + Vite (JS, Next.js 안 씀), Leaflet + OpenStreetMap (react-leaflet 없이 직접), idb-keyval
- 서버 없음. 모든 데이터는 기기 IndexedDB (`walks`, `places`, `done`, `active`, `photo:<id>`)
- 빠르게 만들고 바로 쓰는 게 우선. 의존성 추가는 최소화
- UI 문구는 한국어

## 구조
- `src/App.jsx` — 탭 4개(걷기/코스/맛집/기록), GPS watchPosition, 걷기 시작/종료, Wake Lock
- `src/components/MapView.jsx` — Leaflet 지도 (경로, 내 위치, 맛집 핀, 코스 시작/종점)
- `src/components/Modals.jsx` — 바텀시트: 맛집 저장, 공유 카드, 코스 기록
- `src/lib/courses.js` — 코스 27개. 19·20코스만 시작/종점 좌표(근사값)
- `src/lib/geo.js` — haversine, 포맷 함수
- `src/lib/store.js` — IndexedDB, 사진 리사이즈, 백업/복원
- `src/lib/shareCard.js` — 1080×1920 공유 카드 Canvas 렌더 + Web Share

## GPS 규칙
오차 50m 초과 버림, 8m 미만 이동 무시, 초속 12m 초과(순간이동) 무시. 진행 중 기록은 점마다 `active` 키에 저장 → 새로고침해도 이어짐.

## 개발 · 테스트
- `npm run dev` → `http://localhost:5173/?sim` 은 가짜 GPS(코스 시작→종점 이동)
- `npm run build`, `npm run lint`(oxlint)
- E2E는 Playwright로 iPhone 13 에뮬레이션 + `context.setGeolocation` 사용. 실제 걷는 속도(초당 ~10m 이하)로 움직여야 필터에 안 걸림

## 배포
- `main` push → GitHub Actions(`.github/workflows/deploy.yml`) → GitHub Pages
- https://osiyeon.github.io/jeju-olle/ · 저장소 https://github.com/osiyeon/jeju-olle
- `vite.config.js`의 `base: './'` 덕분에 서브경로/커스텀 도메인 모두 동작. 커스텀 도메인은 아직 미연결(`public/CNAME` 추가 필요)

## 알려진 제약
- iOS Safari는 화면이 꺼지면 GPS가 멈춘다 (모바일 웹 한계)
- 코스 좌표는 근사값. 공식 GPX 미적용
