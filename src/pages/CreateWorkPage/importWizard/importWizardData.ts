// Figma "파일 일괄 가져오기(INTAKE-001)" 4단계 위저드 — 서버에 이 기능(CSV/Excel 일괄
// 등록) 자체가 없어서 전부 클라이언트 데모 데이터로 구성했다.

export const IMPORTED_FILE_NAME = '근로자_명단_2026.xlsx'

export const DETECTED_COLUMNS = ['이름', '국적', '체류만료일', '비고']

export interface SystemFieldOption {
  value: string
  label: string
}

export const SYSTEM_FIELDS: SystemFieldOption[] = [
  { value: 'workerName', label: '근로자명' },
  { value: 'nationality', label: '국적' },
  { value: 'stayExpiryDate', label: '체류만료일' },
  { value: 'note', label: '메모' },
]

// DETECTED_COLUMNS와 같은 순서 — 파일에 실제로 있을 법한 기본 추천 매핑.
export const SUGGESTED_MAPPING: Record<string, string> = {
  이름: 'workerName',
  국적: 'nationality',
  체류만료일: 'stayExpiryDate',
  비고: 'note',
}

export type ImportRowStatus = 'ok' | 'conflict' | 'failed' | 'missing-docs'

export interface ImportRow {
  id: string
  rowNumber: number
  workerName: string
  nationality: string
  importedStayExpiry: string
  existingStayExpiry: string | null
  note: string
  status: ImportRowStatus
  errorMessage: string | null
  missingDocuments: string[]
}

export const INITIAL_IMPORT_ROWS: ImportRow[] = [
  {
    id: 'row-1',
    rowNumber: 2,
    workerName: '응웬반A',
    nationality: '베트남',
    importedStayExpiry: '2026-09-15',
    existingStayExpiry: null,
    note: '',
    status: 'ok',
    errorMessage: null,
    missingDocuments: [],
  },
  {
    id: 'row-2',
    rowNumber: 3,
    workerName: '쩐티B',
    nationality: '베트남',
    importedStayExpiry: '2026-10-01',
    existingStayExpiry: '2026-08-20',
    note: '',
    status: 'conflict',
    errorMessage: null,
    missingDocuments: [],
  },
  {
    id: 'row-3',
    rowNumber: 4,
    workerName: '수라즈C',
    nationality: '네팔',
    importedStayExpiry: '2026-13-40',
    existingStayExpiry: null,
    note: '',
    status: 'failed',
    errorMessage: '체류만료일 형식이 올바르지 않습니다 (2026-13-40)',
    missingDocuments: [],
  },
  {
    id: 'row-4',
    rowNumber: 5,
    workerName: '아흐메드D',
    nationality: '방글라데시',
    importedStayExpiry: '2026-11-30',
    existingStayExpiry: null,
    note: '여권 사본 미보유',
    status: 'missing-docs',
    errorMessage: null,
    missingDocuments: ['여권 사본', '표준근로계약서'],
  },
  {
    id: 'row-5',
    rowNumber: 6,
    workerName: '솜차이E',
    nationality: '태국',
    importedStayExpiry: '2027-01-20',
    existingStayExpiry: null,
    note: '',
    status: 'ok',
    errorMessage: null,
    missingDocuments: [],
  },
]

export interface DocumentBundleEntry {
  id: string
  fileName: string
  workerName: string
  sizeLabel: string
}

export const DOCUMENT_BUNDLE: DocumentBundleEntry[] = [
  { id: 'bundle-1', fileName: '응웬반A_여권사본.pdf', workerName: '응웬반A', sizeLabel: '1.2MB' },
  { id: 'bundle-2', fileName: '쩐티B_표준근로계약서.pdf', workerName: '쩐티B', sizeLabel: '840KB' },
  { id: 'bundle-3', fileName: '솜차이E_여권사본.pdf', workerName: '솜차이E', sizeLabel: '980KB' },
]
