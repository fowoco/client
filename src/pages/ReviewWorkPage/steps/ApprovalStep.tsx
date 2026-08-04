import { useNavigate } from 'react-router-dom'
import { Button } from '../../../components/ui/Button/Button'
import { DetailRow } from '../../../components/ui/DetailRow/DetailRow'
import { StatusLabel } from '../../../components/ui/StatusLabel/StatusLabel'
import styles from '../ReviewWorkPage.module.css'
import { APPROVAL_SUMMARY, TASK_CREATION_SUMMARY } from '../reviewWorkData'

export function ApprovalStep() {
  const navigate = useNavigate()

  return (
    <div>
      <div className={styles.headerRow}>
        <div>
          <h1 className={styles.headline}>
            <span aria-hidden="true">✓</span> 승인이 완료됐습니다.
          </h1>
          <p className={styles.description}>{APPROVAL_SUMMARY.approvedNote}</p>
        </div>
        <StatusLabel tone="success">승인 완료</StatusLabel>
      </div>

      <div className={styles.workspace}>
        <div className={styles.draftPanel}>
          <div className={styles.draftPanelHeader}>
            <h2 className={styles.draftTitle}>승인된 업무</h2>
            <span className={styles.draftBadge}>승인 완료</span>
          </div>

          <p className={styles.draftHeadline}>{TASK_CREATION_SUMMARY.title}</p>

          <DetailRow label="승인자" value={APPROVAL_SUMMARY.approver} />
          <DetailRow label="처리 절차" value={TASK_CREATION_SUMMARY.procedure} />
        </div>

        <div className={styles.left}>
          <div className={styles.card}>
            <div className={styles.draftPanelHeader}>
              <h2 className={styles.cardTitle}>다음 안내</h2>
              <span className={styles.draftBadge}>진행 예정</span>
            </div>
            <p className={styles.missingQuestion}>{APPROVAL_SUMMARY.approvedNote}</p>
          </div>
        </div>
      </div>

      <div className={styles.actions}>
        <Button onClick={() => navigate('/tasks')}>업무함으로 이동 →</Button>
      </div>
    </div>
  )
}
