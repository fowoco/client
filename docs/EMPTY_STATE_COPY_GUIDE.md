# 빈 상태 · 로딩 · 에러 카피 가이드

`useAsyncDemoData` + `EmptyState`로 목록형 화면의 상태를 표현할 때(#44) 따르는 문구 기준.
화면마다 톤이 제각각이 되지 않도록, 새 화면을 만들 때도 아래 패턴을 그대로 따른다.

## 공통 원칙

- **어미**: title은 명사형 또는 "-습니다" 평서문, body는 "-해 주세요" 권유형으로 통일한다.
- **길이**: title 1줄(15자 내외), body 1~2줄(40자 내외). 길어지면 줄인다.
- **주어 생략**: "저희가", "시스템이" 같은 주어를 쓰지 않는다. 무엇이 문제인지(대상)만 말한다.
- **원인 설명은 하지 않는다**: "서버 오류로 인해" 같은 기술적 원인은 쓰지 않는다. 사용자가 취할 행동만 안내한다.

## 상태별 템플릿

### Loading

- title: `"{대상}을 불러오는 중입니다"` (예: "업무 현황을 불러오는 중입니다")
- body: `"잠시만 기다려 주세요."` 또는 진행 내용을 한 줄로 (예: "기한·필수정보·응답 상태를 확인하고 있습니다.")
- action 버튼: 표시하지 않는다 (`actionLabel` 생략)

### Empty (데이터가 실제로 없음)

- title: `"{대상}이(가) 없습니다"` (예: "오늘 처리할 업무가 없습니다", "등록된 근로자가 없습니다")
- body: 다음 행동을 권유 (예: "새 요청을 입력하거나 파일을 가져와 업무를 만들어 보세요.")
- action 버튼: 다음 행동으로 바로 이어지는 경우에만 넣는다 (예: "업무 만들기"). 이어질 행동이 없으면 생략.

### Empty (검색/필터 결과가 없음)

- title: `"검색 결과가 없습니다"` (검색어와 무관하게 고정 문구)
- body: `"다른 검색어로 다시 시도해 보세요."`
- action 버튼: 없음 (사용자가 검색창을 직접 수정하면 되므로)

### Error (조회 실패)

- title: `"{대상}을 불러오지 못했습니다"` (예: "업무 목록을 불러오지 못했습니다")
- body: `"네트워크 상태를 확인한 뒤 다시 시도해 주세요."`
- action 버튼: 항상 넣는다. 라벨은 `"다시 시도"`로 고정.

## 컴포넌트 사용 예

```tsx
const status = useAsyncDemoData(WORK_ITEMS.length === 0)

{status === 'loading' && (
  <EmptyState kind="loading" title="업무 목록을 불러오는 중입니다" body="잠시만 기다려 주세요." />
)}

{status === 'error' && (
  <EmptyState
    kind="error"
    title="업무 목록을 불러오지 못했습니다"
    body="네트워크 상태를 확인한 뒤 다시 시도해 주세요."
    actionLabel="다시 시도"
    onAction={() => navigate('/tasks', { replace: true })}
  />
)}

{status === 'empty' && (
  <EmptyState
    kind="empty"
    title="등록된 업무가 없습니다"
    body="새 요청을 입력하거나 파일을 가져와 업무를 만들어 보세요."
    actionLabel="업무 만들기"
    onAction={() => navigate('/tasks/new')}
  />
)}
```

## 프리뷰 방법

개발 중에는 URL에 `?demoState=loading|empty|error`를 붙이면 해당 상태를 바로 볼 수 있다.
예) `http://localhost:5173/tasks?demoState=error`
