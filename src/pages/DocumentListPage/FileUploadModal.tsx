import { useEffect, useRef, useState, type ChangeEvent, type DragEvent } from 'react'
import { Modal } from '../../components/ui/Modal/Modal'
import styles from './FileUploadModal.module.css'

// TODO(backend): server에 파일 업로드 API가 아직 없다(#158 조사 결과 — MultipartFile을 받는
// 컨트롤러가 fowoco/server에 전혀 없음). API가 생기면 이 setTimeout 시뮬레이션을
// POST /api/v1/files(multipart)로 교체하고, 반환된 file_id를 문서 분석/AiRun 로직에 전달한다.

type UploadStatus = 'uploading' | 'done' | 'error'

interface UploadEntry {
  id: string
  name: string
  size: number
  status: UploadStatus
  fileId?: string
  errorMessage?: string
}

const ALLOWED_EXTENSIONS = ['.hwp', '.hwpx']
const MAX_SIZE_BYTES = 10 * 1024 * 1024
const UPLOAD_DELAY_MS = 900

function isAllowedFile(file: File): boolean {
  const name = file.name.toLowerCase()
  return ALLOWED_EXTENSIONS.some((ext) => name.endsWith(ext))
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)}KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
}

export interface FileUploadModalProps {
  open: boolean
  onClose: () => void
}

export function FileUploadModal({ open, onClose }: FileUploadModalProps) {
  const [entries, setEntries] = useState<UploadEntry[]>([])
  const [dragActive, setDragActive] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => {
    const pendingTimers = timers.current
    return () => {
      for (const timer of pendingTimers) clearTimeout(timer)
    }
  }, [])

  function addFiles(files: FileList | null) {
    if (!files) return

    for (const file of Array.from(files)) {
      const id = `${file.name}-${file.size}-${Date.now()}-${Math.random()}`

      if (!isAllowedFile(file)) {
        setEntries((prev) => [
          ...prev,
          { id, name: file.name, size: file.size, status: 'error', errorMessage: '지원하지 않는 파일 형식입니다 (HWP/HWPX만 가능)' },
        ])
        continue
      }

      if (file.size > MAX_SIZE_BYTES) {
        setEntries((prev) => [
          ...prev,
          { id, name: file.name, size: file.size, status: 'error', errorMessage: '파일이 너무 큽니다 (최대 10MB)' },
        ])
        continue
      }

      setEntries((prev) => [...prev, { id, name: file.name, size: file.size, status: 'uploading' }])

      const timer = setTimeout(() => {
        setEntries((prev) =>
          prev.map((entry) =>
            entry.id === id ? { ...entry, status: 'done', fileId: `file-${Math.random().toString(36).slice(2, 10)}` } : entry,
          ),
        )
      }, UPLOAD_DELAY_MS)
      timers.current.push(timer)
    }
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    addFiles(event.target.files)
    event.target.value = ''
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setDragActive(false)
    addFiles(event.dataTransfer.files)
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setDragActive(true)
  }

  function handleDragLeave() {
    setDragActive(false)
  }

  function handleRemove(id: string) {
    setEntries((prev) => prev.filter((entry) => entry.id !== id))
  }

  return (
    <Modal open={open} onClose={onClose} title="HWP/HWPX 문서 업로드">
      <p className={styles.description}>문서 자동화에 사용할 HWP·HWPX 파일을 올려주세요.</p>

      <div
        className={`${styles.dropzone} ${dragActive ? styles.dropzoneActive : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <p className={styles.dropzoneLabel}>여기로 파일을 끌어다 놓거나</p>
        <button type="button" className={styles.browseButton} onClick={() => inputRef.current?.click()}>
          파일 탐색기에서 선택
        </button>
        <p className={styles.dropzoneHint}>HWP, HWPX · 최대 10MB</p>
        <input
          ref={inputRef}
          type="file"
          accept=".hwp,.hwpx"
          multiple
          className={styles.hiddenInput}
          aria-label="HWP/HWPX 파일 선택"
          onChange={handleInputChange}
        />
      </div>

      {entries.length > 0 && (
        <ul className={styles.fileList}>
          {entries.map((entry) => (
            <li key={entry.id} className={styles.fileRow}>
              <div className={styles.fileInfo}>
                <p className={styles.fileName}>{entry.name}</p>
                <p className={styles.fileMeta}>
                  {formatFileSize(entry.size)}
                  {entry.status === 'uploading' && ' · 업로드 중...'}
                  {entry.status === 'done' && ` · 업로드 완료 · ${entry.fileId}`}
                  {entry.status === 'error' && ` · ${entry.errorMessage}`}
                </p>
              </div>
              <span
                className={`${styles.statusDot} ${
                  entry.status === 'done'
                    ? styles.statusDone
                    : entry.status === 'error'
                      ? styles.statusError
                      : styles.statusUploading
                }`}
                aria-hidden="true"
              />
              <button type="button" className={styles.removeButton} onClick={() => handleRemove(entry.id)}>
                삭제
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className={styles.actionRow}>
        <button type="button" className={styles.closeButton} onClick={onClose}>
          닫기
        </button>
      </div>
    </Modal>
  )
}
