# client
React + TypeScript 기반 프론트엔드 : HR 대시보드, 업무카드, 근로자 모바일 링크 화면

스택 결정 근거는 [`docs/FRONTEND_STACK_DECISION.md`](docs/FRONTEND_STACK_DECISION.md), 화면 목록은 [`docs/SCREEN_CATALOG.md`](docs/SCREEN_CATALOG.md)를 참고합니다.

## 시작하기

```bash
npm install
cp .env.example .env
npm run dev
```

## 로컬 백엔드 연결

개발 서버는 `/api` 요청을 `http://127.0.0.1:8080`으로 전달합니다. 프론트에서는
`VITE_API_BASE_URL=/api/v1`을 사용해야 로그인 Refresh Cookie가 같은 출처로 유지됩니다.
백엔드 주소를 `VITE_API_BASE_URL`에 직접 넣으면 로그인 직후 요청은 성공해도 새로고침 시
세션 복원이 실패할 수 있습니다.

## 스크립트

| 명령 | 설명 |
| --- | --- |
| `npm run dev` | 개발 서버 실행 |
| `npm run build` | 타입체크 + 프로덕션 빌드 |
| `npm run lint` | ESLint 검사 |
| `npm run format` | Prettier 포맷팅 |
| `npm run test` | Vitest 테스트 실행 |

## 기여

브랜치·커밋·PR 규칙은 [`CONTRIBUTING.md`](CONTRIBUTING.md)를 따릅니다.
