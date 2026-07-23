import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { EmptyState } from '../../components/ui/EmptyState/EmptyState'
import { StatusLabel } from '../../components/ui/StatusLabel/StatusLabel'
import { useAsyncDemoData } from '../../hooks/useAsyncDemoData'
import styles from './TicketListPage.module.css'
import {
  TICKET_STATUS_LABEL,
  TICKET_STATUS_TONE,
  TICKET_TABS,
  TICKETS,
  TOTAL_TICKET_COUNT,
} from './ticketListData'

export function TicketListPage() {
  const navigate = useNavigate()
  const status = useAsyncDemoData(TICKETS.length === 0)
  const [activeTab, setActiveTab] = useState(TICKET_TABS[0].id)

  const visibleTickets = useMemo(
    () => TICKETS.filter((ticket) => ticket.status === activeTab),
    [activeTab],
  )

  function handleAnswerTicket(ticketId: string) {
    navigate(`/tickets/${ticketId}`)
  }

  return (
    <div>
      <h1 className={styles.headline}>근로자 문의 티켓</h1>
      <p className={styles.description}>
        근로자 모바일에서 들어온 질문·이슈를 확인하고 답변합니다.
      </p>

      <div className={styles.tabs} role="tablist" aria-label="티켓 탭">
        {TICKET_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label} {tab.count}
          </button>
        ))}
      </div>

      {status === 'loading' && (
        <div className={styles.stateWrap}>
          <EmptyState kind="loading" title="티켓 목록을 불러오는 중입니다" body="잠시만 기다려 주세요." />
        </div>
      )}

      {status === 'error' && (
        <div className={styles.stateWrap}>
          <EmptyState
            kind="error"
            title="티켓 목록을 불러오지 못했습니다"
            body="네트워크 상태를 확인한 뒤 다시 시도해 주세요."
          />
        </div>
      )}

      {status === 'empty' && (
        <div className={styles.stateWrap}>
          <EmptyState kind="empty" title="접수된 티켓이 없습니다" body="근로자가 질문을 남기면 여기에 표시됩니다." />
        </div>
      )}

      {status === 'success' && (
        <>
          {visibleTickets.length === 0 ? (
            <div className={styles.stateWrap}>
              <EmptyState kind="empty" title="해당 상태의 티켓이 없습니다" body="다른 탭을 확인해 보세요." />
            </div>
          ) : (
            <div className={styles.list}>
              {visibleTickets.map((ticket) => (
                <div key={ticket.id} className={styles.row}>
                  <div className={styles.rowMain}>
                    <p className={styles.workerName}>{ticket.workerName}</p>
                    <p className={styles.summary}>{ticket.summary}</p>
                  </div>
                  <StatusLabel tone={TICKET_STATUS_TONE[ticket.status]}>
                    {TICKET_STATUS_LABEL[ticket.status]}
                  </StatusLabel>
                  <span className={styles.receivedAt}>{ticket.receivedAt}</span>
                  <button
                    type="button"
                    className={styles.answerButton}
                    onClick={() => handleAnswerTicket(ticket.id)}
                  >
                    답변하기 →
                  </button>
                </div>
              ))}
            </div>
          )}

          <p className={styles.footerText}>
            {TOTAL_TICKET_COUNT}건 중 {visibleTickets.length}건 표시
          </p>
        </>
      )}
    </div>
  )
}
