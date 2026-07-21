# Contributing

브랜치·커밋·리뷰·병합 규칙은 [`fowoco/knowledge` 저장소의 `docs/DEVELOPMENT_STRATEGY.md`](https://github.com/fowoco/knowledge/blob/main/docs/DEVELOPMENT_STRATEGY.md)를 그대로 따릅니다.

## 요약

1. 완료 조건이 있는 GitHub Issue 생성
2. `<type>/issue-<번호>-<short-slug>` 브랜치 생성 (예: `feat/issue-3-login-screen`)
3. Conventional Commits + 한국어 요약: `<type>(<scope>): <한국어 요약>`
4. 작업 초기에 Draft PR 생성
5. CI(lint·format·test) 통과 후 Ready for review 전환
6. 리뷰 반영 후 Squash 또는 Rebase merge

> `fowoco-client`는 `fowoco/knowledge`의 공통 컨벤션 중 "병합 후 원격 브랜치 자동 삭제"를 따르지 않는다.
> 화면별 작업 이력을 브랜치로 남기기 위해 **병합 후에도 브랜치를 삭제하지 않는다.**

## 프론트엔드 코드 기준

- React 18 + TypeScript strict mode, `any` 금지
- 서버 상태는 React Query, 화면 전용 상태만 Zustand
- ESLint + Prettier, Vitest로 정상·오류·경계 사례 검증
- 컴포넌트는 단일 책임, 과도하게 커지면 분리 제안
- 백엔드 API가 아직 없는 화면은 목데이터로 구현하고, 연동 지점에 `// TODO(backend): <메서드> <경로> -> <설명>` 주석을 남긴다
- 목록/현황성 데이터를 보여주는 화면은 `useAsyncDemoData`(`src/hooks/useAsyncDemoData.ts`)로 loading·empty·error 상태를 먼저 표현하고, `EmptyState` 컴포넌트로 렌더링한다. URL에 `?demoState=loading|empty|error`를 붙이면 해당 상태를 강제로 미리볼 수 있다. 백엔드 연동 시 이 훅을 React Query의 `useQuery`로 교체한다. 문구 톤은 [`docs/EMPTY_STATE_COPY_GUIDE.md`](docs/EMPTY_STATE_COPY_GUIDE.md)를 따른다
- 상태 뱃지(승인 대기, 체류 D-12 등)는 `StatusLabel`, 라벨-값 형태의 상세 행(담당자, 마감일 등)은 `DetailRow`를 재사용한다. 새 배지·행 스타일이 필요하면 페이지 CSS에 새로 만들기 전에 기존 컴포넌트를 확장할 수 있는지 먼저 검토한다
- hover·active 등 인터랙션 트랜지션은 `tokens.css`의 `--fowoco-motion-*`/`--fowoco-easing-*`를 사용한다. 임의의 지속시간·이징 값을 새로 쓰지 않는다. `prefers-reduced-motion`은 토큰 레벨에서 이미 처리되어 있어 별도 분기가 필요 없다

자세한 배경은 [`docs/FRONTEND_STACK_DECISION.md`](docs/FRONTEND_STACK_DECISION.md)와 [`docs/SCREEN_CATALOG.md`](docs/SCREEN_CATALOG.md)를 참고합니다.
