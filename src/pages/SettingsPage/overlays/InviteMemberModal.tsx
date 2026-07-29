import { useState } from 'react'
import { Modal } from '../../../components/ui/Modal/Modal'
import styles from './overlays.module.css'

const ROLES = ['HR_STAFF', 'HR_MANAGER', 'VIEWER'] as const
type InviteRole = (typeof ROLES)[number]

const ROLE_LABEL: Record<InviteRole, string> = {
  HR_STAFF: 'HR 담당자',
  HR_MANAGER: 'HR 매니저',
  VIEWER: '조회 전용',
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export interface MemberInvite {
  email: string
  role: InviteRole
}

export interface InviteMemberModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (invite: MemberInvite) => void
}

export function InviteMemberModal({ open, onClose, onSubmit }: InviteMemberModalProps) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<InviteRole>('HR_STAFF')
  const [error, setError] = useState<string | null>(null)

  function handleClose() {
    setEmail('')
    setRole('HR_STAFF')
    setError(null)
    onClose()
  }

  function handleSubmit() {
    if (!EMAIL_PATTERN.test(email)) {
      setError('올바른 이메일 형식이 아닙니다.')
      return
    }
    onSubmit({ email, role })
    setEmail('')
    setRole('HR_STAFF')
    setError(null)
  }

  return (
    <Modal open={open} onClose={handleClose} title="구성원 초대">
      <p className={styles.warningDescription}>초대 이메일을 받은 담당자가 가입을 완료하면 목록에 반영됩니다.</p>

      <p className={styles.fieldLabel}>이메일</p>
      <input
        className={styles.textInput}
        type="email"
        value={email}
        onChange={(event) => {
          setEmail(event.target.value)
          setError(null)
        }}
        placeholder="name@company.com"
      />
      {error && <p className={styles.fieldError}>{error}</p>}

      <p className={`${styles.fieldLabel} ${styles.fieldLabelSpaced}`}>역할</p>
      <div className={styles.chipRow}>
        {ROLES.map((option) => (
          <button
            key={option}
            type="button"
            className={`${styles.chip} ${role === option ? styles.chipSelected : ''}`}
            onClick={() => setRole(option)}
          >
            {ROLE_LABEL[option]}
          </button>
        ))}
      </div>

      <div className={styles.actionRow}>
        <button type="button" className={styles.textLink} onClick={handleClose}>
          취소
        </button>
        <button type="button" className={styles.primaryButton} onClick={handleSubmit}>
          초대 보내기
        </button>
      </div>
    </Modal>
  )
}
