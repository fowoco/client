# 프론트엔드 스택 결정

관련 Issue: [fowoco/client#1](https://github.com/fowoco/client/issues/1)

## 결정 사항

| 항목 | 결정 | 근거 |
| --- | --- | --- |
| 프레임워크 | React 18 + Vite | 백엔드(Spring)와 REST/JSON으로 분리된 SPA. HR 관리자 웹은 SEO가 필요 없음. `fowoco/knowledge` 저장소의 `docs/DEVELOPMENT_STRATEGY.md`에 이미 React Query가 언급되어 있어 기존 팀 컨벤션과 일치 |
| 언어 | TypeScript strict mode | 저장소 공통 CLAUDE.md 기준. `any` 타입 금지 |
| 서버 상태 | React Query (TanStack Query) | 서버 상태와 클라이언트 상태를 명확히 구분 |
| 클라이언트 상태 | Zustand | 화면 전용 상태만 경량 스토어로 관리 |
| 코드 품질 | ESLint + Prettier | `fowoco/knowledge`와 동일한 코드 기준 |
| 테스트 | Vitest | 유닛·컴포넌트 테스트 |

## 검토했지만 채택하지 않은 대안

- **Next.js**: React 생태계는 동일하지만 SSR/라우팅/이미지 최적화 등 풀스택 기능은 내부 관리자 도구 특성상 불필요. 초기 복잡도만 늘어난다고 판단해 제외.
- **Vue 3 + Vite**: 학습곡선은 낮지만 기존 문서에 React Query가 이미 전제되어 있어 팀 컨벤션과의 일관성을 위해 제외.

## 패키지 경계

`fowoco-client`는 UI 렌더링과 서버 상태 캐싱만 담당하며, DB·모델 내부 구현에는 직접 접근하지 않습니다. (`docs/DEVELOPMENT_STRATEGY.md`의 모노레포 경계 규칙 참고)
