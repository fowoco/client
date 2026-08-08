import { apiFetch, apiFetchBlob } from './client'

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

export interface FileDownloadResponse {
  blob: Blob
  file_name: string | null
}

function getDownloadFileName(contentDisposition: string | null): string | null {
  if (!contentDisposition) return null

  const encoded = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1]
  if (encoded) {
    try {
      return decodeURIComponent(encoded)
    } catch {
      return encoded
    }
  }

  return contentDisposition.match(/filename="([^"]+)"/i)?.[1] ?? null
}

export async function downloadFile(fileId: string): Promise<FileDownloadResponse> {
  const response = await apiFetchBlob(`/files/${encodeURIComponent(fileId)}/content`)
  return {
    blob: await response.blob(),
    file_name: getDownloadFileName(response.headers.get('Content-Disposition')),
  }
}
