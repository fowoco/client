import { useState } from 'react'
import { Dropdown } from '../../../components/ui/Dropdown/Dropdown'
import { Modal } from '../../../components/ui/Modal/Modal'
import { StatusLabel, type StatusTone } from '../../../components/ui/StatusLabel/StatusLabel'
import { useToastStore } from '../../../store/toastStore'
import { ConflictResolverModal, type ConflictChoice } from './ConflictResolverModal'
import { DocumentBundleDrawer } from './DocumentBundleDrawer'
import { FailedRowRetryModal } from './FailedRowRetryModal'
import {
  DETECTED_COLUMNS,
  IMPORTED_FILE_NAME,
  INITIAL_IMPORT_ROWS,
  SUGGESTED_MAPPING,
  SYSTEM_FIELDS,
  type ImportRow,
  type ImportRowStatus,
} from './importWizardData'
import styles from './importWizard.module.css'
import { MissingDocumentRequestModal } from './MissingDocumentRequestModal'

const STEP_COUNT = 4
const STEP_TITLES = ['파일 확인', '컬럼 매핑', '오류·충돌 검토', '등록 결과']

const ROW_STATUS_TONE: Record<ImportRowStatus, StatusTone> = {
  ok: 'success',
  conflict: 'warning',
  failed: 'critical',
  'missing-docs': 'warning',
}

const ROW_STATUS_LABEL: Record<ImportRowStatus, string> = {
  ok: '정상',
  conflict: '충돌',
  failed: '실패',
  'missing-docs': '서류 필요',
}

export interface ImportWizardModalProps {
  open: boolean
  onClose: () => void
}

export function ImportWizardModal({ open, onClose }: ImportWizardModalProps) {
  const [step, setStep] = useState(1)
  const [mapping, setMapping] = useState<Record<string, string>>(SUGGESTED_MAPPING)
  const [rows, setRows] = useState<ImportRow[]>(INITIAL_IMPORT_ROWS)
  const [conflictRow, setConflictRow] = useState<ImportRow | null>(null)
  const [retryRow, setRetryRow] = useState<ImportRow | null>(null)
  const [missingDocsRow, setMissingDocsRow] = useState<ImportRow | null>(null)
  const [bundleOpen, setBundleOpen] = useState(false)
  const showToast = useToastStore((state) => state.showToast)

  const mappingComplete = DETECTED_COLUMNS.every((column) => mapping[column])
  const hasBlockingIssues = rows.some((row) => row.status === 'conflict' || row.status === 'failed')

  function resetState() {
    setStep(1)
    setMapping(SUGGESTED_MAPPING)
    setRows(INITIAL_IMPORT_ROWS)
    setConflictRow(null)
    setRetryRow(null)
    setMissingDocsRow(null)
    setBundleOpen(false)
  }

  function handleClose() {
    resetState()
    onClose()
  }

  function handleResolveConflict(rowId: string, choice: ConflictChoice) {
    setRows((prev) =>
      prev.map((row) =>
        row.id === rowId
          ? {
              ...row,
              status: 'ok',
              importedStayExpiry: choice === 'existing' ? (row.existingStayExpiry ?? row.importedStayExpiry) : row.importedStayExpiry,
            }
          : row,
      ),
    )
    setConflictRow(null)
    showToast('충돌을 해결했습니다.')
  }

  function handleRetryRow(rowId: string, correctedStayExpiry: string) {
    setRows((prev) =>
      prev.map((row) =>
        row.id === rowId ? { ...row, status: 'ok', importedStayExpiry: correctedStayExpiry, errorMessage: null } : row,
      ),
    )
    setRetryRow(null)
    showToast('행을 재처리했습니다.')
  }

  function handleSendMissingDocsRequest(rowId: string) {
    void rowId
    setMissingDocsRow(null)
    showToast('서류 요청 안내를 보냈습니다.')
  }

  function handleFinish() {
    showToast(`${rows.length}명의 근로자 정보를 등록했습니다.`)
    handleClose()
  }

  const successCount = rows.filter((row) => row.status === 'ok').length
  const missingDocsCount = rows.filter((row) => row.status === 'missing-docs').length

  return (
    <>
      <Modal open={open} onClose={handleClose} title={`파일 가져오기 · ${STEP_TITLES[step - 1]}`} size="wide">
        <div className={styles.stepper} aria-hidden="true">
          {Array.from({ length: STEP_COUNT }, (_, index) => index + 1).map((s) => (
            <span
              key={s}
              className={`${styles.stepDot} ${s < step ? styles.stepDotDone : s === step ? styles.stepDotActive : ''}`}
            />
          ))}
        </div>

        {step === 1 && (
          <div>
            <p className={styles.description}>업로드한 파일의 내용을 확인하세요.</p>
            <div className={styles.fileCard}>
              <div>
                <p className={styles.fileName}>{IMPORTED_FILE_NAME}</p>
                <p className={styles.fileMeta}>{rows.length}행 감지됨</p>
              </div>
            </div>
            <div className={styles.previewTableScroll}>
              <table className={styles.previewTable}>
                <thead>
                  <tr>
                    {DETECTED_COLUMNS.map((column) => (
                      <th key={column}>{column}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 3).map((row) => (
                    <tr key={row.id}>
                      <td>{row.workerName}</td>
                      <td>{row.nationality}</td>
                      <td>{row.importedStayExpiry}</td>
                      <td>{row.note || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className={styles.actionRowEnd}>
              <button type="button" className={styles.primaryButton} onClick={() => setStep(2)}>
                다음 →
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <p className={styles.description}>감지된 열을 시스템 필드에 연결하세요.</p>
            <div className={styles.mappingGrid}>
              {DETECTED_COLUMNS.map((column) => (
                <div key={column} className={styles.mappingRow}>
                  <span className={styles.mappingSource}>{column}</span>
                  <span className={styles.mappingArrow} aria-hidden="true">
                    →
                  </span>
                  <Dropdown
                    options={SYSTEM_FIELDS}
                    value={mapping[column] ?? ''}
                    onChange={(value) => setMapping((prev) => ({ ...prev, [column]: value }))}
                    ariaLabel={`${column} 매핑 필드`}
                  />
                </div>
              ))}
            </div>
            <div className={styles.actionRow}>
              <button type="button" className={styles.secondaryButton} onClick={() => setStep(1)}>
                이전
              </button>
              <button type="button" className={styles.primaryButton} disabled={!mappingComplete} onClick={() => setStep(3)}>
                다음 →
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <p className={styles.description}>
              {hasBlockingIssues
                ? '충돌·실패 항목을 모두 해결해야 다음 단계로 진행할 수 있습니다.'
                : '모든 오류가 해결됐습니다. 다음 단계로 진행하세요.'}
            </p>
            <div className={styles.rowList}>
              {rows.map((row) => (
                <div key={row.id} className={styles.reviewRow}>
                  <div className={styles.reviewRowInfo}>
                    <p className={styles.reviewRowName}>
                      {row.rowNumber}행 · {row.workerName}
                    </p>
                    <p className={styles.reviewRowDetail}>
                      {row.status === 'conflict' && `기존 ${row.existingStayExpiry} → 가져온값 ${row.importedStayExpiry}`}
                      {row.status === 'failed' && row.errorMessage}
                      {row.status === 'missing-docs' && `누락 서류 ${row.missingDocuments.length}건`}
                      {row.status === 'ok' && row.importedStayExpiry}
                    </p>
                  </div>
                  <StatusLabel tone={ROW_STATUS_TONE[row.status]}>{ROW_STATUS_LABEL[row.status]}</StatusLabel>
                  {row.status === 'conflict' && (
                    <button type="button" className={styles.reviewRowAction} onClick={() => setConflictRow(row)}>
                      충돌 해결
                    </button>
                  )}
                  {row.status === 'failed' && (
                    <button type="button" className={styles.reviewRowAction} onClick={() => setRetryRow(row)}>
                      재처리
                    </button>
                  )}
                  {row.status === 'missing-docs' && (
                    <button type="button" className={styles.reviewRowAction} onClick={() => setMissingDocsRow(row)}>
                      요청 미리보기
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button type="button" className={styles.bundleLink} onClick={() => setBundleOpen(true)}>
              서류 묶음 보기 →
            </button>

            <div className={styles.actionRow}>
              <button type="button" className={styles.secondaryButton} onClick={() => setStep(2)}>
                이전
              </button>
              <button type="button" className={styles.primaryButton} disabled={hasBlockingIssues} onClick={() => setStep(4)}>
                다음 →
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div>
            <p className={styles.description}>가져오기 결과를 확인하고 등록을 완료하세요.</p>
            <div className={styles.resultGrid}>
              <div className={styles.resultCard}>
                <p className={styles.resultCount}>{successCount}</p>
                <p className={styles.resultLabel}>등록 완료</p>
              </div>
              <div className={styles.resultCard}>
                <p className={styles.resultCount}>{missingDocsCount}</p>
                <p className={styles.resultLabel}>서류 요청 대기</p>
              </div>
              <div className={styles.resultCard}>
                <p className={styles.resultCount}>{rows.length}</p>
                <p className={styles.resultLabel}>전체</p>
              </div>
            </div>
            <div className={styles.actionRowEnd}>
              <button type="button" className={styles.primaryButton} onClick={handleFinish}>
                완료
              </button>
            </div>
          </div>
        )}
      </Modal>

      <ConflictResolverModal
        open={conflictRow !== null}
        row={conflictRow}
        onClose={() => setConflictRow(null)}
        onResolve={handleResolveConflict}
      />
      <FailedRowRetryModal
        open={retryRow !== null}
        row={retryRow}
        onClose={() => setRetryRow(null)}
        onRetry={handleRetryRow}
      />
      <MissingDocumentRequestModal
        open={missingDocsRow !== null}
        row={missingDocsRow}
        onClose={() => setMissingDocsRow(null)}
        onSend={handleSendMissingDocsRequest}
      />
      <DocumentBundleDrawer open={bundleOpen} onClose={() => setBundleOpen(false)} />
    </>
  )
}
