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
    const error = new ApiError(makeBody({ field_errors: [{ field: 'email', message: '형식이 올바르지 않습니다.' }] }))

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
})

describe('networkApiError', () => {
  it('builds a NETWORK_ERROR ApiError with the given path', () => {
    const error = networkApiError('/api/v1/workers')
    expect(error.code).toBe('NETWORK_ERROR')
    expect(error.status).toBe(0)
  })
})
