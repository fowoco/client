import { useToastStore } from '../../../store/toastStore'
import styles from './ToastViewport.module.css'

export function ToastViewport() {
  const toasts = useToastStore((state) => state.toasts)
  const dismissToast = useToastStore((state) => state.dismissToast)

  if (toasts.length === 0) return null

  return (
    <div className={styles.viewport} role="status" aria-live="polite">
      {toasts.map((toast) => (
        <div key={toast.id} className={styles.toast}>
          <span>{toast.message}</span>
          <button
            type="button"
            className={styles.close}
            aria-label="알림 닫기"
            onClick={() => dismissToast(toast.id)}
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  )
}
