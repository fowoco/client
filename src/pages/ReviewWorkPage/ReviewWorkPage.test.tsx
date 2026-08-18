import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useToastStore } from '../../store/toastStore'
import { ReviewWorkPage } from './ReviewWorkPage'
import type { AiRunResponse } from '../../api/aiRuns'

beforeEach(() => {
  useToastStore.setState({ toasts: [] })
})

afterEach(() => {
  vi.useRealTimers()
})

function renderPage(path = '/tasks/new/review', state?: unknown) {
  render(
    <MemoryRouter initialEntries={[state ? { pathname: path, state } : path]}>
      <Routes>
        <Route path="/tasks/new/review" element={<ReviewWorkPage />} />
        <Route path="/tasks" element={<p>업무함</p>} />
        <Route path="/tasks/new" element={<p>업무 생성 페이지</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('ReviewWorkPage', () => {
  it('uses the server AiRun result when an actual analysis is provided', () => {
    const aiRun: AiRunResponse = {
      ai_run_id: 'A-1',
      request_id: 'R-1',
      instruction: '응웬반A 체류기간 연장 준비',
      status: 'SUCCEEDED',
      analysis_outcome: 'NEEDS_INFO',
      detected_intent: 'EXPIRY_RENEWAL',
      evidence: null,
      error_code: null,
      attempt_count: 1,
      version: 1,
      questions: [
        {
          slot_key: 'due_at',
          label: '신청 목표일을 입력해 주세요.',
          input_type: 'TEXT',
          required: true,
          answer: null,
        },
      ],
      candidates: [],
      created_at: '2026-08-08T00:00:00Z',
      updated_at: '2026-08-08T00:00:01Z',
    }

    renderPage('/tasks/new/review', { aiRun })

    expect(screen.getByText(aiRun.instruction)).toBeInTheDocument()
    expect(screen.getByRole('group', { name: '업무 준비 완료 희망일 *' })).toBeInTheDocument()
  })

  it('redirects to the request input screen when there is no aiRunId to review', async () => {
    renderPage('/tasks/new/review')

    expect(await screen.findByText('업무 생성 페이지')).toBeInTheDocument()
  })
})
