import { useNavigate } from 'react-router-dom'
import { Button } from '../../../components/ui/Button/Button'
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

      <div className={styles.card}>
        <h2 className={styles.cardTitle}>{TASK_CREATION_SUMMARY.title}</h2>
        <p className={styles.description}>승인자 {APPROVAL_SUMMARY.approver}</p>
      </div>

      <div className={styles.actions}>
        <Button onClick={() => navigate('/tasks')}>업무함으로 이동 →</Button>
      </div>
    </div>
  )
}
