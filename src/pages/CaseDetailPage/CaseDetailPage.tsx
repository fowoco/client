import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AgentSummary } from '../../components/ui/AgentSummary/AgentSummary'
import { Button } from '../../components/ui/Button/Button'
import { DetailRow } from '../../components/ui/DetailRow/DetailRow'
import { StatusLabel } from '../../components/ui/StatusLabel/StatusLabel'
import styles from './CaseDetailPage.module.css'
import {
  ACTION_DOCK,
  AGENT_SUMMARY,
  CASE_HEADER,
  CASE_STEPS,
  CASE_TABS,
  COMPLETION_GATES,
  CONTEXT_ACCESS,
  type StepStatus,
} from './caseDetailData'

const STEP_CIRCLE_CLASS: Record<StepStatus, string> = {
  done: styles.stepCircleDone,
  pending: styles.stepCirclePending,
  locked: styles.stepCircleLocked,
  waiting: styles.stepCircleWaiting,
}

const STEP_STATUS_CLASS: Record<StepStatus, string> = {
  done: styles.stepStatusDone,
  pending: styles.stepStatusPending,
  locked: styles.stepStatusLocked,
  waiting: styles.stepStatusWaiting,
}

export function CaseDetailPage() {
  const [activeTab, setActiveTab] = useState(CASE_TABS[0])

  function handleRequestApproval() {
    // TODO(backend): POST /api/work-items/:id/approval-request -> 승인 대기 상태로 전환
  }

  function handleMoreActions() {
    // TODO(backend): GET /api/work-items/:id/actions -> 취소·담당자 변경 등 메뉴 항목 구성
  }

  function handleExpandContext() {
    // TODO(backend): GET /api/work-items/:id/context -> 근거·문서·활동 상세 목록
  }

  function handleSaveDraft() {
    // TODO(backend): PATCH /api/work-items/:id/draft -> 현재 입력 상태 저장
  }

  return (
    <div>
      <div className={styles.topBar}>
        <Link to="/tasks" className={styles.back}>
          ← 업무함
        </Link>
        <button type="button" className={styles.more} onClick={handleMoreActions}>
          더보기 ···
        </button>
      </div>

      <div className={styles.headerRow}>
        <h1 className={styles.title}>{CASE_HEADER.title}</h1>
        <StatusLabel tone="warning">{CASE_HEADER.badges[0]}</StatusLabel>
        <StatusLabel tone="info">{CASE_HEADER.badges[1]}</StatusLabel>
      </div>
      <p className={styles.meta}>{CASE_HEADER.meta}</p>

      <div className={styles.tabs} role="tablist" aria-label="업무 상세 탭">
        {CASE_TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={activeTab === tab}
            className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className={styles.summaryRow}>
        <AgentSummary
          headline={AGENT_SUMMARY.headline}
          body={AGENT_SUMMARY.body}
          actionLabel={AGENT_SUMMARY.actionLabel}
        />

        <div className={styles.contextCard}>
          <p className={styles.contextLabel}>{CONTEXT_ACCESS.label}</p>
          <p className={styles.contextValues}>
            {CONTEXT_ACCESS.rows.map((row) => (
              <span key={row.label}>
                {row.label} {row.value}
                <br />
              </span>
            ))}
          </p>
          <button type="button" className={styles.contextLink} onClick={handleExpandContext}>
            펼쳐 보기 →
          </button>
        </div>
      </div>

      <div className={styles.panelRow}>
        <div className={styles.workflowCard}>
          <div className={styles.workflowHeader}>
            <h2 className={styles.cardTitle}>처리 단계</h2>
            <p className={styles.workflowNote}>필수 단계 3 / 5 완료</p>
          </div>

          <div className={styles.stepList}>
            {CASE_STEPS.map((step, index) => (
              <div key={step.no} className={styles.step}>
                <div className={styles.stepMarkerCol}>
                  <span className={`${styles.stepCircle} ${STEP_CIRCLE_CLASS[step.status]}`}>
                    {step.status === 'done' ? '✓' : step.no}
                  </span>
                  {index < CASE_STEPS.length - 1 && (
                    <span
                      className={`${styles.connector} ${
                        step.status === 'done' ? styles.connectorDone : ''
                      }`}
                    />
                  )}
                </div>
                <div className={styles.stepBody}>
                  <div>
                    <p className={styles.stepTitle}>{step.title}</p>
                    <p className={styles.stepActor}>{step.actor}</p>
                  </div>
                  <span className={`${styles.stepStatus} ${STEP_STATUS_CLASS[step.status]}`}>
                    {step.statusLabel}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.gatesCard}>
          <h2 className={styles.cardTitle}>완료 조건</h2>
          <p className={styles.gatesDescription}>{COMPLETION_GATES.description}</p>

          {COMPLETION_GATES.rows.map((row) => (
            <DetailRow key={row.label} label={row.label} value={row.value} tone={row.tone} />
          ))}

          <p className={styles.gateBlocked}>{COMPLETION_GATES.blocked}</p>
        </div>
      </div>

      <div className={styles.actionDock}>
        <span className={styles.nextStep}>{ACTION_DOCK.nextStep}</span>
        <button type="button" className={styles.draftSave} onClick={handleSaveDraft}>
          {ACTION_DOCK.draftSaveLabel}
        </button>
        <Button onClick={handleRequestApproval}>{ACTION_DOCK.approveLabel}</Button>
      </div>

      <p className={styles.footnote}>{ACTION_DOCK.footnote}</p>
    </div>
  )
}
