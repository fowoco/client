import { apiFetch } from './client'

// fowoco/server FileController 기준 — 분석·증빙·근로자 제출용 공통 파일 업로드.
// 허용 형식은 image/jpeg·png·webp, application/pdf, 최대 20MB로 서버에 고정돼 있다.
export type ScanStatus = 'NOT_SCANNED' | 'CLEAN' | 'INFECTED'

export interface FileUploadResponse {
  file_id: string
  name: string
  mime_type: string
  size: number
  scan_status: ScanStatus
}

export interface UploadFileParams {
  file: File
  purpose: string
  taskId?: string
  workerId?: string
}

export function uploadFile(params: UploadFileParams): Promise<FileUploadResponse> {
  const formData = new FormData()
  formData.append('file', params.file)
  formData.append('purpose', params.purpose)
  if (params.taskId) formData.append('taskId', params.taskId)
  if (params.workerId) formData.append('workerId', params.workerId)
  return apiFetch<FileUploadResponse>('/files', { method: 'POST', body: formData })
}
