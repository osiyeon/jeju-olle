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
- 디자인: 손그림 + 제주. 제목·숫자·버튼은 손글씨체 Gaegu(Google Fonts, `index.html`), 본문은 시스템 고딕. 삐뚤한 테두리(`--wobble`) + 스티커 그림자. 간세(올레 공식 캐릭터)는 상표라 쓰지 않음

## 구조
- `src/App.jsx` — 탭 4개(걷기/코스/맛집/기록), GPS watchPosition, 걷기 시작/종료, Wake Lock
- `src/components/MapView.jsx` — Leaflet 지도 (경로, 내 위치, 맛집 핀, 코스 시작/종점)
- `src/components/Modals.jsx` — 바텀시트: 맛집 저장, 공유 카드, 코스 기록
- `src/lib/courses.js` — 코스 27개 + 공식 거리(km). 19·20코스만 시작/종점 좌표(OSM 올레 시작점 표지 기준)
- `src/lib/courseTracks.json` — 코스 경로(OSM relation을 단순화). 1·2·4·6·16·18·19·20코스만. 3·5·7은 OSM 데이터가 공식 거리와 크게 달라 뺐음
- `src/lib/geo.js` — haversine, 포맷 함수, `walkMs`(쉬는 시간 뺀 걸은 시간), `segments`
- `src/lib/kakao.js` — 카카오 지도 JS SDK 주소·장소 검색으로 맛집 좌표 찾기. 키는 `VITE_KAKAO_JS_KEY`: 로컬은 `.env.local`(git 제외), 배포는 저장소 Actions 변수 → `deploy.yml`에서 빌드에 주입. 키가 없으면 건너뛰고 사용자가 지도에서 위치를 고름. 카카오 개발자 콘솔에 도메인(https://jeju-olle.norara.app, http://localhost:5173) 등록 필요
- `src/lib/analytics.js` — GoatCounter 방문 통계(쿠키 없음). `VITE_GOATCOUNTER`(Actions 변수) 있을 때 실제 도메인에서만. 주소는 항상 `/`로 보내 `?w=`가 새지 않게, `?ref=` 유입 꼬리표는 집계 후 지움(필수 아님: referrer가 비면 앱 안 브라우저 이름으로 인스타·카톡 등 유입을 추정). GoatCounter가 주소창 쿼리를 q로 따로 보내므로 보내는 순간만 주소를 '/'로 바꿨다 되돌림(`countClean`). 기능은 이름만(`track`)
- `src/lib/mapLink.js` — 네이버 지도/카카오맵 "공유 → 복사" 글에서 링크·이름·주소 추출. 맛집 `link`, `address` 필드
- `src/lib/store.js` — IndexedDB, 사진 리사이즈, 백업/복원
- `src/lib/shareCard.js` — 1080×1920 공유 카드 Canvas 렌더 + Web Share
- `src/lib/doodles.js` — 손그림 낙서(귤, 돌하르방, 돌담, 오름, 동백, 파도, 그릇) path 데이터. 화면 SVG(`components/Doodle.jsx`)와 공유 카드 Canvas가 같이 씀

## GPS 규칙
오차 35m 초과 버림(실제로 걸어 보니 50m는 길에서 많이 벗어남), 8m 미만 이동 무시, 초속 12m 초과(순간이동) 무시. 진행 중 기록은 점마다 `lib/walkState.js`의 `saveActive`로 IndexedDB(`active`) + localStorage(`olle-active`) + 주소창 `?w=id~코스~시작시각~쉰ms~쉼시작~위도~경도` 세 군데에 저장. iOS Safari가 화면 꺼진 사이 탭을 다시 불러오며 저장소를 비워도 URL로 이어서 계산(11/5 19코스에서 걷기가 통째로 사라졌던 문제).
코스 맞추기는 `lib/courseMatch.js`:
- 코스 경로에서 30m 안의 점은 선 위로 붙임(`snapToCourse`). 경로 끝점으로 붙는 경우는 그대로(경로 밖으로 걸어 나가면 끝점에 점이 쌓이므로)
- 화면 꺼짐 등으로 위치가 45초 넘게 안 들어오다 100m 넘게 떨어진 곳에서 들어오면 그 사이를 코스 경로로 채움(`fillGap`, 점 플래그 2, 거리는 공식 km/OSM 길이 비율로 보정). **선택한 코스가 아니어도** 두 점 근처 코스가 있으면 그 경로를 씀. 코스 밖이면 직선
- 지금 위치가 다른 코스 위면(300m 안, 선택한 코스는 800m 밖) "N코스로 바꾸기" 제안. 걷는 중에도 바꿀 수 있음 (11/7 20코스를 19코스로 선택한 채 걸어서 빈 구간이 직선으로 나온 문제)
- 저장된 걷기는 기록 상세에서 코스를 바꾸거나 "코스 경로에 맞춰 다시 계산" → `rebuildWalk`, 완주 도장도 옮김 화면이 다시 보이면 watchPosition 재시작(`gpsKey`).
일시정지: `active.pausedAt`/`pausedMs`/`resumedAt`. 쉬는 동안 점을 안 받고, 다시 걸을 때 첫 점은 `[lat,lng,t,1]`(새 구간)로 넣어 쉬는 사이 이동 거리를 빼고 선도 안 잇는다. 걸은 시간은 `walkMs()`(쉬는 시간 제외), 경로 구간은 `segments()` (`lib/geo.js`). 쉬는 동안엔 Wake Lock 해제.

## 개발 · 테스트
- `npm run dev` → `http://localhost:5173/?sim` 은 가짜 GPS(코스 시작→종점 이동)
- `npm run build`, `npm run lint`(oxlint)
- E2E는 Playwright로 iPhone 13 에뮬레이션 + `context.setGeolocation` 사용. 실제 걷는 속도(초당 ~10m 이하)로 움직여야 필터에 안 걸림

## 배포
- `main` push → GitHub Actions(`.github/workflows/deploy.yml`) → GitHub Pages
- https://jeju-olle.norara.app (가비아 DNS CNAME → osiyeon.github.io, Pages Custom domain + HTTPS). 옛 주소 osiyeon.github.io/jeju-olle/ 은 301로 넘어감 · 저장소 https://github.com/osiyeon/jeju-olle
- `vite.config.js`의 `base: './'` 덕분에 서브경로/커스텀 도메인 모두 동작. Actions 배포라 CNAME 파일은 무시됨 → 도메인은 저장소 Settings > Pages > Custom domain에서 관리
- 링크 미리보기: `index.html` og 태그 + `public/og.png`(1200×630), 홈 화면 아이콘 `public/apple-touch-icon.png`. 둘 다 낙서 그림으로 렌더한 이미지. 카카오톡은 미리보기를 캐시하므로 바꾸면 카카오 개발자 도구의 OG 캐시 초기화 필요
- 도메인을 바꾸면 IndexedDB가 출처(origin)별이라 기존 주소의 기록이 새 주소로 안 넘어감. 기존 주소에서 백업 → 새 주소에서 복원

## 보안 · 안정성 (공개 후 점검, 2026-11-06)
- 사용자 입력·백업 데이터는 React로만 그림. Leaflet 말풍선 HTML은 `escapeHtml`, 링크는 `safeUrl`(http/https만)
- 백업 복원(`importAll`)은 항목별로 형식 검사: 코스 ID·날짜·좌표 범위·문자열 길이, 사진은 `data:image/...`만(바깥 요청 없음)
- 주소창 `?w=`로 이어 걷기는 저장소가 비었을 때만, 24시간 이내, 먼저 확인 창. 거절하면 기억. 좌표는 소수 셋째 자리(약 100m)
- localStorage·IndexedDB 접근은 실패해도 앱이 열리게(`lsGet/lsSet`, 로드 catch → 저장 안 됨 안내). 저장 실패는 한 번 알림
- 불러온 데이터 중 깨진 항목은 거름. 그래도 화면 오류가 나면 `ErrorBoundary`가 새로고침·백업 화면
- 날짜는 기기 시간대 기준 `localISO` (toISOString은 UTC라 한국 오전 9시 전이면 전날)
- 일부러 안 한 것: CSP 메타 태그(카카오 SDK가 여러 도메인에서 스크립트를 불러와 깨질 위험), 지도 타일은 OSM 공용 서버라 사용자가 크게 늘면 타일 제공처 교체 검토

## 알려진 제약
- iOS Safari는 화면이 꺼지면 GPS가 멈춘다 (모바일 웹 한계)
- 코스 경로는 OSM 기여자 데이터라 현재 공식 경로와 다를 수 있음 (20코스는 18.7km로 공식 17.6km보다 김). 공유 카드에 OSM 출처 표기 필수(ODbL)
