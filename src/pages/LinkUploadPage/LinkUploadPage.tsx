import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MobileShell } from '../../components/mobile/MobileShell'
import styles from './LinkUploadPage.module.css'
import { DEMO_FILE, HELP_LINKS } from './linkUploadData'

export function LinkUploadPage() {
  const navigate = useNavigate()
  const [fileSelected, setFileSelected] = useState(false)

  function handleSubmit() {
    // TODO(backend): POST /api/links/:token/submit (multipart) -> 제출 완료 처리
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
        onClick={() => setFileSelected(true)}
      >
        <p className={styles.dropzonePlus}>＋</p>
        <p className={styles.dropzoneLabel}>파일 또는 사진 선택</p>
        <p className={styles.dropzoneHint}>JPG, PNG, PDF · 최대 10MB</p>
      </button>

      {fileSelected && (
        <div className={styles.selectedFile}>
          <div>
            <p className={styles.fileName}>{DEMO_FILE.name}</p>
            <p className={styles.fileMeta}>
              {DEMO_FILE.size} · {DEMO_FILE.status}
            </p>
          </div>
          <button type="button" className={styles.removeFile} onClick={() => setFileSelected(false)}>
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
          >
            <span>{label}</span>
            <span>→</span>
          </button>
        ))}
      </div>

      <button type="button" className={styles.submit} disabled={!fileSelected} onClick={handleSubmit}>
        제출하기
      </button>

      <p className={styles.footnote}>제출 후 HR 담당자가 확인하면 기존 업무에 기록됩니다.</p>
    </MobileShell>
  )
}
