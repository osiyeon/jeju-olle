# 🍊 올레 기록장 (jeju-olle)

제주올레길을 걸으며 경로를 기록하고, 맛집을 저장하고, 완주 카드를 SNS에 공유하는 모바일 웹앱.

## 기능
- **걷기**: GPS 경로 기록 (거리·시간·페이스), 종점까지 남은 직선거리, 화면 꺼짐 방지
- **코스**: 27개 정규 코스 완주 스탬프북 (지난 완주도 날짜·메모로 기록)
- **맛집**: 현재 위치 + 이름·별점·메모·사진 저장, 카카오맵/네이버 연결
- **공유**: 1080×1920 완주 카드 생성 → iOS 공유 시트로 인스타·카톡
- **백업**: JSON 내보내기/복원 (데이터는 기기 IndexedDB에만 저장)

## 스택
React 19 + Vite, Leaflet + OpenStreetMap, idb-keyval. 서버 없음.

## 개발
```bash
npm install
npm run dev          # http://localhost:5173/?sim 으로 가짜 GPS 테스트
npm run build
```

## 배포
`main`에 push하면 GitHub Actions가 GitHub Pages로 배포합니다 (`.github/workflows/deploy.yml`).

## 알려진 제약
- 모바일 웹은 화면이 꺼지거나 앱이 백그라운드로 가면 GPS가 멈춥니다 (iOS Safari).
- 코스 시작/종점 좌표는 근사값입니다 (`src/lib/courses.js`).
