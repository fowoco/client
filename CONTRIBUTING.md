# Contributing

브랜치·커밋·리뷰·병합 규칙은 [`fowoco/knowledge` 저장소의 `docs/DEVELOPMENT_STRATEGY.md`](https://github.com/fowoco/knowledge/blob/main/docs/DEVELOPMENT_STRATEGY.md)를 그대로 따릅니다.

## 요약

1. 완료 조건이 있는 GitHub Issue 생성
2. `<type>/issue-<번호>-<short-slug>` 브랜치 생성 (예: `feat/issue-3-login-screen`)
3. Conventional Commits + 한국어 요약: `<type>(<scope>): <한국어 요약>`
4. 작업 초기에 Draft PR 생성
5. CI(lint·format·test) 통과 후 Ready for review 전환
6. 리뷰 반영 후 Squash 또는 Rebase merge

## 프론트엔드 코드 기준

- React 18 + TypeScript strict mode, `any` 금지
- 서버 상태는 React Query, 화면 전용 상태만 Zustand
- ESLint + Prettier, Vitest로 정상·오류·경계 사례 검증
- 컴포넌트는 단일 책임, 과도하게 커지면 분리 제안
- 백엔드 API가 아직 없는 화면은 목데이터로 구현하고, 연동 지점에 `// TODO(backend): <메서드> <경로> -> <설명>` 주석을 남긴다

자세한 배경은 [`docs/FRONTEND_STACK_DECISION.md`](docs/FRONTEND_STACK_DECISION.md)와 [`docs/SCREEN_CATALOG.md`](docs/SCREEN_CATALOG.md)를 참고합니다.
