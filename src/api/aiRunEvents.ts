import type { AiAnalysisOutcome, AiRunStatus } from './aiRuns'
import { getAccessToken, getApiUrl } from './client'

export type AiRunPublicEventType =
  | 'RUN_QUEUED'
  | 'RUN_STARTED'
  | 'SLOT_CHECKING'
  | 'NEEDS_INFO'
  | 'REVIEW_REQUIRED'
  | 'COMPLETED'
  | 'FAILED'

export interface AiRunPublicEvent {
  event_id: number
  ai_run_id: string
  type: AiRunPublicEventType
  status: AiRunStatus
  analysis_outcome: AiAnalysisOutcome | null
  attempt_count: number
  version: number
  occurred_at: string
}

export interface SubscribeAiRunEventsOptions {
  signal?: AbortSignal
  lastEventId?: string
  onEvent: (event: AiRunPublicEvent) => void
}

function parseEventBlock(block: string): AiRunPublicEvent | null {
  const dataLines: string[] = []
  for (const line of block.split(/\r?\n/)) {
    if (line.startsWith(':')) continue
    const separator = line.indexOf(':')
    const field = separator === -1 ? line : line.slice(0, separator)
    const value = separator === -1 ? '' : line.slice(separator + 1).replace(/^ /, '')
    if (field === 'data') dataLines.push(value)
  }
  if (dataLines.length === 0) return null
  return JSON.parse(dataLines.join('\n')) as AiRunPublicEvent
}

export async function subscribeAiRunEvents(
  aiRunId: string,
  options: SubscribeAiRunEventsOptions,
): Promise<void> {
  const headers = new Headers({ Accept: 'text/event-stream' })
  const token = getAccessToken()
  if (token) headers.set('Authorization', `Bearer ${token}`)
  if (options.lastEventId) headers.set('Last-Event-ID', options.lastEventId)

  const response = await fetch(getApiUrl(`/ai-runs/${encodeURIComponent(aiRunId)}/events`), {
    method: 'GET',
    headers,
    credentials: 'include',
    signal: options.signal,
  })
  if (!response.ok) {
    throw new Error(`AI Run event stream failed with ${response.status}`)
  }
  if (!response.headers.get('Content-Type')?.includes('text/event-stream') || !response.body) {
    throw new Error('AI Run event stream response is invalid')
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    buffer += decoder.decode(value, { stream: !done })
    const blocks = buffer.split(/\r?\n\r?\n/)
    buffer = blocks.pop() ?? ''
    for (const block of blocks) {
      const event = parseEventBlock(block)
      if (event) options.onEvent(event)
    }
    if (done) break
  }

  if (buffer.trim()) {
    const event = parseEventBlock(buffer)
    if (event) options.onEvent(event)
  }
}
