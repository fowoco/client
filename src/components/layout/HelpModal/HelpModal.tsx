import { useState } from 'react'
import { Modal } from '../../ui/Modal/Modal'
import { DEMO_ACCOUNT } from '../../../store/authStore'
import { useToastStore } from '../../../store/toastStore'
import { HELP_FAQ, HELP_FLOWS } from './helpContent'
import styles from './HelpModal.module.css'

export interface HelpModalProps {
  open: boolean
  onClose: () => void
}

export function HelpModal({ open, onClose }: HelpModalProps) {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0)
  const showToast = useToastStore((state) => state.showToast)

  function toggleFaq(index: number) {
    setOpenFaqIndex((current) => (current === index ? null : index))
  }

  async function handleCopyDemoAccount() {
    const text = `${DEMO_ACCOUNT.email} / ${DEMO_ACCOUNT.password}`
    try {
      await navigator.clipboard.writeText(text)
      showToast('데모 계정을 복사했습니다.')
    } catch {
      showToast('복사에 실패했습니다. 직접 선택해 복사해 주세요.')
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="도움말">
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>자주 쓰는 흐름</h3>
        <ol className={styles.flowList}>
          {HELP_FLOWS.map((flow, index) => (
            <li key={flow} className={styles.flowItem}>
              <span className={styles.flowBadge} aria-hidden="true">
                {index + 1}
              </span>
              <span className={styles.flowText}>{flow}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>자주 묻는 질문</h3>
        <div className={styles.faqList}>
          {HELP_FAQ.map((item, index) => {
            const isOpen = openFaqIndex === index
            return (
              <div key={item.question} className={styles.faqItem}>
                <button
                  type="button"
                  className={styles.faqQuestion}
                  aria-expanded={isOpen}
                  onClick={() => toggleFaq(index)}
                >
                  <span>{item.question}</span>
                  <span className={`${styles.faqChevron} ${isOpen ? styles.faqChevronOpen : ''}`} aria-hidden="true">
                    ▾
                  </span>
                </button>
                {isOpen && <p className={styles.faqAnswer}>{item.answer}</p>}
              </div>
            )
          })}
        </div>
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>데모 계정</h3>
        <div className={styles.demoCard}>
          <div>
            <p className={styles.demoAccount}>
              {DEMO_ACCOUNT.email} / {DEMO_ACCOUNT.password}
            </p>
            <p className={styles.demoNote}>
              실제 개인정보나 외부 발송 없이 대표 업무 흐름을 체험할 수 있습니다.
            </p>
          </div>
          <button type="button" className={styles.demoCopy} onClick={handleCopyDemoAccount}>
            복사
          </button>
        </div>
      </section>
    </Modal>
  )
}
