import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { WorkerPageResponse, WorkerResponse } from '../../api/workers'
import { WorkerListPage } from './WorkerListPage'
import styles from './WorkerListPage.module.css'

function isoDateOffset(days: number): string {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

function worker(overrides: Partial<WorkerResponse>): WorkerResponse {
  return {
    worker_id: 'W-1',
    company_id: 'C-1',
    display_name: '응웬반A',
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

const WORKERS: WorkerResponse[] = [
  worker({ worker_id: 'W-021', display_name: '응웬반A', stay_expiry_date: isoDateOffset(12) }),
  worker({ worker_id: 'W-018', display_name: '쩐티B', nationality_code: 'VN', stay_expiry_date: isoDateOffset(21) }),
  worker({ worker_id: 'W-032', display_name: '수라즈C', nationality_code: 'NP', stay_expiry_date: isoDateOffset(35) }),
  worker({ worker_id: 'W-014', display_name: '아흐메드D', nationality_code: 'BD', stay_expiry_date: isoDateOffset(62) }),
  worker({ worker_id: 'W-027', display_name: '솜차이E', nationality_code: 'TH', stay_expiry_date: null }),
  worker({ worker_id: 'W-041', display_name: '판반F', nationality_code: 'VN', stay_expiry_date: isoDateOffset(5) }),
]

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
}

function errorResponse(status: number, code: string, message: string) {
  return jsonResponse(
    { timestamp: '2026-07-27T01:23:45Z', status, code, message, path: '/api/v1/workers', request_id: 'req-1', field_errors: [] },
    { status },
  )
}

function pageResponse(items: WorkerResponse[]): WorkerPageResponse {
  return { items, page: 0, size: 100, total_elements: items.length }
}

function renderPage(initialPath = '/workers') {
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/workers" element={<WorkerListPage />} />
        <Route path="/workers/:workerId" element={<WorkerListPage />} />
        <Route path="/workers/:workerId/detail" element={<p>근로자 상세 페이지</p>} />
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

describe('WorkerListPage', () => {
  it('renders the top 5 priority workers sorted by deadline urgency', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse(pageResponse(WORKERS)))
    renderPage()

    expect(await screen.findByRole('heading', { name: '판반F' })).toBeInTheDocument()
    expect(screen.getAllByText('판반F').length).toBeGreaterThan(0)
    expect(screen.queryByText('솜차이E')).not.toBeInTheDocument()
  })

  it('shows every worker after clicking "전체 근로자 보기"', async () => {
    const user = userEvent.setup()
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse(pageResponse(WORKERS)))
    renderPage()

    await screen.findByRole('button', { name: '전체 근로자 보기 →' })
    await user.click(screen.getByRole('button', { name: '전체 근로자 보기 →' }))

    for (const item of WORKERS) {
      expect(screen.getAllByText(item.display_name).length).toBeGreaterThan(0)
    }
  })

  it('filters workers by search query within the loaded page', async () => {
    const user = userEvent.setup()
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse(pageResponse(WORKERS)))
    renderPage()

    await screen.findByLabelText('근로자 검색')
    await user.type(screen.getByLabelText('근로자 검색'), '수라즈C')

    await waitFor(() => {
      expect(screen.queryByText('쩐티B')).not.toBeInTheDocument()
    })
    expect(screen.getAllByText('수라즈C').length).toBeGreaterThan(0)
  })

  it('shows an empty state when a search has no matches', async () => {
    const user = userEvent.setup()
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse(pageResponse(WORKERS)))
    renderPage()

    await screen.findByLabelText('근로자 검색')
    await user.type(screen.getByLabelText('근로자 검색'), '존재하지않는이름')

    expect(await screen.findByText('표시할 근로자가 없습니다')).toBeInTheDocument()
  })

  it('switches the detail panel when a different worker is selected', async () => {
    const user = userEvent.setup()
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse(pageResponse(WORKERS)))
    renderPage()

    await user.click(await screen.findByRole('button', { name: /쩐티B/ }))

    expect(screen.getByRole('heading', { name: '쩐티B' })).toBeInTheDocument()
  })

  it('navigates to the worker detail page when "더 보기" is clicked', async () => {
    const user = userEvent.setup()
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse(pageResponse(WORKERS)))
    renderPage()

    await user.click(await screen.findByRole('button', { name: '기본정보·서류·안내이력 더 보기 ▾' }))

    expect(await screen.findByText('근로자 상세 페이지')).toBeInTheDocument()
  })

  it('shows a loading state', () => {
    vi.mocked(fetch).mockReturnValue(new Promise(() => {}))
    renderPage()
    expect(screen.getByText('근로자 목록을 불러오는 중입니다')).toBeInTheDocument()
  })

  it('shows an error state with a retry action', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(errorResponse(500, 'INTERNAL_SERVER_ERROR', 'raw'))
    renderPage()

    expect(await screen.findByRole('button', { name: '다시 시도' })).toBeInTheDocument()
  })

  it('shows an empty state when there are no workers', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse(pageResponse([])))
    renderPage()

    expect(await screen.findByText('등록된 근로자가 없습니다')).toBeInTheDocument()
  })

  it('shows a cap notice when the server has more workers than the fetched page', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      jsonResponse({ items: WORKERS, page: 0, size: 100, total_elements: 150 }),
    )
    renderPage()

    expect(await screen.findByText(/전체 150명 중 6명만 불러왔습니다/)).toBeInTheDocument()
  })

  it('renders the deep-linked worker as selected when visiting /workers/:workerId', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse(pageResponse(WORKERS)))
    renderPage(`/workers/${WORKERS[1].worker_id}`)

    expect(await screen.findByRole('heading', { name: '쩐티B' })).toBeInTheDocument()
  })

  it('filters workers when the deadline filter changes', async () => {
    const user = userEvent.setup()
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse(pageResponse(WORKERS)))
    renderPage()

    const trigger = await screen.findByRole('button', { name: '기한 필터' })
    expect(trigger).toHaveTextContent('기한 · 90일')

    await user.click(trigger)
    await user.click(screen.getByRole('option', { name: '기한 · 30일' }))

    expect(trigger).toHaveTextContent('기한 · 30일')
    expect(screen.getAllByText('응웬반A').length).toBeGreaterThan(0)
    expect(screen.queryByText('아흐메드D')).not.toBeInTheDocument()
  })

  it('colors the deadline text by urgency tier', async () => {
    const user = userEvent.setup()
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse(pageResponse(WORKERS)))
    renderPage()

    await user.click(await screen.findByRole('button', { name: '전체 근로자 보기 →' }))

    const urgentRow = screen
      .getAllByText('D-5 체류만료')
      .find((el) => el.className.includes(styles.workerDeadline))
    expect(urgentRow).toHaveClass(styles.workerDeadlineUrgent)
    const comfortableRow = screen
      .getAllByText('정상')
      .find((el) => el.className.includes(styles.workerDeadline))
    expect(comfortableRow).toHaveClass(styles.workerDeadlineComfortable)
  })
})
