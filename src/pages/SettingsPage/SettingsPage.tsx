import { useState } from 'react'
import { DetailRow } from '../../components/ui/DetailRow/DetailRow'
import { Tabs } from '../../components/ui/Tabs/Tabs'
import { useToastStore } from '../../store/toastStore'
import { LinkReissueModal, type ReissueSubmission } from './overlays/LinkReissueModal'
import { LinkReissuedModal } from './overlays/LinkReissuedModal'
import styles from './SettingsPage.module.css'
import {
  APPROVAL_POLICY,
  COMPLETION_EVIDENCE_RULES,
  DATA_LOG_SETTINGS,
  FOOTNOTE,
  MEMBERS,
  POLICY_SUMMARY,
  PROCESS_STEP_RULES,
  SECURITY_LINK_HISTORY,
  SECURITY_LINK_POLICY,
  SETTINGS_TABS,
  type Member,
  type SecurityLinkHistoryEntry,
} from './settingsData'

const SETTINGS_TAB_ITEMS = SETTINGS_TABS.map((label) => ({ id: label, label }))

type LinkOverlay = 'none' | 'reissue' | 'reissued'

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState(SETTINGS_TABS[0])
  const [members, setMembers] = useState<Member[]>(MEMBERS)
  const [linkOverlay, setLinkOverlay] = useState<LinkOverlay>('none')
  const [activeLinkEntry, setActiveLinkEntry] = useState<SecurityLinkHistoryEntry | null>(null)
  const [reissueSubmission, setReissueSubmission] = useState<ReissueSubmission | null>(null)
  const showToast = useToastStore((state) => state.showToast)

  function toggleApproval(id: string) {
    // TODO(backend): PATCH /api/settings/members/:id { canApprove }
    const member = members.find((current) => current.id === id)
    setMembers((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              approval: item.approval === 'canApprove' ? 'requestOnly' : 'canApprove',
            }
          : item,
      ),
    )
    if (member) showToast(`${member.name}님의 승인 권한을 변경했습니다.`)
  }

  function handleOpenReissue(entry: SecurityLinkHistoryEntry) {
    setActiveLinkEntry(entry)
    setLinkOverlay('reissue')
  }

  function handleSubmitReissue(submission: ReissueSubmission) {
    // TODO(backend): POST /api/security-links/:workerId/reissue { reason, channel, expiry } -> 기존 링크 폐기 + 새 링크 발급
    setReissueSubmission(submission)
    setLinkOverlay('reissued')
  }

  function handleCloseReissued() {
    setLinkOverlay('none')
    setActiveLinkEntry(null)
    setReissueSubmission(null)
    showToast('보안 링크를 재발급했습니다.')
  }

  function handleInviteMember() {
    // TODO(backend): POST /api/settings/members/invite { email, role } -> 구성원 초대 발송
    showToast('구성원 초대를 보냈습니다.')
  }

  return (
    <div>
      <h1 className={styles.headline}>회사의 승인과 데이터 정책을 관리합니다.</h1>
      <p className={styles.description}>
        서비스 범위를 확장하지 않고 담당자의 권한과 안전 기준만 설정합니다.
      </p>

      <Tabs
        tabs={SETTINGS_TAB_ITEMS}
        activeId={activeTab}
        onChange={setActiveTab}
        ariaLabel="설정 탭"
        idPrefix="settings"
      />

      {activeTab === SETTINGS_TABS[0] && (
        <div id="settings-panel-0" role="tabpanel" aria-labelledby="settings-tab-0">
          <div className={styles.cardRow}>
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>승인 정책</h2>
                <span className={styles.cardBadge}>{APPROVAL_POLICY.badge}</span>
              </div>
              <p className={styles.policyName}>{APPROVAL_POLICY.title}</p>
              <p className={styles.policyDescription}>{APPROVAL_POLICY.description}</p>

              <div className={styles.modeRow}>
                <span className={styles.modePill}>{APPROVAL_POLICY.mode}</span>
                <span className={styles.modeNote}>{APPROVAL_POLICY.modeNote}</span>
              </div>

              <p className={styles.policyWarning}>{APPROVAL_POLICY.warning}</p>
            </div>

            <div className={styles.card}>
              <h2 className={styles.cardTitle}>{POLICY_SUMMARY.title}</h2>
              {POLICY_SUMMARY.rows.map((row) => (
                <DetailRow key={row.label} label={row.label} value={row.value} tone={row.tone} />
              ))}
            </div>
          </div>

          <div className={styles.membersCard}>
            <h2 className={styles.cardTitle}>구성원과 승인 권한</h2>

            <div className={styles.membersScroll}>
              <div className={styles.membersHeader}>
                <span className={styles.membersHeaderIdentity}>이름 / 역할</span>
                <span className={styles.membersHeaderApproval}>승인 가능</span>
                <span className={styles.membersHeaderToggle} aria-hidden="true" />
                <span className={styles.membersHeaderStatus}>상태</span>
              </div>

              {members.map((member, index) => (
                <div
                  key={member.id}
                  className={`${styles.memberRow} ${index % 2 === 0 ? styles.memberRowShaded : ''}`}
                >
                  <div className={styles.memberIdentity}>
                    <p className={styles.memberName}>{member.name}</p>
                    <p className={styles.memberRole}>{member.role}</p>
                  </div>

                  <span
                    className={`${styles.memberApproval} ${
                      member.approval === 'canApprove' ? styles.memberApprovalActive : ''
                    }`}
                  >
                    {member.approval === 'canApprove' ? '승인 가능' : '승인 요청만'}
                  </span>

                  <button
                    type="button"
                    role="switch"
                    aria-checked={member.approval === 'canApprove'}
                    aria-label={`${member.name} 승인 권한`}
                    className={`${styles.toggle} ${
                      member.approval === 'canApprove' ? styles.toggleOn : ''
                    }`}
                    onClick={() => toggleApproval(member.id)}
                  >
                    <span className={styles.toggleThumb} />
                  </button>

                  <span
                    className={`${styles.memberStatus} ${
                      member.status === '활성' ? styles.memberStatusActive : styles.memberStatusPending
                    }`}
                  >
                    {member.status}
                  </span>
                </div>
              ))}
            </div>

            <button type="button" className={styles.inviteLink} onClick={handleInviteMember}>
              ＋ 구성원 초대
            </button>
          </div>
        </div>
      )}

      {activeTab === SETTINGS_TABS[1] && (
        <div id="settings-panel-1" role="tabpanel" aria-labelledby="settings-tab-1" className={styles.tabPanel}>
          {/* TODO(backend): GET /api/settings/security-links -> SECURITY_LINK_POLICY, SECURITY_LINK_HISTORY 대체 */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>{SECURITY_LINK_POLICY.title}</h2>
            <p className={styles.policyDescription}>{SECURITY_LINK_POLICY.description}</p>
            <DetailRow label="현재 만료 기간" value={SECURITY_LINK_POLICY.validity} />
          </div>

          <div className={styles.membersCard}>
            <h2 className={styles.cardTitle}>최근 발급 이력</h2>
            <div className={styles.membersScroll}>
              <div className={styles.membersHeader}>
                <span className={styles.membersHeaderIdentity}>근로자</span>
                <span className={styles.membersHeaderApproval}>발급 시각</span>
                <span className={styles.membersHeaderStatus}>상태</span>
                <span className={styles.membersHeaderAction} aria-hidden="true" />
              </div>
              {SECURITY_LINK_HISTORY.map((entry, index) => (
                <div
                  key={entry.id}
                  className={`${styles.memberRow} ${index % 2 === 0 ? styles.memberRowShaded : ''}`}
                >
                  <div className={styles.memberIdentity}>
                    <p className={styles.memberName}>{entry.workerName}</p>
                  </div>
                  <span className={styles.memberApproval}>{entry.issuedAt}</span>
                  <span className={styles.memberStatus}>{entry.status}</span>
                  <button
                    type="button"
                    className={styles.memberAction}
                    onClick={() => handleOpenReissue(entry)}
                  >
                    재발급
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === SETTINGS_TABS[2] && (
        <div id="settings-panel-2" role="tabpanel" aria-labelledby="settings-tab-2" className={styles.tabPanel}>
          {/* TODO(backend): GET /api/settings/completion-evidence -> COMPLETION_EVIDENCE_RULES 대체 */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>업무 유형별 완료 증빙</h2>
            {COMPLETION_EVIDENCE_RULES.map((rule) => (
              <DetailRow
                key={rule.caseType}
                label={rule.caseType}
                value={rule.requirement}
                tone={rule.tone}
              />
            ))}
          </div>
        </div>
      )}

      {activeTab === SETTINGS_TABS[3] && (
        <div id="settings-panel-3" role="tabpanel" aria-labelledby="settings-tab-3" className={styles.tabPanel}>
          {/* TODO(backend): GET /api/settings/process-steps -> PROCESS_STEP_RULES 대체 */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>업무 유형별 승인 단계</h2>
            {PROCESS_STEP_RULES.map((rule) => (
              <DetailRow key={rule.caseType} label={rule.caseType} value={rule.approvalSteps} />
            ))}
          </div>
        </div>
      )}

      {activeTab === SETTINGS_TABS[4] && (
        <div id="settings-panel-4" role="tabpanel" aria-labelledby="settings-tab-4" className={styles.tabPanel}>
          {/* TODO(backend): GET /api/settings/data-log -> DATA_LOG_SETTINGS 대체 */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>데이터·AI 로그 설정</h2>
            {DATA_LOG_SETTINGS.map((setting) => (
              <DetailRow key={setting.label} label={setting.label} value={setting.value} tone={setting.tone} />
            ))}
          </div>
        </div>
      )}

      <p className={styles.footnote}>{FOOTNOTE}</p>

      <LinkReissueModal
        open={linkOverlay === 'reissue'}
        entry={activeLinkEntry}
        onClose={() => setLinkOverlay('none')}
        onSubmit={handleSubmitReissue}
      />
      <LinkReissuedModal
        open={linkOverlay === 'reissued'}
        submission={reissueSubmission}
        onClose={handleCloseReissued}
      />
    </div>
  )
}
