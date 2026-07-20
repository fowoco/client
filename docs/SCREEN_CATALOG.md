# 화면 카탈로그 (Figma Mid-Wireframe 기준)

Figma 파일: [FOWOCO](https://www.figma.com/design/eaOD8OXZOGq6vK4H9pGXNi/FOWOCO) — `[MFW] Mid-WireFrame` 페이지 (`node-id=143-3`부터 진입)

상태 값: `design:needs-review`(디자인 검토 필요) / `design:figma-ready`(구현 가능) — 실제 상태는 담당자가 Figma 확인 후 갱신합니다.

| # | 화면 | Figma 노드(참고) | 대상 | area 라벨 | 상태 |
| --- | --- | --- | --- | --- | --- |
| 1 | 로그인 | 19:2 | HR | `area:auth` | `design:needs-review` |
| 2 | 대시보드 | 8:5 | HR | `area:dashboard` | `design:needs-review` |
| 3 | 근로자 목록 관리 | 20:2 | HR | `area:worker` | `design:needs-review` |
| 4 | 근로자 상세 / 계약 및 체류 관리 | 17:2 | HR | `area:worker` | `design:needs-review` |
| 5a | 서류관리 / OCR | 22:2 | HR | `area:document` | `design:needs-review` |
| 5b | 서류 초안 작성 화면 | 90:33 | HR | `area:document` | `design:needs-review` |
| 5c | 서류 최종 결정 화면 | 98:9 | HR | `area:document` | `design:needs-review` |
| 6a | 업무 카드 보드 | 17:42 | HR | `area:task-board` | `design:needs-review` |
| 6b | 업무 카드 상세 / AI 승인 | 22:88 | HR | `area:task-board` | `design:needs-review` |
| 7a | Agent 패널 | 34:2 | HR | `area:agent-panel` | `design:needs-review` |
| 7b | AI 처리 이력 / 리포트 | 20:68 | HR | `area:agent-panel` | `design:needs-review` |
| 8 | 티켓 관리 | 17:111 | HR | `area:ticket` | `design:needs-review` |
| 9a | 근로자 모바일 안내 확인 | 22:142 | 근로자 | `area:mobile-worker` | `design:needs-review` |
| 9b | 근로자 모바일 질문 작성 화면 | 217:68 | 근로자 | `area:mobile-worker` | `design:needs-review` |

> 노드 ID는 와이어프레임 내 프레임을 빠르게 찾기 위한 참고용이며, 실제 구현 착수 전 담당자가 Figma에서 최신 상태를 다시 확인해야 합니다.

## 다음 단계

각 행을 [Kickoff Issue](https://github.com/fowoco/client/issues/1)의 계획에 따라 개별 GitHub Issue로 분리해 `priority`와 `status` 라벨을 지정합니다.
