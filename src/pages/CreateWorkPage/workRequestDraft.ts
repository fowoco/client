import type { InputModeId } from './createWorkData'

export interface WorkRequestAttachmentMetadata {
  name: string
  size: number
  type: string
}

export interface WorkRequestDraft {
  request: string
  mode: InputModeId
  workerId: string
  attachments: WorkRequestAttachmentMetadata[]
}

const ACTIVE_DRAFT_KEY = 'fowoco:work-request-draft'
const RUN_DRAFT_PREFIX = 'fowoco:ai-run-draft:'

function readDraft(key: string): WorkRequestDraft | null {
  try {
    const raw = window.sessionStorage.getItem(key)
    return raw ? (JSON.parse(raw) as WorkRequestDraft) : null
  } catch {
    return null
  }
}

function writeDraft(key: string, draft: WorkRequestDraft) {
  try {
    window.sessionStorage.setItem(key, JSON.stringify(draft))
  } catch {
    // 저장 공간이 차단된 환경에서도 입력과 분석 흐름은 계속 사용할 수 있다.
  }
}

export function readActiveWorkRequestDraft() {
  return readDraft(ACTIVE_DRAFT_KEY)
}

export function saveActiveWorkRequestDraft(draft: WorkRequestDraft) {
  writeDraft(ACTIVE_DRAFT_KEY, draft)
}

export function readAiRunWorkRequestDraft(aiRunId: string) {
  return readDraft(`${RUN_DRAFT_PREFIX}${aiRunId}`)
}

export function saveAiRunWorkRequestDraft(aiRunId: string, draft: WorkRequestDraft) {
  writeDraft(`${RUN_DRAFT_PREFIX}${aiRunId}`, draft)
}
