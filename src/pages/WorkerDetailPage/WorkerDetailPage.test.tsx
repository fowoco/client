import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { WorkerResponse } from '../../api/workers'
import { WorkerDetailPage } from './WorkerDetailPage'

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
}

function errorResponse(status: number, code: string, message: string) {
  return jsonResponse(
    { timestamp: '2026-07-27T01:23:45Z', status, code, message, path: '/api/v1/workers/W-1', request_id: 'req-1', field_errors: [] },
    { status },
  )
}

function worker(overrides: Partial<WorkerResponse> = {}): WorkerResponse {
  return {
    worker_id: 'W-018',
    company_id: 'C-1',
    display_name: '쩐티B',
    nationality_code: 'VN',
    preferred_language: 'vi',
    work_status: 'ACTIVE',
    stay_expiry_date: null,
    contract_start_date: null,
    contract_end_date: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    version: 1,
    ...overrides,
  }
}

function renderPage(workerId: string) {
  render(
    <MemoryRouter initialEntries={[`/workers/${workerId}/detail`]}>
      <Routes>
        <Route path="/workers/:workerId/detail" element={<WorkerDetailPage />} />
        <Route path="/workers/:workerId" element={<p>근로자 목록</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn())
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('WorkerDetailPage', () => {
  it('renders basic profile info for the selected worker', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse(worker()))
    renderPage('W-018')

    expect(await screen.findByRole('heading', { name: '쩐티B' })).toBeInTheDocument()
    expect(screen.getByText('VN')).toBeInTheDocument()
    expect(screen.getAllByText('준비 중').length).toBeGreaterThan(0)
  })

  it('shows documents matched by worker name', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse(worker({ display_name: '쩐티B' })))
    renderPage('W-018')

    expect(await screen.findByText('표준근로계약서')).toBeInTheDocument()
  })

  it('shows an empty state when the worker has no matching documents', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse(worker({ display_name: '이름없음' })))
    renderPage('W-999')

    expect(await screen.findByText('제출된 서류가 없습니다')).toBeInTheDocument()
  })

  it('shows a loading state', () => {
    vi.mocked(fetch).mockReturnValue(new Promise(() => {}))
    renderPage('W-018')

    expect(screen.getByText('근로자 정보를 불러오는 중입니다')).toBeInTheDocument()
  })

  it('shows an error state with a retry action', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(errorResponse(404, 'RESOURCE_NOT_FOUND', 'raw'))
    renderPage('does-not-exist')

    expect(await screen.findByRole('button', { name: '다시 시도' })).toBeInTheDocument()
  })
})
