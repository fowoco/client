import { useNavigate } from 'react-router-dom'
import { Button } from '../../../components/ui/Button/Button'
import styles from '../ReviewWorkPage.module.css'
import {
  DOCUMENT_STATE_LEGEND,
  DRAFT_DOCUMENTS,
  GENERATION_BOUNDARY_NOTE,
  LEAVE_WARNING,
  NEXT_WORKFLOW_GATE,
  SOURCE_COUNTS,
  type DraftDocumentStatus,
} from '../reviewWorkData'

const STATUS_PILL_CLASS: Record<DraftDocumentStatus, string> = {
  ready: 'pillGreen',
  blocked: 'pillAmber',
  failed: 'pillRed',
}

export interface DraftPreparationStepProps {
  onDone: () => void
}

export function DraftPreparationStep({ onDone }: DraftPreparationStepProps) {
  const navigate = useNavigate()

  return (
    <div>
      <div className={styles.headerRow}>
        <div>
          <h1 className={styles.headline}>생성된 문서와 대기 중인 문서를 확인해 주세요</h1>
          <p className={styles.description}>선행조건이 충족된 문서만 준비했습니다. 완료 후에도 자동 이동하지 않습니다.</p>
        </div>
        <span className={styles.scenarioPill}>초안 대기</span>
      </div>

      <div className={styles.workspace}>
        <div className={styles.panel}>
          <h2 className={styles.panelTitle}>문서 · 안내문 생성 결과</h2>
          <p className={styles.panelSubtitle}>문서별 상태와 다음 행동</p>

          <div className={styles.docList}>
            {DRAFT_DOCUMENTS.map((doc) => (
              <div
                key={doc.title}
                className={`${styles.docRow} ${doc.status === 'ready' ? styles.docRowReady : ''}`}
              >
                <div className={styles.docRowText}>
                  <p className={styles.taskTitle}>{doc.title}</p>
                  <p className={styles.taskMeta}>{doc.meta}</p>
                </div>
                <div className={styles.docRowActions}>
                  <span className={`${styles.pill} ${styles[STATUS_PILL_CLASS[doc.status]]}`}>
                    {doc.statusLabel}
                  </span>
                  <button
                    type="button"
                    className={`${styles.docActionLink} ${doc.status === 'failed' ? styles.docActionLinkDanger : ''}`}
                  >
                    {doc.actionLabel}
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className={styles.leaveWarning}>
            <p className={styles.leaveWarningTitle}>{LEAVE_WARNING.title}</p>
            <p className={styles.leaveWarningBody}>{LEAVE_WARNING.body}</p>
          </div>
        </div>

        <div className={styles.railStack}>
          <div className={styles.railCard}>
            <p className={styles.railCardTitle}>초안에 사용한 값</p>
            {SOURCE_COUNTS.map((item) => (
              <div key={item.label} className={styles.infoRow}>
                <span className={styles.infoRowLabel}>{item.label}</span>
                <span className={styles.railCardCount}>{item.value}</span>
              </div>
            ))}
          </div>

          <div className={styles.legendCard}>
            <p className={styles.railCardTitle}>문서 상태 기준</p>
            <div className={styles.legendList}>
              {DOCUMENT_STATE_LEGEND.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
          </div>

          <div className={styles.railCard}>
            <p className={styles.railCardTitle}>다음 처리 절차 조건</p>
            <div className={`${styles.railCardTitleRow} ${styles.railCardTitleRowSpaced}`}>
              <span className={styles.taskTitle}>{NEXT_WORKFLOW_GATE.title}</span>
              <span className={`${styles.pill} ${styles.pillAmber}`}>{NEXT_WORKFLOW_GATE.status}</span>
            </div>
            <p className={styles.railCardMeta}>{NEXT_WORKFLOW_GATE.note}</p>
          </div>

          <div className={styles.railCardSubtle}>
            <p className={styles.railCardMeta}>{GENERATION_BOUNDARY_NOTE}</p>
          </div>
        </div>
      </div>

      <div className={styles.actionDock}>
        <div>
          <p className={styles.dockTitle}>검토 가능 2건 · 선행 필요 1건</p>
          <p className={styles.dockSubtitle}>완료되어도 자동 이동하지 않습니다. HR이 ‘초안 검토’를 선택합니다.</p>
        </div>
        <div className={styles.dockActions}>
          <Button variant="secondary" onClick={() => navigate('/tasks/new/review?step=1')}>
            정보 다시 확인
          </Button>
          <Button onClick={onDone}>초안 검토</Button>
        </div>
      </div>
    </div>
  )
}
