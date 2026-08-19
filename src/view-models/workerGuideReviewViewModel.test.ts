import { describe, expect, it } from 'vitest'
import {
  buildWorkerGuideReviewMessage,
  getWorkerGuideReviewState,
} from './workerGuideReviewViewModel'

describe('workerGuideReviewViewModel', () => {
  it('parses and presents the bilingual AI review draft', () => {
    const state = getWorkerGuideReviewState({
      renewal_execution: {
        guide_review_required: true,
        guide_failure_code: 'LANGUAGE_ASSISTANT_REVIEW_REQUIRED',
        guide_review_draft: {
          target_language: 'mn',
          standard_korean_text: '서류를 준비해 주세요.',
          easy_korean_text: '여권 사본을 준비해 주세요.',
          translated_text: 'Паспортын хуулбараа бэлдэнэ үү.',
          warning_codes: ['RETRIEVAL_UNAVAILABLE'],
        },
      },
    })

    expect(state).toMatchObject({
      required: true,
      failureCode: 'LANGUAGE_ASSISTANT_REVIEW_REQUIRED',
      draft: {
        targetLanguage: 'mn',
        warningCodes: ['RETRIEVAL_UNAVAILABLE'],
      },
    })
    expect(buildWorkerGuideReviewMessage(state.draft)).toBe(
      '[쉬운 한국어]\n여권 사본을 준비해 주세요.\n\n[대상 언어 안내]\nПаспортын хуулбараа бэлдэнэ үү.',
    )
  })

  it('does not duplicate identical Korean and translated text', () => {
    const state = getWorkerGuideReviewState({
      renewal_execution: {
        guide_review_required: true,
        guide_review_draft: {
          target_language: 'ko',
          easy_korean_text: '여권 사본을 준비해 주세요.',
          translated_text: '여권 사본을 준비해 주세요.',
        },
      },
    })

    expect(buildWorkerGuideReviewMessage(state.draft)).toBe('여권 사본을 준비해 주세요.')
  })
})
