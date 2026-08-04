import { useRef, useState, type ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { MobileShell } from '../../components/mobile/MobileShell'
import styles from './LinkUploadPage.module.css'
import { HELP_LINKS } from './linkUploadData'

const MAX_FILE_SIZE = 10 * 1024 * 1024
const ACCEPTED_FILE_TYPES = ['image/jpeg', 'image/png', 'application/pdf']

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))}KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
}

export function LinkUploadPage() {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0] ?? null
    setFileError(null)
    if (!selected) return
    if (!ACCEPTED_FILE_TYPES.includes(selected.type)) {
      setFile(null)
      setFileError('JPG, PNG, PDF 파일만 선택할 수 있습니다.')
      event.target.value = ''
      return
    }
    if (selected.size > MAX_FILE_SIZE) {
      setFile(null)
      setFileError('파일 크기는 10MB 이하여야 합니다.')
      event.target.value = ''
      return
    }
    setFile(selected)
  }

  function handleRemoveFile() {
    setFile(null)
    setFileError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <MobileShell title="여권 사본 제출" onBack={() => navigate(-1)} right={<span>1 / 1</span>}>
      <h1 className={styles.headline}>
        사진 또는 파일을
        <br />
        추가해 주세요
      </h1>
      <p className={styles.subtext}>여권 사진면 전체가 보이고 글자가 흐리지 않은지 확인해 주세요.</p>

      <button
        type="button"
        className={styles.dropzone}
        aria-label="파일 또는 사진 선택"
        onClick={() => fileInputRef.current?.click()}
      >
        <p className={styles.dropzonePlus}>＋</p>
        <p className={styles.dropzoneLabel}>파일 또는 사진 선택</p>
        <p className={styles.dropzoneHint}>JPG, PNG, PDF · 최대 10MB</p>
      </button>
      <input
        ref={fileInputRef}
        className={styles.fileInput}
        type="file"
        accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
        aria-label="제출할 파일 선택"
        onChange={handleFileChange}
      />

      {fileError && <p className={styles.fileError} role="alert">{fileError}</p>}

      {file && (
        <div className={styles.selectedFile}>
          <div>
            <p className={styles.fileName}>{file.name}</p>
            <p className={styles.fileMeta}>
              {formatFileSize(file.size)} · 제출 전
            </p>
          </div>
          <button type="button" className={styles.removeFile} onClick={handleRemoveFile}>
            삭제
          </button>
        </div>
      )}

      <p className={styles.helpLabel}>제출이 어렵다면</p>
      <div className={styles.helpLinks}>
        {HELP_LINKS.map((label, index) => (
          <button
            key={label}
            type="button"
            className={`${styles.helpLink} ${index === 0 ? styles.helpLinkPrimary : ''}`}
            disabled
            title="문의 API 연결 필요"
          >
            <span>{label}</span>
            <span>→</span>
          </button>
        ))}
      </div>

      <button type="button" className={styles.submit} disabled>
        제출 API 연결 필요
      </button>

      <p className={styles.footnote}>
        파일 선택과 형식 검증만 가능합니다. 보안 링크 토큰·업로드·제출 API 연결 후 실제 기록됩니다.
      </p>
    </MobileShell>
  )
}
