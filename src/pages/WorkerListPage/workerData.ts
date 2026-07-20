export type InspectionStatus = '양호' | '점검 필요'
export type DocumentStatus = '제출' | '미제출'

export interface WorkerSummary {
  id: string
  name: string
  nationality: string
  line: string
  visaExpiry: string
  documentStatus: DocumentStatus
  inspectionStatus: InspectionStatus
}

export const WORKERS: WorkerSummary[] = [
  {
    id: 'W-001',
    name: '응우옌 반 안',
    nationality: '베트남',
    line: '조립 1라인',
    visaExpiry: 'E-9 · D-90',
    documentStatus: '제출',
    inspectionStatus: '양호',
  },
  {
    id: 'W-002',
    name: '수산토',
    nationality: '인도네시아',
    line: '포장 2라인',
    visaExpiry: 'E-9 · D-30',
    documentStatus: '미제출',
    inspectionStatus: '점검 필요',
  },
  {
    id: 'W-003',
    name: '소카',
    nationality: '캄보디아',
    line: '조립 1라인',
    visaExpiry: 'E-9 · D-45',
    documentStatus: '미제출',
    inspectionStatus: '점검 필요',
  },
  {
    id: 'W-004',
    name: '수벡',
    nationality: '네팔',
    line: '검수 3라인',
    visaExpiry: 'E-9 · D-60',
    documentStatus: '미제출',
    inspectionStatus: '점검 필요',
  },
]
