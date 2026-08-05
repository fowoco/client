import { Button } from '../../../components/ui/Button/Button'
import { DetailRow } from '../../../components/ui/DetailRow/DetailRow'
import { StatusLabel } from '../../../components/ui/StatusLabel/StatusLabel'
import styles from '../ReviewWorkPage.module.css'
import { PREPARED_DRAFT, TASK_CREATION_SUMMARY } from '../reviewWorkData'

export interface DraftPreparationStepProps {
  onDone: () => void
}

export function DraftPreparationStep({ onDone }: DraftPreparationStepProps) {
  return (
    <div>
      <div className={styles.headerRow}>
        <div>
          <h1 className={styles.headline}>초안 준비가 완료됐습니다.</h1>
          <p className={styles.description}>초안을 검토하면 최종 검토 단계로 넘어갑니다.</p>
        </div>
        <StatusLabel tone="success">초안 준비 완료</StatusLabel>
      </div>

      <div className={styles.workspace}>
        <div className={styles.draftPanel}>
          <div className={styles.draftPanelHeader}>
            <h2 className={styles.draftTitle}>준비된 초안</h2>
            <span className={styles.draftBadge}>초안 준비</span>
          </div>

          <p className={styles.draftHeadline}>{TASK_CREATION_SUMMARY.title}</p>

          <DetailRow label="담당자" value={PREPARED_DRAFT.assignee} />
          <DetailRow label="처리 절차" value={TASK_CREATION_SUMMARY.procedure} />
          <DetailRow label="완료 증빙" value={PREPARED_DRAFT.completionEvidence} />
        </div>

        <div className={styles.left}>
          <div className={styles.card}>
            <div className={styles.draftPanelHeader}>
              <h2 className={styles.cardTitle}>다음 단계 안내</h2>
              <span className={styles.draftBadge}>최종 검토 대기</span>
            </div>
            <p className={styles.missingQuestion}>
              초안을 검토하고 승인을 요청해야 근로자 전달·외부 제출 단계로 이어집니다.
            </p>
          </div>
        </div>
      </div>

      <div className={styles.actions}>
        <Button onClick={onDone}>초안 검토 →</Button>
      </div>
    </div>
  )
}
