import { Button } from '../../../components/ui/Button/Button'
import { DetailRow } from '../../../components/ui/DetailRow/DetailRow'
import { StatusLabel } from '../../../components/ui/StatusLabel/StatusLabel'
import styles from '../ReviewWorkPage.module.css'
import { PREPARED_DRAFT, TASK_CREATION_SUMMARY } from '../reviewWorkData'

export interface TaskCreationStepProps {
  onDone: () => void
}

export function TaskCreationStep({ onDone }: TaskCreationStepProps) {
  return (
    <div>
      <div className={styles.headerRow}>
        <div>
          <h1 className={styles.headline}>업무를 생성했습니다.</h1>
          <p className={styles.description}>승인 단계로 넘어가면 담당자가 최종 확인합니다.</p>
        </div>
        <StatusLabel tone="success">생성 완료</StatusLabel>
      </div>

      <div className={styles.workspace}>
        <div className={styles.draftPanel}>
          <div className={styles.draftPanelHeader}>
            <h2 className={styles.draftTitle}>생성된 업무</h2>
            <span className={styles.draftBadge}>업무 생성</span>
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
              <span className={styles.draftBadge}>승인 대기</span>
            </div>
            <p className={styles.missingQuestion}>
              생성된 업무는 담당자 승인을 거쳐야 근로자 전달·외부 제출 단계로 이어집니다.
            </p>
          </div>
        </div>
      </div>

      <div className={styles.actions}>
        <Button onClick={onDone}>승인 요청으로 이동 →</Button>
      </div>
    </div>
  )
}
