import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { RenewalExecutionResponse } from '../../../api/renewal'
import { RenewalExecutionModal } from './RenewalExecutionModal'

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
}

function response(overrides: Partial<RenewalExecutionResponse> = {}): RenewalExecutionResponse {
  return {
    request_id: 'R-1',
    task_id: 'T-1',
    task_status: 'APPROVED',
    task_version: 2,
    intent: 'STAY_PERIOD_EXTENSION',
    workflow_id: 'WF-STY-001',
    confidence: 0.9,
    scenario: 'generate',
    outcome: '문서를 생성했습니다.',
    missing_slots: [],
    requested_fields: [],
    case_signals: [],
    generated_documents: [],
    worker_message_draft_id: null,
    worker_message_draft_version: null,
    human_review_required: true,
    ...overrides,
  }
}

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn())
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('RenewalExecutionModal', () => {
  it('runs the instruction and shows the outcome', async () => {
    const user = userEvent.setup()
    vi.mocked(fetch).mockResolvedValue(jsonResponse(response()))
    const onApplied = vi.fn()

    render(
      <RenewalExecutionModal
        open
        taskId="T-1"
        taskVersion={1}
        onClose={vi.fn()}
        onDownloadDocument={vi.fn()}
        onApplied={onApplied}
      />,
    )

    await user.type(
      screen.getByPlaceholderText('예: 응웬반A 체류기간 연장 준비해줘'),
      '체류기간 연장 준비해줘',
    )
    await user.click(screen.getByRole('button', { name: '실행' }))

    expect(await screen.findByText('문서를 생성했습니다.')).toBeInTheDocument()
    expect(onApplied).toHaveBeenCalledOnce()
    const call = vi.mocked(fetch).mock.calls[0]
    expect(String(call[0])).toContain('/tasks/T-1/renewal-run')
    expect(JSON.parse(String(call[1]?.body))).toEqual({
      instruction: '체류기간 연장 준비해줘',
      expected_version: 1,
    })
  })

  it('lets HR answer user-input slots and resubmits with the answers', async () => {
    const user = userEvent.setup()
    vi.mocked(fetch)
      .mockResolvedValueOnce(
        jsonResponse(
          response({
            task_status: 'NEEDS_INFO',
            outcome: '추가 정보가 필요합니다.',
            missing_slots: ['wage'],
            requested_fields: [{ key: 'wage', source_hint: 'USER_INPUT' }],
            task_version: 5,
          }),
        ),
      )
      .mockResolvedValueOnce(jsonResponse(response({ task_version: 6 })))

    render(
      <RenewalExecutionModal
        open
        taskId="T-1"
        taskVersion={4}
        onClose={vi.fn()}
        onDownloadDocument={vi.fn()}
        onApplied={vi.fn()}
      />,
    )

    await user.type(
      screen.getByPlaceholderText('예: 응웬반A 체류기간 연장 준비해줘'),
      '체류기간 연장 준비해줘',
    )
    await user.click(screen.getByRole('button', { name: '실행' }))
    expect(await screen.findByText('추가 정보가 필요합니다.')).toBeInTheDocument()

    await user.type(screen.getByLabelText('wage'), '2500000')
    await user.click(screen.getByRole('button', { name: '답변 제출하고 다시 실행' }))

    expect(await screen.findByText('문서를 생성했습니다.')).toBeInTheDocument()
    const secondCall = vi.mocked(fetch).mock.calls[1]
    expect(JSON.parse(String(secondCall[1]?.body))).toEqual({
      instruction: '체류기간 연장 준비해줘',
      expected_version: 5,
      slot_answers: { wage: '2500000' },
    })
  })

  it('shows an error message when the run fails', async () => {
    const user = userEvent.setup()
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse(
        {
          timestamp: '2026-08-12T00:00:00Z',
          status: 422,
          code: 'RENEWAL_NOT_APPLICABLE',
          message: 'Renewal 대상 업무가 아닙니다.',
          path: '/api/v1/tasks/T-1/renewal-run',
          request_id: 'req-1',
          field_errors: [],
        },
        { status: 422 },
      ),
    )

    render(
      <RenewalExecutionModal
        open
        taskId="T-1"
        taskVersion={1}
        onClose={vi.fn()}
        onDownloadDocument={vi.fn()}
        onApplied={vi.fn()}
      />,
    )

    await user.type(
      screen.getByPlaceholderText('예: 응웬반A 체류기간 연장 준비해줘'),
      '체류기간 연장 준비해줘',
    )
    await user.click(screen.getByRole('button', { name: '실행' }))

    expect(await screen.findByText('Renewal 대상 업무가 아닙니다.')).toBeInTheDocument()
  })
})
