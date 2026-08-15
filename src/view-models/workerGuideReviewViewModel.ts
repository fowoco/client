export interface WorkerGuideReviewState {
  required: boolean
  failureCode: string | null
}

export interface WorkerGuideReviewPresentation {
  title: string
  description: string
}

const FAILURE_DESCRIPTIONS: Record<string, string> = {
  LANGUAGE_ASSISTANT_NOT_CONFIGURED: '다국어 안내 생성 기능이 설정되지 않았습니다.',
  LANGUAGE_ASSISTANT_INVOCATION_FAILED: '다국어 안내 생성 중 오류가 발생했습니다.',
  LANGUAGE_ASSISTANT_REVIEW_REQUIRED: '생성된 안내문을 안전하게 사용하려면 HR 검토가 필요합니다.',
  WORKER_GUIDE_UNAVAILABLE: '안전하게 사용할 수 있는 근로자 안내문을 만들지 못했습니다.',
}

export function getWorkerGuideReviewState(
  businessData: Record<string, unknown>,
): WorkerGuideReviewState {
  const execution = businessData.renewal_execution
  if (!execution || typeof execution !== 'object' || Array.isArray(execution)) {
    return { required: false, failureCode: null }
  }

  const metadata = execution as Record<string, unknown>
  return {
    required: metadata.guide_review_required === true,
    failureCode:
      typeof metadata.guide_failure_code === 'string' ? metadata.guide_failure_code : null,
  }
}

export function getWorkerGuideReviewPresentation(
  failureCode: string | null,
): WorkerGuideReviewPresentation {
  return {
    title: '근로자 안내문을 직접 검토해 주세요',
    description:
      (failureCode && FAILURE_DESCRIPTIONS[failureCode]) ??
      '자동 생성된 안내문을 안전하게 사용할 수 없어 HR 검토가 필요합니다.',
  }
}
