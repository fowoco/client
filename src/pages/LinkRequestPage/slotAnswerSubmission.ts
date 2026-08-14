import type { WorkerAnswerAction, WorkerResponseSubmitResponse } from '../../api/workerLinks'

interface SlotAnswerSubmissionDraft {
  actionSignature: string
  answers: Record<string, string>
  idempotencyKey: string
  submission: WorkerResponseSubmitResponse | null
}

const STORAGE_PREFIX = 'fowoco:worker-slot-answer:'

function tokenHash(token: string) {
  let hash = 2166136261
  for (let index = 0; index < token.length; index += 1) {
    hash ^= token.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0).toString(36)
}

function storageKey(token: string) {
  return `${STORAGE_PREFIX}${tokenHash(token)}`
}

export function getSlotAnswerActionSignature(actions: WorkerAnswerAction[]) {
  return actions
    .map((action) => `${action.field_key}:${action.input_type}:${action.required ? '1' : '0'}`)
    .join('|')
}

export function readSlotAnswerSubmission(
  token: string,
  actionSignature: string,
): SlotAnswerSubmissionDraft | null {
  try {
    const raw = window.sessionStorage.getItem(storageKey(token))
    if (!raw) return null
    const stored = JSON.parse(raw) as SlotAnswerSubmissionDraft
    const validSubmission =
      stored.submission === null ||
      (typeof stored.submission?.response_id === 'string' &&
        typeof stored.submission?.received_at === 'string')
    const signatureChanged = stored.actionSignature !== actionSignature
    const completedSubmissionWithoutPendingAction =
      actionSignature === '' && stored.submission !== null
    if (
      (signatureChanged && !completedSubmissionWithoutPendingAction) ||
      !stored.answers ||
      typeof stored.answers !== 'object' ||
      typeof stored.idempotencyKey !== 'string' ||
      !validSubmission
    ) {
      window.sessionStorage.removeItem(storageKey(token))
      return null
    }
    return stored
  } catch {
    return null
  }
}

export function saveSlotAnswerSubmission(
  token: string,
  actionSignature: string,
  answers: Record<string, string>,
  idempotencyKey: string,
  submission: WorkerResponseSubmitResponse | null,
) {
  try {
    window.sessionStorage.setItem(
      storageKey(token),
      JSON.stringify({ actionSignature, answers, idempotencyKey, submission }),
    )
  } catch {
    // 저장 공간을 사용할 수 없어도 현재 화면의 제출 흐름은 계속 진행한다.
  }
}

export function clearSlotAnswerSubmission(token: string) {
  try {
    window.sessionStorage.removeItem(storageKey(token))
  } catch {
    // 저장 공간이 차단된 환경에서는 제거할 상태도 없다.
  }
}
