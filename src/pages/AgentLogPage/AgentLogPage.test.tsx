import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { AuditEventResponse } from '../../api/audit'
import { AgentLogPage } from './AgentLogPage'

function event(overrides: Partial<AuditEventResponse>): AuditEventResponse {
  return {
    audit_event_id: 'evt-1',
    actor_type: 'AI_AGENT',
    actor_id: 'a-1',
    user_role: null,
    action: 'TASK_CREATED',
    target_type: 'TASK',
    target_id: 'T-1',
    request_id: 'req-1',
    trace_id: '0'.repeat(32),
    event_version: '1',
    change_summary: '응웬반A 체류연장 요청문 초안을 작성했습니다.',
    created_at: '2026-07-27T00:00:00Z',
    ...overrides,
  }
}

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' }, ...init })
}

function errorResponse(status: number, code: string, message: string) {
  return jsonResponse(
    { timestamp: '2026-07-27T01:23:45Z', status, code, message, path: '/api/v1/audit-events', request_id: 'req-1', field_errors: [] },
    { status },
  )
}

function renderPage() {
  render(
    <MemoryRouter initialEntries={['/agent']}>
      <Routes>
        <Route path="/agent" element={<AgentLogPage />} />
        <Route path="/tasks/:caseId" element={<p>업무 상세</p>} />
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

describe('AgentLogPage', () => {
  it('renders every log row with its source label', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      jsonResponse({
        items: [
          event({ audit_event_id: 'evt-1', change_summary: '요청문 초안 작성' }),
          event({ audit_event_id: 'evt-2', actor_type: 'HR_USER', change_summary: 'HR이 검토를 요청함' }),
        ],
        next_cursor: null,
      }),
    )
    renderPage()

    expect(await screen.findByText('요청문 초안 작성')).toBeInTheDocument()
    expect(screen.getByText('HR이 검토를 요청함')).toBeInTheDocument()
    expect(screen.getByText('Agent 초안')).toBeInTheDocument()
    expect(screen.getByText('HR 확인')).toBeInTheDocument()
  })

  it('falls back to the action label when change_summary is missing', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      jsonResponse({ items: [event({ change_summary: null, action: 'TASK_APPROVED' })], next_cursor: null }),
    )
    renderPage()

    expect(await screen.findByText('승인했습니다.')).toBeInTheDocument()
  })

  it('sends the source filter as an actor_type query param', async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse({ items: [], next_cursor: null }))
    const user = userEvent.setup()
    renderPage()

    const trigger = screen.getByRole('button', { name: '근거 출처 필터' })
    await user.click(trigger)
    await user.click(screen.getByRole('option', { name: '근거 · Agent 초안' }))

    await waitFor(() => {
      const calledUrls = vi.mocked(fetch).mock.calls.map(([url]) => String(url))
      expect(calledUrls.some((url) => url.includes('actor_type=AI_AGENT'))).toBe(true)
    })
  })

  it('sends the period filter as a created_from query param', async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse({ items: [], next_cursor: null }))
    const user = userEvent.setup()
    renderPage()

    const trigger = screen.getByRole('button', { name: '기간 필터' })
    await user.click(trigger)
    await user.click(screen.getByRole('option', { name: '기간 · 오늘' }))

    await waitFor(() => {
      const calledUrls = vi.mocked(fetch).mock.calls.map(([url]) => String(url))
      expect(calledUrls.some((url) => url.includes('created_from='))).toBe(true)
    })
  })

  it('navigates to the related task when the target is a TASK', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      jsonResponse({ items: [event({ target_type: 'TASK', target_id: 'T-9' })], next_cursor: null }),
    )
    const user = userEvent.setup()
    renderPage()

    await user.click(await screen.findByRole('button', { name: '관련 업무 보기 →' }))

    expect(await screen.findByText('업무 상세')).toBeInTheDocument()
  })

  it('does not show a related-work link for non-TASK targets', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      jsonResponse({ items: [event({ target_type: 'APPROVAL_REQUEST', target_id: 'AR-1' })], next_cursor: null }),
    )
    renderPage()

    await screen.findByText('응웬반A 체류연장 요청문 초안을 작성했습니다.')
    expect(screen.queryByRole('button', { name: '관련 업무 보기 →' })).not.toBeInTheDocument()
  })

  it('shows a loading state', () => {
    vi.mocked(fetch).mockReturnValue(new Promise(() => {}))
    renderPage()
    expect(screen.getByText('Agent 이력을 불러오는 중입니다')).toBeInTheDocument()
  })

  it('shows an error state including access-denied for non-ADMIN users', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(errorResponse(403, 'ACCESS_DENIED', 'raw'))
    renderPage()

    expect(await screen.findByText('이 작업에 대한 권한이 없습니다.')).toBeInTheDocument()
  })

  it('shows an empty state when there are no logs', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ items: [], next_cursor: null }))
    renderPage()

    expect(await screen.findByText('Agent 처리 이력이 없습니다')).toBeInTheDocument()
  })
})
