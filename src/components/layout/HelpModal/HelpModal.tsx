import { Modal } from '../../ui/Modal/Modal'
import { DEMO_ACCOUNT } from '../../../store/authStore'
import { HELP_FAQ, HELP_FLOWS } from './helpContent'
import styles from './HelpModal.module.css'

export interface HelpModalProps {
  open: boolean
  onClose: () => void
}

export function HelpModal({ open, onClose }: HelpModalProps) {
  return (
    <Modal open={open} onClose={onClose} title="도움말">
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>자주 쓰는 흐름</h3>
        <ul className={styles.flowList}>
          {HELP_FLOWS.map((flow) => (
            <li key={flow} className={styles.flowItem}>
              {flow}
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>자주 묻는 질문</h3>
        {HELP_FAQ.map((item) => (
          <div key={item.question} className={styles.faqItem}>
            <p className={styles.faqQuestion}>{item.question}</p>
            <p className={styles.faqAnswer}>{item.answer}</p>
          </div>
        ))}
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>데모 계정</h3>
        <p className={styles.demoAccount}>
          {DEMO_ACCOUNT.email} / {DEMO_ACCOUNT.password}
        </p>
        <p className={styles.demoNote}>
          실제 개인정보나 외부 발송 없이 대표 업무 흐름을 체험할 수 있습니다.
        </p>
      </section>
    </Modal>
  )
}
