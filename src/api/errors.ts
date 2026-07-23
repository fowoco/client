// fowoco/server ADR-0002(API·보안·오류 계약) 기준 공통 오류 바디.
export interface ApiFieldError {
  field: string
  message: string
}

export interface ApiErrorBody {
  timestamp: string
  status: number
  code: string
  message: string
  path: string
  request_id: string
  field_errors: ApiFieldError[]
}

export class ApiError extends Error {
  status: number
  code: string
  requestId: string
  fieldErrors: ApiFieldError[]

  constructor(body: ApiErrorBody) {
    super(body.message)
    this.name = 'ApiError'
    this.status = body.status
    this.code = body.code
    this.requestId = body.request_id
    this.fieldErrors = body.field_errors ?? []
  }
}

// ADR-0002 "7. 공통 오류 계약" 표에 있는 code만 우선 반영. 도메인별 code(TaskErrorCode 등)는
// 서버가 해당 API를 실제로 배포하면 여기에 추가한다.
const ERROR_MESSAGES: Record<string, string> = {
  VALIDATION_FAILED: '입력값을 다시 확인해 주세요.',
  AUTHENTICATION_REQUIRED: '로그인이 필요합니다.',
  INVALID_CREDENTIALS: '이메일 또는 비밀번호가 올바르지 않습니다.',
  INVALID_REFRESH_TOKEN: '로그인이 만료되었습니다. 다시 로그인해 주세요.',
  ACCESS_DENIED: '이 작업에 대한 권한이 없습니다.',
  RESOURCE_NOT_FOUND: '요청한 정보를 찾을 수 없습니다.',
  METHOD_NOT_ALLOWED: '지원하지 않는 요청입니다.',
  NOT_ACCEPTABLE: '지원하지 않는 응답 형식입니다.',
  CONCURRENT_MODIFICATION: '다른 곳에서 먼저 변경되었습니다. 새로고침 후 다시 시도해 주세요.',
  UNSUPPORTED_MEDIA_TYPE: '지원하지 않는 요청 형식입니다.',
  RATE_LIMIT_EXCEEDED: '요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.',
  INTERNAL_SERVER_ERROR: '일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
  SERVICE_TEMPORARILY_UNAVAILABLE: '서비스를 일시적으로 이용할 수 없습니다.',
  NETWORK_ERROR: '네트워크 상태를 확인한 뒤 다시 시도해 주세요.',
}

const DEFAULT_MESSAGE = '알 수 없는 오류가 발생했습니다.'

export function getErrorMessage(error: ApiError): string {
  return ERROR_MESSAGES[error.code] ?? error.message ?? DEFAULT_MESSAGE
}

export function networkApiError(path: string): ApiError {
  return new ApiError({
    timestamp: new Date().toISOString(),
    status: 0,
    code: 'NETWORK_ERROR',
    message: DEFAULT_MESSAGE,
    path,
    request_id: '',
    field_errors: [],
  })
}
