import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  commitWorkerImport,
  createWorkerImport,
  fetchWorkerImport,
  patchWorkerImportRows,
  retryWorkerImport,
  saveWorkerImportMappings,
  validateWorkerImport,
  type WorkerImportField,
  type WorkerImportResponse,
} from '../../api/workerImports'
import { ApiError, getErrorMessage } from '../../api/errors'
import { Button } from '../../components/ui/Button/Button'
import { StatusLabel } from '../../components/ui/StatusLabel/StatusLabel'
import { useToastStore } from '../../store/toastStore'
import {
  buildSuggestedMappings,
  getEffectiveRowValue,
  getWorkerImportFieldLabel,
  IMPORT_STATUS_LABEL,
  START_OPTIONS,
  SUPPORTED_FORMATS,
  WORKER_IMPORT_FIELDS,
  type StartMode,
} from './onboardingImportData'
import { clearOnboardingImportPending } from './onboardingImportStorage'
import styles from './OnboardingImportPage.module.css'

const STEP_COUNT = 5
const STEP_TITLES = ['시작 방식', '파일 업로드', '열 연결', '행 검토', '등록 결과']

type BusyAction = 'upload' | 'mapping' | 'rows' | 'commit' | 'page' | null

function errorMessage(error: unknown) {
  return error instanceof ApiError
    ? getErrorMessage(error)
    : '요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.'
}

export function OnboardingImportPage() {
  const navigate = useNavigate()
  const showToast = useToastStore((state) => state.showToast)

  const [step, setStep] = useState(1)
  const [startMode, setStartMode] = useState<StartMode | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [workerImport, setWorkerImport] = useState<WorkerImportResponse | null>(null)
  const [mappings, setMappings] = useState<Record<string, WorkerImportField>>({})
  const [rowDrafts, setRowDrafts] = useState<Record<number, Record<string, string>>>({})
  const [excludedRowNumbers, setExcludedRowNumbers] = useState<number[]>([])
  const [busyAction, setBusyAction] = useState<BusyAction>(null)
  const [requestError, setRequestError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const uploadKeyRef = useRef<string | null>(null)
  const commitKeyRef = useRef<string | null>(null)

  const displayNameMapped = Object.values(mappings).includes('display_name')
  const invalidRows = workerImport?.rows.filter((row) => row.status === 'INVALID') ?? []
  const canMoveToNextPage = workerImport
    ? (workerImport.page + 1) * workerImport.size < workerImport.total_rows
    : false

  function finishOnboarding(destination: string, message?: string) {
    clearOnboardingImportPending()
    if (message) showToast(message)
    navigate(destination)
  }

  function handleStartNext() {
    if (startMode === 'migrate') {
      setStep(2)
    } else if (startMode === 'manual') {
      finishOnboarding('/workers', '근로자 목록에서 직접 등록할 수 있습니다.')
    } else {
      finishOnboarding('/dashboard')
    }
  }

  function handleFileChosen(files: FileList | null) {
    const file = files?.[0] ?? null
    setSelectedFile(file)
    setWorkerImport(null)
    setRequestError(null)
    uploadKeyRef.current = file ? crypto.randomUUID() : null
    commitKeyRef.current = null
  }

  async function handleUpload() {
    if (!selectedFile) return
    setBusyAction('upload')
    setRequestError(null)
    try {
      uploadKeyRef.current ??= crypto.randomUUID()
      const response = await createWorkerImport(selectedFile, uploadKeyRef.current)
      setWorkerImport(response)
      setMappings(buildSuggestedMappings(response.source_headers))
      setStep(3)
    } catch (error) {
      setRequestError(errorMessage(error))
    } finally {
      setBusyAction(null)
    }
  }

  function handleMappingChange(sourceHeader: string, target: WorkerImportField | '') {
    setMappings((current) => {
      const next = { ...current }
      delete next[sourceHeader]
      if (!target) return next

      const duplicateSource = Object.entries(next).find(([, value]) => value === target)?.[0]
      if (duplicateSource) delete next[duplicateSource]
      next[sourceHeader] = target
      return next
    })
  }

  async function handleSaveMappings() {
    if (!workerImport || !displayNameMapped) return
    setBusyAction('mapping')
    setRequestError(null)
    try {
      const mapped = await saveWorkerImportMappings(workerImport.import_id, {
        expected_version: workerImport.version,
        mappings,
      })
      const validated = await validateWorkerImport(mapped.import_id, mapped.version)
      setWorkerImport(validated)
      setMappings(validated.mappings)
      setRowDrafts({})
      setExcludedRowNumbers([])
      setStep(4)
    } catch (error) {
      setRequestError(errorMessage(error))
    } finally {
      setBusyAction(null)
    }
  }

  function updateRowDraft(rowNumber: number, field: string, value: string) {
    setRowDrafts((current) => ({
      ...current,
      [rowNumber]: { ...current[rowNumber], [field]: value },
    }))
  }

  function toggleExcluded(rowNumber: number) {
    setExcludedRowNumbers((current) =>
      current.includes(rowNumber)
        ? current.filter((number) => number !== rowNumber)
        : [...current, rowNumber],
    )
  }

  async function handleSaveRows() {
    if (!workerImport || invalidRows.length === 0) return
    setBusyAction('rows')
    setRequestError(null)
    try {
      const patched = await patchWorkerImportRows(workerImport.import_id, {
        expected_version: workerImport.version,
        rows: invalidRows.map((row) => ({
          row_number: row.row_number,
          excluded: excludedRowNumbers.includes(row.row_number),
          values: Object.fromEntries(
            row.errors.map((error) => [
              error.field,
              rowDrafts[row.row_number]?.[error.field] ??
                getEffectiveRowValue(row, workerImport.mappings, error.field),
            ]),
          ),
        })),
      })
      const retried = await retryWorkerImport(patched.import_id, patched.version)
      setWorkerImport(retried)
      setRowDrafts({})
      setExcludedRowNumbers([])
      showToast('수정한 행을 다시 검증했습니다.')
    } catch (error) {
      setRequestError(errorMessage(error))
    } finally {
      setBusyAction(null)
    }
  }

  async function handlePageChange(page: number) {
    if (!workerImport) return
    setBusyAction('page')
    setRequestError(null)
    try {
      const response = await fetchWorkerImport(workerImport.import_id, {
        page,
        size: workerImport.size,
      })
      setWorkerImport(response)
      setRowDrafts({})
      setExcludedRowNumbers([])
    } catch (error) {
      setRequestError(errorMessage(error))
    } finally {
      setBusyAction(null)
    }
  }

  async function handleCommit() {
    if (!workerImport || workerImport.valid_rows === 0 || workerImport.invalid_rows > 0) return
    setBusyAction('commit')
    setRequestError(null)
    try {
      commitKeyRef.current ??= crypto.randomUUID()
      const committed = await commitWorkerImport(
        workerImport.import_id,
        { expected_version: workerImport.version, selected_row_numbers: [] },
        commitKeyRef.current,
      )
      setWorkerImport(committed)
      setStep(5)
    } catch (error) {
      setRequestError(errorMessage(error))
    } finally {
      setBusyAction(null)
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <p className={styles.brand}>FOWOCO</p>
        <p className={styles.trust}>Guided Agentic Operations · 온보딩</p>
        <p className={styles.progress}>
          {step} / {STEP_COUNT} · {STEP_TITLES[step - 1]}
        </p>
      </header>

      <div className={styles.stepper} aria-hidden="true">
        {Array.from({ length: STEP_COUNT }, (_, index) => index + 1).map((item) => (
          <span
            key={item}
            className={`${styles.stepDot} ${item < step ? styles.stepDotDone : item === step ? styles.stepDotActive : ''}`}
          />
        ))}
      </div>

      <main className={styles.content}>
        {requestError && (
          <div className={styles.errorPanel} role="alert">
            <strong>요청을 완료하지 못했습니다.</strong>
            <p>{requestError}</p>
          </div>
        )}

        {step === 1 && (
          <div>
            <h1 className={styles.title}>어떻게 시작할까요?</h1>
            <p className={styles.description}>
              최초 로그인이라 데이터 시작 방식을 선택할 수 있습니다. 나중에 설정에서 다시 바꿀 수
              있습니다.
            </p>
            <div className={styles.optionGrid}>
              {START_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className={`${styles.optionCard} ${startMode === option.id ? styles.optionCardSelected : ''}`}
                  onClick={() => setStartMode(option.id)}
                  aria-pressed={startMode === option.id}
                >
                  <p className={styles.optionTitle}>{option.title}</p>
                  <p className={styles.optionDescription}>{option.description}</p>
                </button>
              ))}
            </div>
            <div className={styles.actionRowEnd}>
              <Button disabled={!startMode} onClick={handleStartNext}>
                다음 →
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h1 className={styles.title}>근로자 명단을 올려주세요.</h1>
            <p className={styles.description}>
              최대 5MB의 CSV 또는 XLSX 파일을 올리면 원본 열과 근로자 정보를 연결합니다.
            </p>
            <div className={styles.formatRow}>
              {SUPPORTED_FORMATS.map((format) => (
                <span key={format} className={styles.formatChip}>
                  {format}
                </span>
              ))}
            </div>
            <div className={styles.dropzone}>
              <input
                ref={fileInputRef}
                type="file"
                className={styles.fileInput}
                onChange={(event) => handleFileChosen(event.target.files)}
                accept=".xlsx,.csv"
                aria-label="근로자 명단 파일"
                disabled={busyAction !== null}
              />
              {selectedFile ? (
                <>
                  <p className={styles.fileName}>{selectedFile.name}</p>
                  <p className={styles.fileMeta}>
                    {Math.max(1, Math.ceil(selectedFile.size / 1024))}KB
                  </p>
                </>
              ) : (
                <p className={styles.dropzoneHint}>파일을 선택하거나 끌어다 놓으세요.</p>
              )}
              <Button
                type="button"
                variant="secondary"
                className={styles.chooseFileButton}
                onClick={() => fileInputRef.current?.click()}
              >
                파일 선택
              </Button>
            </div>
            <div className={styles.actionRow}>
              <Button
                type="button"
                variant="secondary"
                disabled={busyAction !== null}
                onClick={() => setStep(1)}
              >
                이전
              </Button>
              <Button
                type="button"
                disabled={!selectedFile}
                isLoading={busyAction === 'upload'}
                onClick={handleUpload}
              >
                파일 확인 →
              </Button>
            </div>
          </div>
        )}

        {step === 3 && workerImport && (
          <div>
            <div className={styles.titleRow}>
              <div>
                <h1 className={styles.title}>파일의 열을 연결해 주세요.</h1>
                <p className={styles.description}>
                  이름은 필수입니다. 사용하지 않을 열은 연결하지 않아도 됩니다.
                </p>
              </div>
              <StatusLabel tone="info">{workerImport.total_rows}행 확인</StatusLabel>
            </div>
            <div className={styles.mappingList}>
              {workerImport.source_headers.map((header) => (
                <div key={header} className={styles.mappingRow}>
                  <div>
                    <span>원본 열</span>
                    <strong>{header}</strong>
                  </div>
                  <span className={styles.mappingArrow} aria-hidden="true">
                    →
                  </span>
                  <label>
                    <span>근로자 정보</span>
                    <select
                      value={mappings[header] ?? ''}
                      onChange={(event) =>
                        handleMappingChange(header, event.target.value as WorkerImportField | '')
                      }
                    >
                      <option value="">연결 안 함</option>
                      {WORKER_IMPORT_FIELDS.map((field) => (
                        <option key={field.value} value={field.value}>
                          {field.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              ))}
            </div>
            {!displayNameMapped && (
              <p className={styles.inlineWarning}>‘이름’ 열을 연결해 주세요.</p>
            )}
            <div className={styles.actionRow}>
              <Button
                type="button"
                variant="secondary"
                disabled={busyAction !== null}
                onClick={() => setStep(2)}
              >
                이전
              </Button>
              <Button
                type="button"
                disabled={!displayNameMapped}
                isLoading={busyAction === 'mapping'}
                onClick={handleSaveMappings}
              >
                저장하고 행 검증 →
              </Button>
            </div>
          </div>
        )}

        {step === 4 && workerImport && (
          <div>
            <div className={styles.titleRow}>
              <div>
                <h1 className={styles.title}>검증 결과를 확인해 주세요.</h1>
                <p className={styles.description}>
                  오류 행을 수정하거나 등록 대상에서 제외한 뒤 정상 행을 등록합니다.
                </p>
              </div>
              <StatusLabel tone={workerImport.invalid_rows > 0 ? 'warning' : 'success'}>
                {IMPORT_STATUS_LABEL[workerImport.status]}
              </StatusLabel>
            </div>

            <div className={styles.resultGrid} aria-label="행 검증 결과">
              <div className={styles.resultCard}>
                <p className={styles.resultCount}>{workerImport.valid_rows}</p>
                <p className={styles.resultLabel}>정상</p>
              </div>
              <div className={styles.resultCard}>
                <p className={styles.resultCount}>{workerImport.invalid_rows}</p>
                <p className={styles.resultLabel}>수정 필요</p>
              </div>
              <div className={styles.resultCard}>
                <p className={styles.resultCount}>{workerImport.excluded_rows}</p>
                <p className={styles.resultLabel}>제외</p>
              </div>
            </div>

            <div className={styles.rowList}>
              {workerImport.rows.map((row) => {
                const displayName = getEffectiveRowValue(row, workerImport.mappings, 'display_name')
                const isLocallyExcluded = excludedRowNumbers.includes(row.row_number)
                return (
                  <article
                    key={row.row_number}
                    className={`${styles.reviewRow} ${row.status === 'INVALID' ? styles.reviewRowInvalid : ''}`}
                  >
                    <div className={styles.reviewRowHeader}>
                      <div>
                        <span>{row.row_number}행</span>
                        <strong>{displayName || '이름 미입력'}</strong>
                      </div>
                      <StatusLabel
                        tone={
                          row.status === 'VALID' || row.status === 'COMMITTED'
                            ? 'success'
                            : row.status === 'INVALID'
                              ? 'critical'
                              : 'neutral'
                        }
                      >
                        {row.status === 'VALID'
                          ? '정상'
                          : row.status === 'INVALID'
                            ? '수정 필요'
                            : row.status === 'EXCLUDED'
                              ? '제외'
                              : row.status === 'COMMITTED'
                                ? '등록 완료'
                                : '검증 대기'}
                      </StatusLabel>
                    </div>

                    {row.status === 'INVALID' && (
                      <div className={styles.rowErrorFields}>
                        {row.errors.map((error) => (
                          <label key={`${row.row_number}-${error.field}`}>
                            <span>{getWorkerImportFieldLabel(error.field)}</span>
                            <input
                              value={
                                rowDrafts[row.row_number]?.[error.field] ??
                                getEffectiveRowValue(row, workerImport.mappings, error.field)
                              }
                              onChange={(event) =>
                                updateRowDraft(row.row_number, error.field, event.target.value)
                              }
                              disabled={isLocallyExcluded}
                              aria-label={`${row.row_number}행 ${getWorkerImportFieldLabel(error.field)}`}
                            />
                            <small>{error.message}</small>
                          </label>
                        ))}
                        <label className={styles.excludeControl}>
                          <input
                            type="checkbox"
                            checked={isLocallyExcluded}
                            onChange={() => toggleExcluded(row.row_number)}
                          />
                          {row.row_number}행 등록 제외
                        </label>
                      </div>
                    )}
                  </article>
                )
              })}
            </div>

            <div className={styles.pagination}>
              <Button
                variant="secondary"
                disabled={workerImport.page === 0 || busyAction !== null}
                onClick={() => handlePageChange(workerImport.page - 1)}
              >
                이전 행
              </Button>
              <span>{workerImport.page + 1}페이지</span>
              <Button
                variant="secondary"
                disabled={!canMoveToNextPage || busyAction !== null}
                onClick={() => handlePageChange(workerImport.page + 1)}
              >
                다음 행
              </Button>
            </div>

            {workerImport.invalid_rows > invalidRows.length && (
              <p className={styles.inlineWarning}>
                다른 페이지에도 수정이 필요한 행이 있습니다. 페이지를 이동해 확인해 주세요.
              </p>
            )}

            <div className={styles.actionRow}>
              <Button
                type="button"
                variant="secondary"
                disabled={busyAction !== null}
                onClick={() => setStep(3)}
              >
                열 연결 수정
              </Button>
              <div className={styles.reviewActions}>
                {invalidRows.length > 0 && (
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={busyAction !== null}
                    isLoading={busyAction === 'rows'}
                    onClick={handleSaveRows}
                  >
                    수정·제외 저장 후 재검증
                  </Button>
                )}
                <Button
                  type="button"
                  disabled={
                    busyAction !== null ||
                    workerImport.invalid_rows > 0 ||
                    workerImport.valid_rows === 0
                  }
                  isLoading={busyAction === 'commit'}
                  onClick={handleCommit}
                >
                  정상 {workerImport.valid_rows}명 등록 →
                </Button>
              </div>
            </div>
          </div>
        )}

        {step === 5 && workerImport && (
          <div>
            <h1 className={styles.title}>{workerImport.committed_rows}명 등록을 완료했습니다.</h1>
            <p className={styles.description}>
              서버 등록 결과가 반영됐습니다. 이제 업무 요청에서 등록한 근로자를 선택할 수 있습니다.
            </p>
            <div className={styles.resultGrid}>
              <div className={styles.resultCard}>
                <p className={styles.resultCount}>{workerImport.committed_rows}</p>
                <p className={styles.resultLabel}>등록 완료</p>
              </div>
              <div className={styles.resultCard}>
                <p className={styles.resultCount}>{workerImport.excluded_rows}</p>
                <p className={styles.resultLabel}>제외</p>
              </div>
              <div className={styles.resultCard}>
                <p className={styles.resultCount}>{workerImport.invalid_rows}</p>
                <p className={styles.resultLabel}>미등록</p>
              </div>
            </div>
            <div className={styles.finishRow}>
              <button
                type="button"
                className={styles.finishLink}
                onClick={() => finishOnboarding('/workers')}
              >
                근로자 목록 보기 →
              </button>
              <button
                type="button"
                className={styles.finishLink}
                onClick={() => finishOnboarding('/tasks/new')}
              >
                새 업무 요청 →
              </button>
            </div>
            <div className={styles.actionRowEnd}>
              <Button type="button" onClick={() => finishOnboarding('/dashboard')}>
                대시보드로 이동
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
