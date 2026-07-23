import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Button } from '../../components/ui/Button/Button'
import { EmptyState } from '../../components/ui/EmptyState/EmptyState'
import { StatusLabel } from '../../components/ui/StatusLabel/StatusLabel'
import { useToastStore } from '../../store/toastStore'
import styles from './TicketDetailPage.module.css'
import {
  TICKET_STATUS_LABEL,
  TICKET_STATUS_TONE,
  TICKETS,
  type TicketStatus,
} from '../TicketListPage/ticketListData'

const NEXT_STATUS: Record<TicketStatus, TicketStatus | null> = {
  new: 'waiting',
  waiting: 'done',
  done: null,
}

const NEXT_STATUS_ACTION_LABEL: Record<TicketStatus, string> = {
  new: '응답 대기로 전환',
  waiting: '완료 처리',
  done: '완료됨',
}

interface SentAnswer {
  id: string
  text: string
  sentAt: string
}

export function TicketDetailPage() {
  const { ticketId } = useParams()
  const navigate = useNavigate()
  const showToast = useToastStore((state) => state.showToast)

  const ticket = TICKETS.find((item) => item.id === ticketId) ?? TICKETS[0]

  const [status, setStatus] = useState<TicketStatus>(ticket.status)
  const [draft, setDraft] = useState('')
  const [sentAnswers, setSentAnswers] = useState<SentAnswer[]>([])

  function handleSendAnswer() {
    const text = draft.trim()
    if (!text) return

    // TODO(backend): POST /api/tickets/:id/answers { text } -> 근로자 모바일로 답변 발송
    setSentAnswers((prev) => [...prev, { id: crypto.randomUUID(), text, sentAt: '방금' }])
    setDraft('')
    showToast('답변을 발송했습니다.')
    setStatus((current) => (current === 'new' ? 'waiting' : current))
  }

  function handleAdvanceStatus() {
    const next = NEXT_STATUS[status]
    if (!next) return

    // TODO(backend): PATCH /api/tickets/:id { status } -> 상태 전환
    setStatus(next)
    showToast(`상태를 "${TICKET_STATUS_LABEL[next]}"(으)로 변경했습니다.`)
  }

  return (
    <div>
      <div className={styles.topBar}>
        <Link to="/tickets" className={styles.back}>
          ← 티켓
        </Link>
      </div>

      <div className={styles.headerRow}>
        <h1 className={styles.title}>{ticket.workerName}</h1>
        <StatusLabel tone={TICKET_STATUS_TONE[status]}>{TICKET_STATUS_LABEL[status]}</StatusLabel>
      </div>
      <p className={styles.meta}>접수 {ticket.receivedAt}</p>

      <div className={styles.sectionCard}>
        <h2 className={styles.cardTitle}>질문 원문</h2>
        <p className={styles.question}>{ticket.question}</p>
      </div>

      <div className={styles.sectionCard}>
        <h2 className={styles.cardTitle}>관련 업무</h2>
        {ticket.relatedCaseId ? (
          <button
            type="button"
            className={styles.relatedCaseLink}
            onClick={() => navigate(`/tasks/${ticket.relatedCaseId}`)}
          >
            {ticket.relatedCaseId} 업무 상세 열기 →
          </button>
        ) : (
          <EmptyState kind="empty" title="연결된 업무가 없습니다" body="이 질문과 관련된 진행 중인 업무가 없습니다." />
        )}
      </div>

      <div className={styles.sectionCard}>
        <h2 className={styles.cardTitle}>답변 작성</h2>
        <textarea
          className={styles.answerInput}
          placeholder="근로자에게 보낼 답변을 입력하세요"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          rows={4}
        />
        <div className={styles.answerActions}>
          <Button onClick={handleSendAnswer} disabled={draft.trim() === ''}>
            답변 발송
          </Button>
        </div>

        {sentAnswers.length > 0 && (
          <div className={styles.sentList}>
            {sentAnswers.map((answer) => (
              <div key={answer.id} className={styles.sentRow}>
                <span className={styles.sentAt}>{answer.sentAt}</span>
                <p className={styles.sentText}>{answer.text}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={styles.statusDock}>
        <span className={styles.statusNote}>
          현재 상태: {TICKET_STATUS_LABEL[status]}
        </span>
        <Button variant="secondary" onClick={handleAdvanceStatus} disabled={!NEXT_STATUS[status]}>
          {NEXT_STATUS_ACTION_LABEL[status]}
        </Button>
      </div>
    </div>
  )
}
