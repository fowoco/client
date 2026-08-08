import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { decideAiRunCandidates } from './aiRuns'

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          decision_batch_id: 'D-1',
          ai_run_id: 'A-1',
          case_id: 'CASE-1',
          task_ids: ['T-1'],
          decisions: [
            { candidate_id: 'C-1', action: 'ACCEPT' },
            { candidate_id: 'C-2', action: 'DISCARD' },
          ],
          run_version: 4,
        }),
        { status: 201, headers: { 'Content-Type': 'application/json' } },
      ),
    ),
  )
})

afterEach(() => vi.unstubAllGlobals())

describe('decideAiRunCandidates', () => {
  it('POSTs the selected candidate decision with version and idempotency key', async () => {
    await decideAiRunCandidates(
      'A/1',
      3,
      [
        { candidate_id: 'C-1', action: 'ACCEPT' },
        { candidate_id: 'C-2', action: 'DISCARD' },
      ],
      'decision-key',
    )

    const [url, init] = vi.mocked(fetch).mock.calls[0]
    expect(url).toContain('/ai-runs/A%2F1/candidate-decisions')
    expect(init?.method).toBe('POST')
    expect(new Headers(init?.headers).get('Idempotency-Key')).toBe('decision-key')
    expect(JSON.parse(String(init?.body))).toEqual({
      expected_run_version: 3,
      decisions: [
        { candidate_id: 'C-1', action: 'ACCEPT' },
        { candidate_id: 'C-2', action: 'DISCARD' },
      ],
    })
  })
})
