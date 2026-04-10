import type { Meta, StoryObj } from '@storybook/react'
import { AuthProvider } from '../../auth/AuthContext'
import { GroupProvider } from '../../auth/GroupContext'
import { ToastProvider } from '../../components/Toast/Toast'

/**
 * JoinPage depends on TanStack Router's useSearch/useNavigate hooks, so we
 * mock the page content directly per state rather than mounting the full page.
 * Full route integration is covered in E2E tests.
 */

const meta: Meta = {
  title: 'Pages/JoinPage',
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

import styles from './JoinPage.module.css'

export const Preview: Story = {
  render: () => (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logo} aria-hidden="true">
          <span className="material-symbols-outlined" style={{ fontSize: '32px', color: 'var(--color-primary-on)' }}>
            savings
          </span>
        </div>
        <h1 className={styles.title}>You&rsquo;re invited to join</h1>
        <p className={styles['group-name']}>Smith Family</p>
        <dl className={styles['preview-list']}>
          <div className={styles['preview-item']}>
            <dt className={styles['preview-item__label']}>Invited by</dt>
            <dd className={styles['preview-item__value']}>Jane Smith</dd>
          </div>
          <div className={styles['preview-item']}>
            <dt className={styles['preview-item__label']}>Your role</dt>
            <dd className={styles['preview-item__value']}>
              <span className={[styles['role-badge'], styles['role-badge--editor']].join(' ')}>Editor</span>
            </dd>
          </div>
          <div className={styles['preview-item']}>
            <dt className={styles['preview-item__label']}>Link expires</dt>
            <dd className={styles['preview-item__value']}>12 Apr 2026</dd>
          </div>
        </dl>
        <button className={styles['btn-primary']}>Join group</button>
      </div>
    </div>
  ),
}

export const UnauthenticatedPreview: Story = {
  render: () => (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logo} aria-hidden="true">
          <span className="material-symbols-outlined" style={{ fontSize: '32px', color: 'var(--color-primary-on)' }}>
            savings
          </span>
        </div>
        <h1 className={styles.title}>You&rsquo;re invited to join</h1>
        <p className={styles['group-name']}>Smith Family</p>
        <dl className={styles['preview-list']}>
          <div className={styles['preview-item']}>
            <dt className={styles['preview-item__label']}>Invited by</dt>
            <dd className={styles['preview-item__value']}>Jane Smith</dd>
          </div>
          <div className={styles['preview-item']}>
            <dt className={styles['preview-item__label']}>Your role</dt>
            <dd className={styles['preview-item__value']}>
              <span className={[styles['role-badge'], styles['role-badge--viewer']].join(' ')}>Viewer</span>
            </dd>
          </div>
          <div className={styles['preview-item']}>
            <dt className={styles['preview-item__label']}>Link expires</dt>
            <dd className={styles['preview-item__value']}>12 Apr 2026</dd>
          </div>
        </dl>
        <p className={styles.hint}>You&rsquo;ll need to sign in with Google before joining.</p>
        <button className={styles['btn-primary']}>Sign in and join group</button>
      </div>
    </div>
  ),
}

export const InvalidLink: Story = {
  render: () => (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles['icon-wrap']} aria-hidden="true">
          <span className="material-symbols-outlined" style={{ fontSize: '40px', color: 'var(--color-error)' }}>
            link_off
          </span>
        </div>
        <h1 className={styles.title}>Invalid invite link</h1>
        <p className={styles.body}>
          This invite link has expired, already been used, or is invalid.
        </p>
        <button className={styles['btn-primary']}>Go to dashboard</button>
      </div>
    </div>
  ),
}

export const Success: Story = {
  render: () => (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles['icon-wrap']} aria-hidden="true">
          <span className="material-symbols-outlined" style={{ fontSize: '40px', color: 'var(--color-income)' }}>
            check_circle
          </span>
        </div>
        <h1 className={styles.title}>You joined Smith Family</h1>
        <p className={styles.body}>
          You now have access to this group&rsquo;s transactions and reports.
        </p>
        <button className={styles['btn-primary']}>Go to dashboard</button>
      </div>
    </div>
  ),
}

export const AlreadyMember: Story = {
  render: () => (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles['icon-wrap']} aria-hidden="true">
          <span className="material-symbols-outlined" style={{ fontSize: '40px', color: 'var(--color-primary-on)' }}>
            check_circle
          </span>
        </div>
        <h1 className={styles.title}>Already a member</h1>
        <p className={styles.body}>You are already a member of this group.</p>
        <button className={styles['btn-primary']}>Go to dashboard</button>
      </div>
    </div>
  ),
}
