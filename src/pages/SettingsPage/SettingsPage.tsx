import { useState } from 'react'
import styles from './SettingsPage.module.css'
import {
  APPROVAL_POLICY,
  FOOTNOTE,
  MEMBERS,
  POLICY_SUMMARY,
  SETTINGS_TABS,
  type Member,
} from './settingsData'

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState(SETTINGS_TABS[0])
  const [members, setMembers] = useState<Member[]>(MEMBERS)

  function toggleApproval(id: string) {
    // TODO(backend): PATCH /api/settings/members/:id { canApprove }
    setMembers((current) =>
      current.map((member) =>
        member.id === id
          ? {
              ...member,
              approval: member.approval === 'canApprove' ? 'requestOnly' : 'canApprove',
            }
          : member,
      ),
    )
  }

  return (
    <div>
      <h1 className={styles.headline}>회사의 승인과 데이터 정책을 관리합니다.</h1>
      <p className={styles.description}>
        서비스 범위를 확장하지 않고 담당자의 권한과 안전 기준만 설정합니다.
      </p>

      <div className={styles.tabs} role="tablist" aria-label="설정 탭">
        {SETTINGS_TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={activeTab === tab}
            className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

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
            <div key={row.label} className={styles.summaryRow}>
              <span>{row.label}</span>
              <span
                className={`${styles.summaryValue} ${
                  row.tone === 'warning' ? styles.summaryValueWarning : ''
                }`}
              >
                {row.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.membersCard}>
        <h2 className={styles.cardTitle}>구성원과 승인 권한</h2>

        <div className={styles.membersHeader}>
          <span>이름 / 역할</span>
          <span>승인 가능</span>
          <span>상태</span>
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

        <button type="button" className={styles.inviteLink}>
          ＋ 구성원 초대
        </button>
      </div>

      <p className={styles.footnote}>{FOOTNOTE}</p>
    </div>
  )
}
