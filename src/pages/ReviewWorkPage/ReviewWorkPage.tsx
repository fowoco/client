import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../../components/ui/Button/Button'
import styles from './ReviewWorkPage.module.css'
import { MISSING_INFO, PREPARED_DRAFT, UNDERSTOOD_REQUEST } from './reviewWorkData'

export function ReviewWorkPage() {
  const [institution, setInstitution] = useState('')
  const canCreate = institution !== ''

  function handleCreate() {
    // TODO(backend): POST /api/work-items { ...UNDERSTOOD_REQUEST, institution } -> WORK-001로 이동
  }

  return (
    <div>
      <div className={styles.topBar}>
        <Link to="/tasks/new" className={styles.back}>
          ← 업무 생성
        </Link>
        <button type="button" className={styles.draftSave}>
          초안 저장
        </button>
      </div>

      <div className={styles.headerRow}>
        <div>
          <h1 className={styles.headline}>Agent가 요청을 1개의 업무로 정리했습니다.</h1>
          <p className={styles.description}>
            확인이 필요한 정보 1개를 입력하면 실행 가능한 업무 초안이 완성됩니다.
          </p>
        </div>
        <span className={styles.analysisStatus}>확인 필요 · 1</span>
      </div>

      <div className={styles.workspace}>
        <div className={styles.left}>
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Agent가 이해한 요청</h2>
            <p className={styles.cardBadge}>Agent 초안 · 원문과 현재 Context 기반</p>

            <div className={styles.fieldGrid}>
              <div>
                <p className={styles.fieldLabel}>요청 목적</p>
                <p className={styles.fieldValue}>{UNDERSTOOD_REQUEST.purpose}</p>
              </div>
              <div>
                <p className={styles.fieldLabel}>업무 영역</p>
                <p className={styles.fieldValue}>{UNDERSTOOD_REQUEST.domain}</p>
              </div>
              <div>
                <p className={styles.fieldLabel}>추천 처리 절차</p>
                <p className={styles.fieldValue}>{UNDERSTOOD_REQUEST.procedure}</p>
              </div>
            </div>

            <div className={styles.fieldGridTwo}>
              <div>
                <p className={styles.fieldLabel}>대상</p>
                <p className={styles.fieldValue}>{UNDERSTOOD_REQUEST.target}</p>
              </div>
              <div>
                <p className={styles.fieldLabel}>마감일</p>
                <p className={styles.fieldValue}>{UNDERSTOOD_REQUEST.dueDate}</p>
              </div>
            </div>

            <div className={styles.cardLinks}>
              <button type="button" className={styles.cardLink}>
                원문 보기 ▾
              </button>
              <button type="button" className={styles.cardLink}>
                근거 보기 ▾
              </button>
            </div>
          </div>

          <div className={styles.missingCard}>
            <h2 className={styles.missingTitle}>{MISSING_INFO.title}</h2>
            <p className={styles.missingQuestion}>{MISSING_INFO.question}</p>
            <select
              className={styles.missingSelect}
              value={institution}
              onChange={(event) => setInstitution(event.target.value)}
              aria-label={MISSING_INFO.placeholder}
            >
              <option value="">{MISSING_INFO.placeholder} ▾</option>
              {MISSING_INFO.options.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <p className={styles.missingWarning}>{MISSING_INFO.warning}</p>
          </div>
        </div>

        <aside className={styles.draftPanel}>
          <h2 className={styles.draftTitle}>준비한 업무 초안</h2>
          <p className={styles.draftBadge}>Agent가 준비함 · HR 확인 필요</p>
          <p className={styles.draftHeadline}>
            {PREPARED_DRAFT.title.map((line) => (
              <span key={line}>
                {line}
                <br />
              </span>
            ))}
          </p>

          {PREPARED_DRAFT.rows.map((row) => (
            <div key={row.label} className={styles.draftRow}>
              <span className={styles.draftRowLabel}>{row.label}</span>
              <span className={styles.draftRowValue}>{row.value}</span>
            </div>
          ))}

          <button type="button" className={styles.draftLink}>
            초안 내용 수정
          </button>
          <button type="button" className={styles.draftLink}>
            체크리스트 미리보기 ▾
          </button>
        </aside>
      </div>

      <div className={styles.actions}>
        <Link to="/tasks/new" className={styles.editRequest}>
          요청 수정
        </Link>
        <Button onClick={handleCreate} disabled={!canCreate}>
          정보 확인 후 업무 생성
        </Button>
      </div>

      <p className={styles.footnote}>
        분석 근거는 근거 보기를 눌렀을 때만 표시됩니다. 근거 없는 확률 점수는 사용하지 않습니다.
      </p>
    </div>
  )
}
