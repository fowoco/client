import { Drawer } from '../../../components/ui/Drawer/Drawer'
import { EmptyState } from '../../../components/ui/EmptyState/EmptyState'
import { DOCUMENT_BUNDLE } from './importWizardData'
import styles from './importWizard.module.css'

export interface DocumentBundleDrawerProps {
  open: boolean
  onClose: () => void
}

export function DocumentBundleDrawer({ open, onClose }: DocumentBundleDrawerProps) {
  return (
    <Drawer open={open} onClose={onClose} title="함께 첨부된 서류">
      <p className={styles.description}>
        파일과 함께 업로드된 서류입니다. 근로자별로 자동 연결되며, 등록 완료 후 서류함에서 다시 확인할 수 있습니다.
      </p>

      {DOCUMENT_BUNDLE.length === 0 ? (
        <EmptyState kind="empty" title="첨부된 서류가 없습니다" body="파일과 함께 서류를 올리면 여기에 표시됩니다." />
      ) : (
        <div className={styles.bundleList}>
          {DOCUMENT_BUNDLE.map((entry) => (
            <div key={entry.id} className={styles.bundleRow}>
              <p className={styles.bundleFileName}>{entry.fileName}</p>
              <span className={styles.bundleMeta}>
                {entry.workerName} · {entry.sizeLabel}
              </span>
            </div>
          ))}
        </div>
      )}
    </Drawer>
  )
}
