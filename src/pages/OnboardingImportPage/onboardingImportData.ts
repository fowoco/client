import type {
  WorkerImportField,
  WorkerImportRowResponse,
  WorkerImportStatus,
} from '../../api/workerImports'

export type StartMode = 'migrate' | 'manual' | 'later'

export interface StartOption {
  id: StartMode
  title: string
  description: string
}

export const START_OPTIONS: StartOption[] = [
  {
    id: 'migrate',
    title: '기존 데이터 이전',
    description: 'CSV·XLSX 파일로 근로자 명단을 한 번에 가져옵니다.',
  },
  {
    id: 'manual',
    title: '직접 입력',
    description: '근로자를 하나씩 직접 등록합니다.',
  },
  {
    id: 'later',
    title: '나중에 설정',
    description: '지금은 건너뛰고 바로 대시보드로 이동합니다.',
  },
]

export const SUPPORTED_FORMATS = ['XLSX', 'CSV']

export const WORKER_IMPORT_FIELDS: { value: WorkerImportField; label: string }[] = [
  { value: 'display_name', label: '이름' },
  { value: 'nationality_code', label: '국적 코드' },
  { value: 'preferred_language', label: '선호 언어' },
  { value: 'visa_type', label: '체류 자격' },
  { value: 'stay_expiry_date', label: '체류 만료일' },
  { value: 'contract_start_date', label: '계약 시작일' },
  { value: 'contract_end_date', label: '계약 종료일' },
  { value: 'employment_permit_end_date', label: '고용허가 종료일' },
  { value: 'employment_activity_end_date', label: '취업활동기간 종료일' },
]

export const IMPORT_STATUS_LABEL: Record<WorkerImportStatus, string> = {
  UPLOADED: '파일 확인 완료',
  MAPPED: '열 연결 완료',
  REVIEW_REQUIRED: '수정 필요',
  READY: '등록 준비 완료',
  COMMITTED: '등록 완료',
}

const HEADER_ALIASES: Record<WorkerImportField, string[]> = {
  display_name: ['이름', '성명', '근로자명', 'name', 'displayname'],
  nationality_code: ['국적', '국적코드', 'nationality', 'nationalitycode'],
  preferred_language: ['언어', '선호언어', 'preferredlanguage', 'language'],
  visa_type: ['비자', '체류자격', '사증', 'visatype', 'visa'],
  stay_expiry_date: ['체류만료일', '체류기간만료일', 'stayexpirydate'],
  contract_start_date: ['계약시작일', '근로계약시작일', 'contractstartdate'],
  contract_end_date: ['계약종료일', '근로계약종료일', 'contractenddate'],
  employment_permit_end_date: ['고용허가종료일', 'employmentpermitenddate'],
  employment_activity_end_date: ['취업활동기간종료일', 'employmentactivityenddate'],
}

function normalizeHeader(header: string) {
  return header.toLowerCase().replace(/[\s_()\-./]/g, '')
}

export function buildSuggestedMappings(headers: string[]): Record<string, WorkerImportField> {
  const result: Record<string, WorkerImportField> = {}
  const used = new Set<WorkerImportField>()

  for (const header of headers) {
    const normalized = normalizeHeader(header)
    const match = WORKER_IMPORT_FIELDS.find(
      ({ value }) =>
        !used.has(value) &&
        HEADER_ALIASES[value].some((alias) => normalizeHeader(alias) === normalized),
    )
    if (match) {
      result[header] = match.value
      used.add(match.value)
    }
  }

  return result
}

export function getWorkerImportFieldLabel(field: string) {
  return WORKER_IMPORT_FIELDS.find((item) => item.value === field)?.label ?? field
}

export function getEffectiveRowValue(
  row: WorkerImportRowResponse,
  mappings: Record<string, WorkerImportField>,
  field: string,
) {
  const sourceHeader = Object.entries(mappings).find(([, target]) => target === field)?.[0]
  return (
    row.override_values[field] ??
    row.normalized_values[field] ??
    (sourceHeader ? row.source_values[sourceHeader] : '') ??
    ''
  )
}
