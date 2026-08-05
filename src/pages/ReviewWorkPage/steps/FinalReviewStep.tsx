import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../../components/ui/Button/Button'
import styles from '../ReviewWorkPage.module.css'
import {
  APPROVAL_SUMMARY,
  DOCUMENT_TABS,
  PDF_PREVIEW,
  STRUCTURED_FIELDS,
  TEMPLATE_METADATA,
  VALIDATION_SUMMARY,
  type PillTone,
} from '../reviewWorkData'

const SOURCE_PILL_CLASS: Record<PillTone, string> = {
  neutral: 'pillNeutral',
  brand: 'pillBrand',
  green: 'pillGreen',
  amber: 'pillAmber',
  red: 'pillRed',
}

const NOTE_CLASS: Record<PillTone, string> = {
  neutral: 'fieldReviewNoteNeutral',
  brand: 'fieldReviewNoteBrand',
  green: 'fieldReviewNoteGreen',
  amber: 'fieldReviewNoteNeutral',
  red: 'fieldReviewNoteNeutral',
}

export function FinalReviewStep() {
  const navigate = useNavigate()
  const [approved, setApproved] = useState(false)

  function handleApprove() {
    // TODO(backend): POST /api/work-items/approve -> 승인권자 최종 승인 처리
    setApproved(true)
  }

  if (approved) {
    return (
      <div>
        <div className={styles.headerRow}>
          <div>
            <h1 className={styles.headline}>
              <span className={styles.reviewIcon} aria-hidden="true">
                ✓
              </span>{' '}
              승인이 완료됐습니다.
            </h1>
            <p className={styles.description}>{APPROVAL_SUMMARY.approvedNote}</p>
          </div>
          <span className={`${styles.pill} ${styles.pillGreen}`}>승인 완료</span>
        </div>

        <div className={`${styles.railCard} ${styles.approvedCard}`}>
          <p className={styles.railCardTitle}>{TEMPLATE_METADATA.title}</p>
          <div className={styles.infoRow}>
            <span className={styles.infoRowLabel}>승인자</span>
            <span className={styles.infoRowValue}>{APPROVAL_SUMMARY.approver}</span>
          </div>
        </div>

        <div className={styles.actionDock}>
          <div>
            <p className={styles.dockTitle}>{APPROVAL_SUMMARY.approvedNote}</p>
          </div>
          <div className={styles.dockActions}>
            <Button onClick={() => navigate('/tasks')}>업무함으로 이동 →</Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className={styles.headerRow}>
        <div>
          <h1 className={styles.headline}>문서 검토본과 입력값을 최종 확인해 주세요</h1>
          <p className={styles.description}>PDF 검토본은 직접 편집하지 않습니다. 오른쪽 구조화 필드를 수정한 뒤 다시 생성합니다.</p>
        </div>
        <span className={styles.scenarioPill}>최종 검토</span>
      </div>

      <div className={styles.reviewWorkspace}>
        <div className={styles.panel}>
          <div className={styles.docTabs}>
            {DOCUMENT_TABS.map((tab, index) => (
              <span
                key={tab}
                className={`${styles.docTab} ${index === 0 ? styles.docTabActive : ''} ${
                  index === DOCUMENT_TABS.length - 1 ? styles.docTabDisabled : ''
                }`}
              >
                {tab}
              </span>
            ))}
          </div>

          <div className={styles.previewToolbar}>
            <span>PDF 검토본</span>
            <span>1 / 3</span>
            <span className={styles.previewFit}>맞춤 100%</span>
          </div>

          <div className={styles.previewCanvas}>
            <div className={styles.pdfPage}>
              <p className={styles.pdfPageTitle}>{PDF_PREVIEW.title}</p>
              <p className={styles.pdfPageSubtitle}>{PDF_PREVIEW.subtitle}</p>
              {PDF_PREVIEW.rows.map((row) => (
                <div
                  key={row.label}
                  className={`${styles.pdfRow} ${row.highlighted ? styles.pdfRowHighlighted : ''}`}
                >
                  <span className={styles.pdfRowLabel}>{row.label}</span>
                  <span className={styles.pdfRowValue}>{row.value}</span>
                </div>
              ))}
              <p className={styles.pdfPageFooter}>{PDF_PREVIEW.footer}</p>
            </div>
          </div>

          <p className={styles.footnote}>{PDF_PREVIEW.disclaimer}</p>
        </div>

        <div className={styles.railStack}>
          <div className={styles.railCardSubtle}>
            <div className={styles.railCardTitleRow}>
              <p className={styles.railCardTitle}>{TEMPLATE_METADATA.title}</p>
              <span className={`${styles.pill} ${styles.pillNeutral}`}>{TEMPLATE_METADATA.roleLabel}</span>
            </div>
            <p className={styles.railCardMeta}>{TEMPLATE_METADATA.meta}</p>
          </div>

          <div className={styles.fieldFilters}>
            <span className={`${styles.fieldFilter} ${styles.fieldFilterActive}`}>변경 필드만</span>
            <span className={styles.fieldFilter}>오류만</span>
            <span className={styles.fieldFilter}>전체 필드</span>
          </div>

          <div className={styles.fieldReviewList}>
            {STRUCTURED_FIELDS.map((field) => (
              <div key={field.label} className={styles.fieldReviewRow}>
                <div className={styles.fieldReviewTop}>
                  <div>
                    <p className={styles.fieldReviewLabel}>{field.label}</p>
                    <p className={styles.fieldReviewValue}>{field.value}</p>
                  </div>
                  <span className={`${styles.pill} ${styles[SOURCE_PILL_CLASS[field.sourceTone]]}`}>
                    {field.source}
                  </span>
                </div>
                <p className={`${styles.fieldReviewNote} ${styles[NOTE_CLASS[field.noteTone]]}`}>{field.note}</p>
              </div>
            ))}
          </div>

          <div className={styles.validationSummary}>
            <div className={styles.validationHeadRow}>
              <p className={styles.railCardTitle}>검증 결과</p>
              <span className={styles.railCardCount}>{VALIDATION_SUMMARY.summary}</span>
            </div>
            <p className={styles.validationNote}>{VALIDATION_SUMMARY.note}</p>
            <button type="button" className={styles.validationBackLink}>
              {VALIDATION_SUMMARY.backLinkLabel}
            </button>
          </div>
        </div>
      </div>

      <div className={styles.actionDock}>
        <div>
          <p className={styles.dockTitle}>{APPROVAL_SUMMARY.pendingTitle}</p>
          <p className={styles.dockSubtitle}>{APPROVAL_SUMMARY.pendingNote}</p>
        </div>
        <div className={styles.dockActions}>
          <Button variant="secondary">수정값으로 다시 생성</Button>
          <Button onClick={handleApprove}>승인 요청</Button>
        </div>
      </div>
    </div>
  )
}
