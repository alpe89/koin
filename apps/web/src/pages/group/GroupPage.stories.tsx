import type { Meta, StoryObj } from '@storybook/react'
import { AuthProvider } from '../../auth/AuthContext'
import { GroupProvider } from '../../auth/GroupContext'
import { ToastProvider } from '../../components/Toast/Toast'

/**
 * GroupPage depends on AuthContext + GroupContext, so stories that render
 * specific states mock the relevant portions of the CSS/UI rather than
 * mounting the live component (which requires a running API).
 */
const meta: Meta = {
  title: 'Pages/GroupPage',
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <AuthProvider>
        <GroupProvider>
          <ToastProvider>
            <Story />
          </ToastProvider>
        </GroupProvider>
      </AuthProvider>
    ),
  ],
}

export default meta
type Story = StoryObj

import styles from './GroupPage.module.css'
import { Avatar } from '../../components/Avatar/Avatar'

const mockMembers = [
  { userId: '1', displayName: 'Jane Smith', avatarUrl: null, role: 'owner' as const, joinedAt: '2026-01-01T00:00:00Z' },
  { userId: '2', displayName: 'Alex Pereira', avatarUrl: null, role: 'editor' as const, joinedAt: '2026-02-15T00:00:00Z' },
  { userId: '3', displayName: 'Carol White', avatarUrl: null, role: 'viewer' as const, joinedAt: '2026-03-10T00:00:00Z' },
]

function RoleBadge({ role }: { role: 'owner' | 'editor' | 'viewer' }) {
  const label = role.charAt(0).toUpperCase() + role.slice(1)
  return (
    <span
      className={[styles['role-badge'], styles[`role-badge--${role}`]].join(' ')}
      aria-label={`Role: ${label}`}
    >
      {label}
    </span>
  )
}

export const OwnerView: Story = {
  render: () => (
    <div>
      <header className={styles['top-bar']}>
        <h1 className={styles['top-bar__title']}>Smith Family</h1>
        <button className={styles['top-bar__action']} aria-label="Group settings">
          <span className="material-symbols-outlined" aria-hidden="true">settings</span>
        </button>
      </header>
      <div className={styles.page}>
        <section className={styles.section} aria-labelledby="invite-heading">
          <h2 id="invite-heading" className={styles['section__heading']}>Invite someone</h2>
          <div className={styles.invite}>
            <p className={styles['invite__description']}>
              Share a link to invite someone. The link can only be used once and expires in 48 hours.
            </p>
            <div className={styles['invite__controls']}>
              <select className={styles['invite__role-select']}>
                <option>Editor</option>
                <option>Viewer</option>
              </select>
              <button className={styles['invite__copy-btn']}>
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }} aria-hidden="true">link</span>
                Copy invite link
              </button>
            </div>
          </div>
        </section>
        <section className={styles.section} aria-labelledby="members-heading">
          <h2 id="members-heading" className={styles['section__heading']}>Members</h2>
          <ul className={styles['member-list']}>
            {mockMembers.map((m) => (
              <li key={m.userId} className={styles['member-row']}>
                <Avatar displayName={m.displayName} size="md" />
                <div className={styles['member-row__info']}>
                  <div className={styles['member-row__name']}>{m.displayName}</div>
                  <div className={styles['member-row__meta']}>Joined Jan 2026</div>
                </div>
                <div className={styles['member-row__actions']}>
                  {m.role === 'owner' ? (
                    <RoleBadge role={m.role} />
                  ) : (
                    <div className={styles['inline-role']}>
                      <select className={styles['role-select-inline']} value={m.role} onChange={() => {}}>
                        <option value="editor">Editor</option>
                        <option value="viewer">Viewer</option>
                      </select>
                      <button className={[styles['icon-btn'], styles['icon-btn--danger']].join(' ')} aria-label={`Remove ${m.displayName}`}>
                        <span className="material-symbols-outlined" aria-hidden="true">person_remove</span>
                      </button>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  ),
}

export const ViewerView: Story = {
  render: () => (
    <div>
      <header className={styles['top-bar']}>
        <h1 className={styles['top-bar__title']}>Smith Family</h1>
      </header>
      <div className={styles.page}>
        <section className={styles.section} aria-labelledby="members-heading">
          <h2 id="members-heading" className={styles['section__heading']}>Members</h2>
          <ul className={styles['member-list']}>
            {mockMembers.map((m) => (
              <li key={m.userId} className={styles['member-row']}>
                <Avatar displayName={m.displayName} size="md" />
                <div className={styles['member-row__info']}>
                  <div className={styles['member-row__name']}>{m.displayName}</div>
                  <div className={styles['member-row__meta']}>Joined Jan 2026</div>
                </div>
                <div className={styles['member-row__actions']}>
                  <RoleBadge role={m.role} />
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  ),
}

export const EmptySoloGroup: Story = {
  render: () => (
    <div>
      <header className={styles['top-bar']}>
        <h1 className={styles['top-bar__title']}>Alex&apos;s Group</h1>
        <button className={styles['top-bar__action']} aria-label="Group settings">
          <span className="material-symbols-outlined" aria-hidden="true">settings</span>
        </button>
      </header>
      <div className={styles.page}>
        <section className={styles.section} aria-labelledby="invite-heading">
          <h2 id="invite-heading" className={styles['section__heading']}>Invite someone</h2>
          <div className={styles.invite}>
            <p className={styles['invite__description']}>
              Share a link to invite someone. The link can only be used once and expires in 48 hours.
            </p>
            <div className={styles['invite__controls']}>
              <select className={styles['invite__role-select']}>
                <option>Editor</option>
                <option>Viewer</option>
              </select>
              <button className={styles['invite__copy-btn']}>
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }} aria-hidden="true">link</span>
                Copy invite link
              </button>
            </div>
          </div>
        </section>
        <section className={styles.section} aria-labelledby="members-heading">
          <h2 id="members-heading" className={styles['section__heading']}>Members</h2>
          <p className={styles.empty}>Just you here. Copy an invite link to add someone.</p>
        </section>
      </div>
    </div>
  ),
}
