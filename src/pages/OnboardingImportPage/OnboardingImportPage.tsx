import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../components/ui/Button/Button'
import { StatusLabel, type StatusTone } from '../../components/ui/StatusLabel/StatusLabel'
import { useToastStore } from '../../store/toastStore'
import {
  ANALYSIS_STAGES,
  INITIAL_REVIEW_CANDIDATES,
  REVIEW_STATUS_LABEL,
  START_OPTIONS,
  SUPPORTED_FORMATS,
  type ReviewCandidate,
  type StartMode,
} from './onboardingImportData'
import { clearOnboardingImportPending } from './onboardingImportStorage'
import styles from './OnboardingImportPage.module.css'

const STEP_COUNT = 5
const STEP_TITLES = ['시작 방식', '파일 업로드', '자료 분석 중', '검토 및 연결', '등록 결과']

const REVIEW_STATUS_TONE: Record<ReviewCandidate['status'], StatusTone> = {
  ready: 'success',
  'needs-info': 'warning',
  duplicate: 'critical',
  'doc-type': 'warning',
}

export function OnboardingImportPage() {
  const navigate = useNavigate()
  const showToast = useToastStore((state) => state.showToast)

  const [step, setStep] = useState(1)
  const [startMode, setStartMode] = useState<StartMode | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [analysisDone, setAnalysisDone] = useState(0)
  const [candidates, setCandidates] = useState<ReviewCandidate[]>(INITIAL_REVIEW_CANDIDATES)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const blockedCandidateCount = candidates.filter((c) => c.status !== 'ready').length

  function finishOnboarding(destination: string, message?: string) {
    clearOnboardingImportPending()
    if (message) showToast(message)
    navigate(destination)
  }

  function handleStartNext() {
    if (startMode === 'migrate') {
      setStep(2)
    } else if (startMode === 'manual') {
      finishOnboarding('/workers', 'AI에게 업무 요청으로 근로자를 등록해 보세요.')
    } else {
      finishOnboarding('/dashboard')
    }
  }

  function handleFileChosen(files: FileList | null) {
    const file = files?.[0]
    if (file) setFileName(file.name)
  }

  // 데모: 실제 파일 파싱 없이 분석 단계를 순서대로 흉내낸다.
  useEffect(() => {
    if (step !== 3) return
    setAnalysisDone(0)
    const timer = setInterval(() => {
      setAnalysisDone((prev) => {
        const next = prev + 1
        if (next >= ANALYSIS_STAGES.length) {
          clearInterval(timer)
          setTimeout(() => setStep(4), 400)
        }
        return next
      })
    }, 500)
    return () => clearInterval(timer)
  }, [step])

  function resolveCandidate(id: string) {
    setCandidates((prev) => prev.map((c) => (c.id === id ? { ...c, status: 'ready' } : c)))
  }

  const readyCount = candidates.filter((c) => c.status === 'ready').length

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
        {Array.from({ length: STEP_COUNT }, (_, index) => index + 1).map((s) => (
          <span
            key={s}
            className={`${styles.stepDot} ${s < step ? styles.stepDotDone : s === step ? styles.stepDotActive : ''}`}
          />
        ))}
      </div>

      <main className={styles.content}>
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
            <h1 className={styles.title}>근로자 파일을 올려주세요.</h1>
            <p className={styles.description}>
              근로자 표와 관련 문서를 분리해서 업로드합니다. Agent가 후보 컬럼을 추천합니다.
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
                accept=".xlsx,.csv,.pdf,.jpg,.jpeg,.png,.hwp,.hwpx,.docx"
              />
              {fileName ? (
                <p className={styles.fileName}>{fileName}</p>
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
              <Button type="button" variant="secondary" onClick={() => setStep(1)}>
                이전
              </Button>
              <Button type="button" disabled={!fileName} onClick={() => setStep(3)}>
                자료 분석 시작 →
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h1 className={styles.title}>자료를 분석하고 있습니다.</h1>
            <p className={styles.description}>
              업로드한 원본은 변경하지 않고 단계별 분석 상태만 보여드립니다.
            </p>
            <ul className={styles.analysisList}>
              {ANALYSIS_STAGES.map((stage, index) => (
                <li key={stage} className={styles.analysisRow}>
                  <span
                    className={`${styles.analysisIcon} ${index < analysisDone ? styles.analysisIconDone : ''}`}
                    aria-hidden="true"
                  >
                    {index < analysisDone ? '✓' : index + 1}
                  </span>
                  {stage}
                </li>
              ))}
            </ul>
            <div className={styles.actionRowEnd}>
              <Button type="button" variant="secondary" onClick={() => finishOnboarding('/dashboard')}>
                분석 취소하고 홈으로
              </Button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div>
            <h1 className={styles.title}>근로자·문서 후보를 검토합니다.</h1>
            <p className={styles.description}>
              {blockedCandidateCount > 0
                ? `확인이 필요한 항목 ${blockedCandidateCount}건을 해결해야 등록을 확정할 수 있습니다.`
                : '모든 항목이 준비됐습니다. 등록을 확정하세요.'}
            </p>
            <div className={styles.candidateList}>
              {candidates.map((candidate) => (
                <div key={candidate.id} className={styles.candidateRow}>
                  <div>
                    <p className={styles.candidateName}>{candidate.name}</p>
                    <p className={styles.candidateDetail}>{candidate.detail}</p>
                  </div>
                  <StatusLabel tone={REVIEW_STATUS_TONE[candidate.status]}>
                    {REVIEW_STATUS_LABEL[candidate.status]}
                  </StatusLabel>
                  {candidate.status !== 'ready' && (
                    <button
                      type="button"
                      className={styles.candidateAction}
                      onClick={() => resolveCandidate(candidate.id)}
                    >
                      확인 완료
                    </button>
                  )}
                </div>
              ))}
            </div>
            <div className={styles.actionRow}>
              <Button type="button" variant="secondary" onClick={() => setStep(2)}>
                이전
              </Button>
              <Button type="button" disabled={blockedCandidateCount > 0} onClick={() => setStep(5)}>
                등록 확정 →
              </Button>
            </div>
          </div>
        )}

        {step === 5 && (
          <div>
            <h1 className={styles.title}>{readyCount}명 등록을 완료했습니다.</h1>
            <p className={styles.description}>등록 결과와 다음 진입점을 확인하세요.</p>
            <div className={styles.resultGrid}>
              <div className={styles.resultCard}>
                <p className={styles.resultCount}>{readyCount}</p>
                <p className={styles.resultLabel}>등록 완료</p>
              </div>
              <div className={styles.resultCard}>
                <p className={styles.resultCount}>0</p>
                <p className={styles.resultLabel}>보류</p>
              </div>
              <div className={styles.resultCard}>
                <p className={styles.resultCount}>0</p>
                <p className={styles.resultLabel}>실패</p>
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
                onClick={() => finishOnboarding('/documents')}
              >
                문서함 보기 →
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
