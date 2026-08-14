import { useNavigate, useBlocker } from 'react-router-dom'
import { useCallback, useEffect, useState } from 'react'
import { fetchMyProfile, updateMyProfile, type ProfileResponse } from '../../api/profile'
import { ApiError, getErrorMessage } from '../../api/errors'
import { Button } from '../../components/ui/Button/Button'
import { DetailRow } from '../../components/ui/DetailRow/DetailRow'
import { Modal } from '../../components/ui/Modal/Modal'
import { StatusLabel } from '../../components/ui/StatusLabel/StatusLabel'
import { useApiQuery } from '../../hooks/useApiQuery'
import { useAuthStore } from '../../store/authStore'
import { useToastStore } from '../../store/toastStore'
import { CompanySettingsPanel } from './CompanySettingsPanel'
import {
  INITIAL_NOTIFICATION_PREFS,
  PROFILE_SUMMARY,
  SECURITY_INFO,
  WORK_CONTEXT,
} from './profileData'
import styles from './ProfilePage.module.css'

interface EditableFields {
  displayName: string
  phone: string
}

type FieldErrors = Partial<Record<keyof EditableFields, string>>

// Figma Screen Brief 04번 항목 기준 검증 규칙.
function validateFields(input: EditableFields): FieldErrors {
  const errors: FieldErrors = {}
  const trimmedName = input.displayName.trim()
  if (!trimmedName) {
    errors.displayName = '표시 이름을 입력해 주세요.'
  } else if (/^\d+$/.test(trimmedName)) {
    errors.displayName = '이름에 숫자만 입력할 수 없습니다.'
  } else if (trimmedName.length > 80) {
    errors.displayName = '표시 이름은 80자 이하로 입력해 주세요.'
  }

  const trimmedPhone = input.phone.trim()
  if (trimmedPhone && !/^[\d\-+() ]+$/.test(trimmedPhone)) {
    errors.phone = '연락처 형식을 확인해 주세요.'
  }

  return errors
}

function toFields(profile: ProfileResponse): EditableFields {
  return { displayName: profile.display_name, phone: profile.phone ?? '' }
}

export function ProfilePage() {
  const navigate = useNavigate()
  const showToast = useToastStore((state) => state.showToast)
  const user = useAuthStore((state) => state.user)
  const setStoreProfile = useAuthStore((state) => state.updateProfile)

  const { data: profile, status: profileStatus } = useApiQuery(fetchMyProfile)

  const [fields, setFields] = useState<EditableFields | null>(null)
  const [draft, setDraft] = useState<EditableFields | null>(null)
  const [editing, setEditing] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [notificationPrefs, setNotificationPrefs] = useState(INITIAL_NOTIFICATION_PREFS)

  useEffect(() => {
    if (profile) setFields(toFields(profile))
  }, [profile])

  const changedFieldCount =
    editing && fields && draft
      ? (['displayName', 'phone'] as const).filter((key) => draft[key] !== fields[key]).length
      : 0
  const isDirty = editing && changedFieldCount > 0

  // Figma "저장하지 않은 변경사항이 있습니다" 오버레이(node 1623:2530) — 편집 중 다른 화면으로
  // 이동하려 하면 확인을 받는다.
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isDirty && currentLocation.pathname !== nextLocation.pathname,
  )

  function handleStartEdit() {
    if (!fields) return
    setDraft(fields)
    setFieldErrors({})
    setSaveError(null)
    setEditing(true)
  }

  function handleCancelEdit() {
    setEditing(false)
    setFieldErrors({})
    setSaveError(null)
  }

  const trySave = useCallback(async (): Promise<boolean> => {
    if (!draft) return false
    const errors = validateFields(draft)
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return false

    setSaving(true)
    setSaveError(null)
    try {
      const updated = await updateMyProfile({
        display_name: draft.displayName.trim(),
        phone: draft.phone.trim() || null,
      })
      setFields(toFields(updated))
      setStoreProfile(updated.display_name, updated.phone)
      setEditing(false)
      showToast('프로필을 저장했습니다.')
      return true
    } catch (error) {
      setSaveError(
        error instanceof ApiError ? getErrorMessage(error) : '프로필 저장에 실패했습니다.',
      )
      return false
    } finally {
      setSaving(false)
    }
  }, [draft, setStoreProfile, showToast])

  function handleRequestEmailChange() {
    showToast('이메일 변경 요청을 관리자에게 전달했습니다.')
  }

  function handleToggleNotification(id: string) {
    setNotificationPrefs((prev) =>
      prev.map((pref) =>
        pref.id === id && !pref.required ? { ...pref, enabled: !pref.enabled } : pref,
      ),
    )
  }

  function handleBlockerContinueEditing() {
    blocker.reset?.()
  }

  function handleBlockerLeaveWithoutSaving() {
    setEditing(false)
    setFieldErrors({})
    blocker.proceed?.()
  }

  async function handleBlockerSaveAndLeave() {
    if (await trySave()) blocker.proceed?.()
  }

  const displayName = user?.name ?? fields?.displayName ?? PROFILE_SUMMARY.role

  return (
    <div>
      <div className={styles.headerRow}>
        <div>
          <h1 className={styles.headline}>설정</h1>
          <p className={styles.description}>계정 정보와 사업장 운영 설정을 관리합니다.</p>
        </div>
        {editing ? (
          <div className={styles.editActions}>
            <Button variant="secondary" onClick={handleCancelEdit}>
              취소
            </Button>
            <Button onClick={() => void trySave()} isLoading={saving}>
              저장
            </Button>
          </div>
        ) : (
          <Button onClick={handleStartEdit} disabled={profileStatus !== 'success'}>
            프로필 수정
          </Button>
        )}
      </div>

      <div className={styles.summaryCard}>
        <div className={styles.avatar} aria-hidden="true">
          {displayName.charAt(0)}
        </div>
        <div className={styles.summaryIdentity}>
          <p className={styles.summaryName}>{displayName}</p>
          <p className={styles.summaryMeta}>
            {user?.role ?? PROFILE_SUMMARY.role} · {user?.email ?? PROFILE_SUMMARY.email}
          </p>
          <div className={styles.summaryStatusRow}>
            <StatusLabel tone="success">사용 중</StatusLabel>
            <span className={styles.summaryCompany}>
              {user?.workplace ?? PROFILE_SUMMARY.companyName}
            </span>
          </div>
        </div>
        <div className={styles.summaryLastLogin}>
          <p className={styles.summaryLastLoginLabel}>마지막 로그인</p>
          <p className={styles.summaryLastLoginValue}>{PROFILE_SUMMARY.lastLoginAt}</p>
          <p className={styles.summaryLastLoginDevice}>{PROFILE_SUMMARY.lastLoginDevice}</p>
        </div>
      </div>

      <CompanySettingsPanel />

      <div className={styles.gridRow}>
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>기본 정보</h2>
          <p className={styles.cardDescription}>
            개인 정보는 직접 수정할 수 있고, 계정 정보는 관리자 정책을 따릅니다.
          </p>
          <hr className={styles.divider} />

          {saveError && <p className={styles.fieldError}>{saveError}</p>}

          <div className={styles.fieldGrid}>
            {profileStatus === 'loading' && !fields && (
              <p className={styles.cardDescription}>불러오는 중…</p>
            )}
            {profileStatus === 'error' && !fields && (
              <p className={styles.fieldError}>프로필을 불러오지 못했습니다.</p>
            )}
            {fields && (
              <>
                <div className={styles.field}>
                  <div className={styles.fieldMeta}>
                    <span className={styles.fieldLabel}>표시 이름</span>
                    <span className={styles.fieldBadge}>수정 가능</span>
                  </div>
                  {editing && draft ? (
                    <>
                      <input
                        className={styles.fieldInput}
                        value={draft.displayName}
                        aria-label="표시 이름"
                        onChange={(event) =>
                          setDraft((prev) =>
                            prev ? { ...prev, displayName: event.target.value } : prev,
                          )
                        }
                      />
                      {fieldErrors.displayName && (
                        <p className={styles.fieldError}>{fieldErrors.displayName}</p>
                      )}
                    </>
                  ) : (
                    <p className={styles.fieldValue}>{fields.displayName}</p>
                  )}
                </div>

                <div className={styles.field}>
                  <div className={styles.fieldMeta}>
                    <span className={styles.fieldLabel}>연락처</span>
                    <span className={styles.fieldBadge}>수정 가능</span>
                  </div>
                  {editing && draft ? (
                    <>
                      <input
                        className={styles.fieldInput}
                        value={draft.phone}
                        aria-label="연락처"
                        placeholder="010-1234-5678"
                        onChange={(event) =>
                          setDraft((prev) => (prev ? { ...prev, phone: event.target.value } : prev))
                        }
                      />
                      {fieldErrors.phone && (
                        <p className={styles.fieldError}>{fieldErrors.phone}</p>
                      )}
                    </>
                  ) : (
                    <p className={styles.fieldValue}>{fields.phone || '미등록'}</p>
                  )}
                </div>
              </>
            )}

            <div className={styles.field}>
              <div className={styles.fieldMeta}>
                <span className={styles.fieldLabel}>로그인 이메일</span>
                <span className={styles.fieldBadgeMuted}>본인 확인 필요</span>
              </div>
              <p className={styles.fieldValue}>{user?.email ?? PROFILE_SUMMARY.email}</p>
              <button
                type="button"
                className={styles.fieldLinkButton}
                onClick={handleRequestEmailChange}
              >
                이메일 변경 요청 →
              </button>
            </div>
          </div>
        </div>

        <div className={styles.cardNarrow}>
          <h2 className={styles.cardTitle}>업무 Context와 권한</h2>
          <p className={styles.cardDescription}>{WORK_CONTEXT.companySummary}</p>
          <hr className={styles.divider} />

          <DetailRow
            label="승인 가능 여부"
            value={
              <StatusLabel tone={WORK_CONTEXT.canApprove ? 'success' : 'warning'}>
                {WORK_CONTEXT.canApprove ? '업무 승인 가능' : '승인 불가'}
              </StatusLabel>
            }
          />
          <DetailRow label="담당 업무 영역" value={WORK_CONTEXT.assignedArea} />
          <DetailRow
            label="자료 등록 실행"
            value={
              <StatusLabel tone={WORK_CONTEXT.canRegisterData ? 'success' : 'warning'}>
                {WORK_CONTEXT.canRegisterData ? '권한 있음' : '권한 없음'}
              </StatusLabel>
            }
          />
          <DetailRow label="문서 열람 범위" value={WORK_CONTEXT.documentScope} />
        </div>
      </div>

      <div className={styles.gridRow}>
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>개인 알림 설정</h2>
          <p className={styles.cardDescription}>
            개인 알림을 선택합니다. 필수: 보안·권한 변경 알림은 항상 켜져 있습니다.
          </p>
          <hr className={styles.divider} />

          <div className={styles.notificationGrid}>
            {notificationPrefs.map((pref) => (
              <div key={pref.id} className={styles.notificationRow}>
                <div className={styles.notificationCopy}>
                  <p className={styles.notificationLabel}>
                    {pref.label}
                    {pref.required && <span className={styles.fieldBadgeMuted}>필수</span>}
                  </p>
                  <p className={styles.notificationDescription}>{pref.description}</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={pref.enabled}
                  aria-label={pref.label}
                  disabled={pref.required}
                  className={`${styles.switch} ${pref.enabled ? styles.switchOn : ''}`}
                  onClick={() => handleToggleNotification(pref.id)}
                >
                  <span className={styles.switchThumb} />
                  <span className={styles.switchLabel}>{pref.enabled ? '켜짐' : '꺼짐'}</span>
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.cardNarrow}>
          <h2 className={styles.cardTitle}>보안</h2>
          <p className={styles.cardDescription}>계정 보호 상태와 최근 로그인 정보를 확인합니다.</p>
          <hr className={styles.divider} />

          <DetailRow
            label="계정 보호 상태"
            value={<StatusLabel tone="success">{SECURITY_INFO.accountStatus}</StatusLabel>}
          />
          <DetailRow label="비밀번호 변경" value={SECURITY_INFO.passwordChangedAt} />
          <DetailRow label="로그인 기기" value={SECURITY_INFO.loginDeviceSummary} />

          <div className={styles.securityActions}>
            <Button variant="secondary" onClick={() => navigate('/reset-password')}>
              비밀번호 변경
            </Button>
            <button
              type="button"
              className={styles.cardLinkButton}
              onClick={() => showToast('로그인 기록 보기는 준비 중입니다.')}
            >
              로그인 기록 보기
            </button>
          </div>
        </div>
      </div>

      <Modal
        open={blocker.state === 'blocked'}
        onClose={handleBlockerContinueEditing}
        title="저장하지 않은 변경사항이 있습니다."
      >
        <p className={styles.blockerBody}>
          지금 나가면 표시 이름·연락처의 변경 내용이 저장되지 않습니다.
        </p>
        <p className={styles.blockerNote}>
          변경사항 {changedFieldCount}개 · 입력값은 현재 편집 화면에 유지됩니다.
        </p>
        <div className={styles.blockerActions}>
          <button
            type="button"
            className={styles.cardLinkButton}
            onClick={handleBlockerContinueEditing}
          >
            계속 수정
          </button>
          <div className={styles.editActions}>
            <Button variant="secondary" onClick={handleBlockerLeaveWithoutSaving}>
              저장하지 않고 나가기
            </Button>
            <Button onClick={() => void handleBlockerSaveAndLeave()}>변경사항 저장</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
