import { useEffect, useState } from 'react'
import {
  fetchCompanyMembers,
  fetchCompanySettings,
  patchCompanySettings,
  type CompanySettingsResponse,
  type EvidenceType,
  type SettingsTaskType,
} from '../../api/settings'
import { ApiError, getErrorMessage } from '../../api/errors'
import { useApiQuery } from '../../hooks/useApiQuery'
import { useAuthStore } from '../../store/authStore'
import { useToastStore } from '../../store/toastStore'
import { Button } from '../../components/ui/Button/Button'
import styles from './CompanySettingsPanel.module.css'

const fetchSettings = () => fetchCompanySettings()
const fetchMembers = () => fetchCompanyMembers()
const isMemberListEmpty = (result: Awaited<ReturnType<typeof fetchCompanyMembers>>) =>
  result.items.length === 0

const TASK_TYPES: { value: SettingsTaskType; label: string }[] = [
  { value: 'RECONTRACT', label: '재계약' },
  { value: 'EMPLOYMENT_PERIOD_EXTENSION', label: '고용기간 연장' },
  { value: 'STAY_PERIOD_EXTENSION', label: '체류기간 연장' },
  { value: 'DOCUMENT_REQUEST', label: '서류 요청' },
  { value: 'WORKER_ONBOARDING', label: '근로자 등록' },
  { value: 'PAYROLL_EXPLANATION', label: '급여 설명' },
  { value: 'EMPLOYMENT_CHANGE', label: '고용 변경' },
  { value: 'WORK_INSTRUCTION', label: '업무 안내' },
]

const EVIDENCE_TYPES: { value: EvidenceType; label: string }[] = [
  { value: 'DOCUMENT', label: '문서' },
  { value: 'RECEIPT', label: '접수증' },
  { value: 'OFFICIAL_RESULT', label: '기관 결과' },
  { value: 'HR_CONFIRMATION', label: 'HR 확인' },
]

function cloneSettings(settings: CompanySettingsResponse): CompanySettingsResponse {
  return {
    ...settings,
    evidence_rules: Object.fromEntries(
      Object.entries(settings.evidence_rules).map(([taskType, evidenceTypes]) => [
        taskType,
        [...evidenceTypes],
      ]),
    ),
  }
}

function validateSettings(settings: CompanySettingsResponse) {
  if (settings.link_expiry_hours < 1 || settings.link_expiry_hours > 168) {
    return '보안 링크 만료시간은 1~168시간으로 입력해 주세요.'
  }
  if (settings.file_retention_days < 30 || settings.file_retention_days > 3650) {
    return '파일 보유기간은 30~3650일로 입력해 주세요.'
  }
  if (settings.ai_log_retention_days < 7 || settings.ai_log_retention_days > 365) {
    return 'AI 로그 보유기간은 7~365일로 입력해 주세요.'
  }
  return null
}

export function CompanySettingsPanel() {
  const role = useAuthStore((state) => state.user?.role ?? 'VIEWER')
  const showToast = useToastStore((state) => state.showToast)
  const settingsQuery = useApiQuery(fetchSettings)
  const membersQuery = useApiQuery(fetchMembers, isMemberListEmpty)
  const [draft, setDraft] = useState<CompanySettingsResponse | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [conflictNotice, setConflictNotice] = useState<string | null>(null)
  const isAdmin = role === 'ADMIN'

  useEffect(() => {
    if (settingsQuery.data) setDraft(cloneSettings(settingsQuery.data))
  }, [settingsQuery.data])

  function updateNumber(
    key: 'link_expiry_hours' | 'file_retention_days' | 'ai_log_retention_days',
    value: string,
  ) {
    setDraft((previous) => (previous ? { ...previous, [key]: Number(value) } : previous))
  }

  function toggleEvidence(taskType: SettingsTaskType, evidenceType: EvidenceType) {
    setDraft((previous) => {
      if (!previous) return previous
      const current = previous.evidence_rules[taskType] ?? []
      const selected = current.includes(evidenceType)
        ? current.filter((item) => item !== evidenceType)
        : [...current, evidenceType]
      const evidenceRules = { ...previous.evidence_rules }
      if (selected.length > 0) evidenceRules[taskType] = selected
      else delete evidenceRules[taskType]
      return { ...previous, evidence_rules: evidenceRules }
    })
  }

  async function handleSave() {
    if (!isAdmin || !draft) return
    const validationError = validateSettings(draft)
    if (validationError) {
      setSaveError(validationError)
      return
    }

    setSaving(true)
    setSaveError(null)
    setConflictNotice(null)
    try {
      const updated = await patchCompanySettings({
        expected_version: draft.version,
        approval_policy: draft.approval_policy,
        link_expiry_hours: draft.link_expiry_hours,
        evidence_rules: draft.evidence_rules,
        file_retention_days: draft.file_retention_days,
        ai_log_retention_days: draft.ai_log_retention_days,
        audit_visibility: draft.audit_visibility,
      })
      setDraft(cloneSettings(updated))
      showToast('회사 설정을 저장했습니다.')
      settingsQuery.refetch()
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        setConflictNotice(
          '다른 관리자가 먼저 설정을 변경했습니다. 최신 설정을 다시 불러왔으니 확인 후 저장해 주세요.',
        )
        settingsQuery.refetch()
      } else {
        setSaveError(
          error instanceof ApiError
            ? getErrorMessage(error)
            : '회사 설정을 저장하지 못했습니다. 다시 시도해 주세요.',
        )
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className={styles.section} aria-labelledby="company-settings-title">
      <div className={styles.sectionHeader}>
        <div>
          <span className={styles.eyebrow}>사업장 운영</span>
          <h2 id="company-settings-title">회사 설정</h2>
          <p>승인 범위, 보안 링크, 증빙 및 데이터 보유 정책을 관리합니다.</p>
        </div>
        <span className={styles.permissionBadge}>{isAdmin ? 'ADMIN 수정 가능' : `${role} 조회 전용`}</span>
      </div>

      {settingsQuery.status === 'loading' && !draft ? (
        <p className={styles.stateMessage} role="status">회사 설정을 불러오는 중입니다.</p>
      ) : settingsQuery.status === 'error' && !draft ? (
        <div className={styles.errorState} role="alert">
          <p>{settingsQuery.error ? getErrorMessage(settingsQuery.error) : '회사 설정을 불러오지 못했습니다.'}</p>
          <Button variant="secondary" onClick={settingsQuery.refetch}>다시 시도</Button>
        </div>
      ) : draft ? (
        <>
          <fieldset className={styles.settingsFieldset} disabled={!isAdmin || saving}>
            <legend className={styles.srOnly}>회사 운영 정책</legend>
            <div className={styles.policyGrid}>
              <div className={styles.policyField}>
                <label htmlFor="approval-policy">업무 승인 권한</label>
                <select
                  id="approval-policy"
                  value={draft.approval_policy}
                  onChange={(event) => setDraft({ ...draft, approval_policy: event.target.value as CompanySettingsResponse['approval_policy'] })}
                >
                  <option value="ADMIN_ONLY">ADMIN만 승인</option>
                  <option value="ADMIN_OR_HR">ADMIN 또는 HR 승인</option>
                </select>
              </div>
              <div className={styles.policyField}>
                <label htmlFor="audit-visibility">감사 로그 조회</label>
                <select
                  id="audit-visibility"
                  value={draft.audit_visibility}
                  onChange={(event) => setDraft({ ...draft, audit_visibility: event.target.value as CompanySettingsResponse['audit_visibility'] })}
                >
                  <option value="ADMIN_ONLY">ADMIN만 조회</option>
                  <option value="ADMIN_AND_HR">ADMIN과 HR 조회</option>
                </select>
              </div>
              <div className={styles.policyField}>
                <label htmlFor="link-expiry-hours">보안 링크 만료시간</label>
                <span className={styles.numberField}>
                  <input
                    id="link-expiry-hours"
                    type="number"
                    min="1"
                    max="168"
                    value={draft.link_expiry_hours}
                    onChange={(event) => updateNumber('link_expiry_hours', event.target.value)}
                  />
                  <em>시간</em>
                </span>
              </div>
              <div className={styles.policyField}>
                <label htmlFor="file-retention-days">파일 보유기간</label>
                <span className={styles.numberField}>
                  <input
                    id="file-retention-days"
                    type="number"
                    min="30"
                    max="3650"
                    value={draft.file_retention_days}
                    onChange={(event) => updateNumber('file_retention_days', event.target.value)}
                  />
                  <em>일</em>
                </span>
              </div>
              <div className={styles.policyField}>
                <label htmlFor="ai-log-retention-days">AI 실행 로그 보유기간</label>
                <span className={styles.numberField}>
                  <input
                    id="ai-log-retention-days"
                    type="number"
                    min="7"
                    max="365"
                    value={draft.ai_log_retention_days}
                    onChange={(event) => updateNumber('ai_log_retention_days', event.target.value)}
                  />
                  <em>일</em>
                </span>
              </div>
            </div>

            <div className={styles.evidenceHeader}>
              <strong>업무별 추가 필수 근거</strong>
              <span>기본 필수 근거에 회사 정책을 추가합니다.</span>
            </div>
            <div className={styles.evidenceTable}>
              {TASK_TYPES.map((taskType) => (
                <div className={styles.evidenceRow} key={taskType.value}>
                  <strong>{taskType.label}</strong>
                  <div>
                    {EVIDENCE_TYPES.map((evidenceType) => (
                      <label key={evidenceType.value}>
                        <input
                          type="checkbox"
                          aria-label={`${taskType.label} ${evidenceType.label}`}
                          checked={(draft.evidence_rules[taskType.value] ?? []).includes(evidenceType.value)}
                          onChange={() => toggleEvidence(taskType.value, evidenceType.value)}
                        />
                        <span>{evidenceType.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </fieldset>

          <div className={styles.settingsFooter}>
            <span>설정 버전 {draft.version}</span>
            {isAdmin && <Button isLoading={saving} onClick={handleSave}>회사 설정 저장</Button>}
          </div>
          {saveError && <p className={styles.saveError} role="alert">{saveError}</p>}
          {conflictNotice && <p className={styles.conflictNotice} role="status">{conflictNotice}</p>}
        </>
      ) : null}

      <div className={styles.memberSection}>
        <div className={styles.memberHeader}>
          <div>
            <h3>사업장 구성원</h3>
            <p>현재 업무를 함께 처리하는 활성 구성원입니다.</p>
          </div>
          {membersQuery.data && <span>{membersQuery.data.items.length}명</span>}
        </div>
        {membersQuery.status === 'loading' ? (
          <p className={styles.stateMessage} role="status">구성원을 불러오는 중입니다.</p>
        ) : membersQuery.status === 'error' ? (
          <div className={styles.errorState} role="alert">
            <p>{membersQuery.error ? getErrorMessage(membersQuery.error) : '구성원을 불러오지 못했습니다.'}</p>
            <Button variant="secondary" onClick={membersQuery.refetch}>다시 시도</Button>
          </div>
        ) : membersQuery.status === 'empty' ? (
          <p className={styles.stateMessage}>표시할 활성 구성원이 없습니다.</p>
        ) : (
          <ul className={styles.memberList}>
            {membersQuery.data?.items.map((member) => (
              <li key={member.user_id}>
                <span className={styles.memberAvatar} aria-hidden="true">{member.display_name.slice(0, 1)}</span>
                <span className={styles.memberIdentity}>
                  <strong>{member.display_name}</strong>
                  <small>{member.roles?.join(' · ') ?? '구성원'}</small>
                </span>
                {member.active !== undefined && (
                  <span className={`${styles.memberStatus} ${member.active ? styles.memberStatusActive : ''}`}>
                    {member.active ? '사용 중' : '중지'}
                  </span>
                )}
                {member.approval_permission && <span className={styles.approvalBadge}>승인 가능</span>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
