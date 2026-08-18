import { useEffect, useState } from 'react'
import type { CompanyMemberItemResponse } from '../../../api/settings'
import { Modal } from '../../../components/ui/Modal/Modal'
import styles from './overlays.module.css'

export interface AssigneeChangeModalProps {
  open: boolean
  currentAssigneeId: string
  members: CompanyMemberItemResponse[]
  loading?: boolean
  submitting?: boolean
  errorMessage?: string | null
  onClose: () => void
  onSubmit: (assigneeId: string) => void
}

export function AssigneeChangeModal({
  open,
  currentAssigneeId,
  members,
  loading = false,
  submitting = false,
  errorMessage = null,
  onClose,
  onSubmit,
}: AssigneeChangeModalProps) {
  const [selectedAssigneeId, setSelectedAssigneeId] = useState(currentAssigneeId)

  useEffect(() => {
    if (open) setSelectedAssigneeId(currentAssigneeId)
  }, [currentAssigneeId, open])

  const canSubmit =
    !loading &&
    !submitting &&
    Boolean(selectedAssigneeId) &&
    selectedAssigneeId !== currentAssigneeId

  return (
    <Modal open={open} onClose={onClose} title="담당자 변경">
      <p className={styles.description}>
        같은 사업장의 활성 구성원 중에서 이 업무를 담당할 사용자를 선택합니다.
      </p>

      <label className={styles.field}>
        <span className={styles.fieldLabel}>새 담당자</span>
        <select
          className={styles.selectInput}
          value={selectedAssigneeId}
          disabled={loading || submitting}
          onChange={(event) => setSelectedAssigneeId(event.target.value)}
        >
          {members.length === 0 && <option value="">선택 가능한 담당자가 없습니다</option>}
          {members.map((member) => (
            <option key={member.user_id} value={member.user_id}>
              {member.display_name} · {(member.roles ?? []).join(', ') || '구성원'}
            </option>
          ))}
        </select>
      </label>

      {loading && <p className={styles.statusNote}>담당자 목록을 불러오는 중입니다.</p>}
      {errorMessage && <p className={styles.errorNote}>{errorMessage}</p>}

      <div className={styles.actionRow}>
        <button type="button" className={styles.textLink} onClick={onClose} disabled={submitting}>
          취소
        </button>
        <button
          type="button"
          className={styles.primaryButton}
          onClick={() => onSubmit(selectedAssigneeId)}
          disabled={!canSubmit}
        >
          {submitting ? '변경 중…' : '담당자 변경'}
        </button>
      </div>
    </Modal>
  )
}
