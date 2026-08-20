import { describe, expect, it } from 'vitest'
import { ApiError, getErrorMessage, networkApiError } from './errors'

function makeBody(overrides: Partial<ConstructorParameters<typeof ApiError>[0]> = {}) {
  return {
    timestamp: '2026-07-22T01:23:45Z',
    status: 404,
    code: 'RESOURCE_NOT_FOUND',
    message: 'raw message',
    path: '/api/v1/workers/1',
    request_id: 'req-1',
    field_errors: [],
    ...overrides,
  }
}

describe('ApiError', () => {
  it('exposes status/code/requestId/fieldErrors from the response body', () => {
    const error = new ApiError(
      makeBody({ field_errors: [{ field: 'email', message: '형식이 올바르지 않습니다.' }] }),
    )

    expect(error.status).toBe(404)
    expect(error.code).toBe('RESOURCE_NOT_FOUND')
    expect(error.requestId).toBe('req-1')
    expect(error.fieldErrors).toEqual([{ field: 'email', message: '형식이 올바르지 않습니다.' }])
    expect(error.message).toBe('raw message')
  })
})

describe('getErrorMessage', () => {
  it('returns the mapped Korean message for known codes', () => {
    const error = new ApiError(makeBody({ code: 'INVALID_CREDENTIALS' }))
    expect(getErrorMessage(error)).toBe('이메일 또는 비밀번호가 올바르지 않습니다.')
  })

  it('falls back to the raw message for unknown codes', () => {
    const error = new ApiError(makeBody({ code: 'SOMETHING_NEW', message: '서버가 준 원문' }))
    expect(getErrorMessage(error)).toBe('서버가 준 원문')
  })

  it('hides the raw HTTP status text for UNKNOWN_ERROR behind a Korean message', () => {
    const error = new ApiError(makeBody({ code: 'UNKNOWN_ERROR', message: 'Not Found' }))
    expect(getErrorMessage(error)).toBe('요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.')
  })

  it('maps EMAIL_ALREADY_REGISTERED to a Korean message', () => {
    const error = new ApiError(makeBody({ code: 'EMAIL_ALREADY_REGISTERED', message: 'raw' }))
    expect(getErrorMessage(error)).toBe('이미 가입된 이메일입니다.')
  })

  it.each([
    [
      'RENEWAL_EXECUTION_NOT_ALLOWED',
      '현재 업무 단계에서는 Agent를 다시 실행할 수 없습니다. 화면에 안내된 다음 행동을 진행해 주세요.',
    ],
    [
      'RENEWAL_REQUEST_CONTRACT_INVALID',
      '업무 정보가 Agent 요청 계약과 맞지 않습니다. 새로고침한 뒤 입력 내용을 확인해 주세요.',
    ],
    [
      'RENEWAL_WORKFLOW_MISMATCH',
      '업무 유형과 Agent Workflow가 일치하지 않습니다. 업무 설정을 확인해 주세요.',
    ],
  ])('maps %s to an actionable Korean message', (code, message) => {
    const error = new ApiError(makeBody({ code, message: 'raw' }))
    expect(getErrorMessage(error)).toBe(message)
  })
})

describe('networkApiError', () => {
  it('builds a NETWORK_ERROR ApiError with the given path', () => {
    const error = networkApiError('/api/v1/workers')
    expect(error.code).toBe('NETWORK_ERROR')
    expect(error.status).toBe(0)
  })
})
