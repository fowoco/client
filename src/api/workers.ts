import { apiFetch } from './client'

// fowoco/server WorkerController / WorkerResponse 기준 (#5 Worker API).
export type WorkStatus = 'ACTIVE' | 'ON_LEAVE' | 'RESIGNED' | 'TERMINATED'

export interface WorkerResponse {
  worker_id: string
  company_id: string
  display_name: string
  nationality_code: string
  preferred_language: string
  work_status: WorkStatus
  stay_expiry_date: string | null
  contract_start_date: string | null
  contract_end_date: string | null
  created_at: string
  updated_at: string
  version: number
}

export interface WorkerPageResponse {
  items: WorkerResponse[]
  page: number
  size: number
  total_elements: number
}

export interface FetchWorkersParams {
  status?: WorkStatus
  language?: string
  expiryBefore?: string
  page?: number
  size?: number
}

// GET /api/v1/workers에는 자유 텍스트 검색 파라미터가 없다(#152 조사 결과) — 목록 화면의
// 검색창은 이 함수가 받아온 페이지 안에서만 클라이언트 필터링한다.
export function fetchWorkers(params: FetchWorkersParams = {}): Promise<WorkerPageResponse> {
  const query = new URLSearchParams()
  if (params.status) query.set('status', params.status)
  if (params.language) query.set('language', params.language)
  if (params.expiryBefore) query.set('expiryBefore', params.expiryBefore)
  query.set('page', String(params.page ?? 0))
  query.set('size', String(params.size ?? 100))
  return apiFetch<WorkerPageResponse>(`/workers?${query.toString()}`)
}

export function fetchWorkerById(workerId: string): Promise<WorkerResponse> {
  return apiFetch<WorkerResponse>(`/workers/${encodeURIComponent(workerId)}`)
}

// 여권번호·외국인등록번호·전화번호·계좌번호는 WorkerController가 이 API로 수집하지 않는다.
export interface WorkerCreateBody {
  display_name: string
  nationality_code?: string
  preferred_language?: string
  stay_expiry_date?: string
  contract_start_date?: string
  contract_end_date?: string
}

export function registerWorker(body: WorkerCreateBody): Promise<WorkerResponse> {
  return apiFetch<WorkerResponse>('/workers', { method: 'POST', body: JSON.stringify(body) })
}

export interface WorkerPatchBody {
  display_name?: string
  nationality_code?: string
  preferred_language?: string
  work_status?: WorkStatus
  stay_expiry_date?: string
  contract_start_date?: string
  contract_end_date?: string
  expected_version: number
}

export function patchWorker(workerId: string, body: WorkerPatchBody): Promise<WorkerResponse> {
  return apiFetch<WorkerResponse>(`/workers/${encodeURIComponent(workerId)}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
}
