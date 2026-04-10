/**
 * /join?token=<token>
 *
 * Shows the group preview (name, role, invited by, expiry) and a "Join group"
 * button. If the user is unauthenticated, they are prompted to sign in first.
 * After joining they are redirected to the group dashboard.
 */
import { useEffect, useState } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { apiAcceptInvitation, apiGetInvitationPreview, type InvitationPreview } from '../../api/client'
import { useAuth } from '../../auth/AuthContext'
import { useGroup } from '../../auth/GroupContext'
import styles from './JoinPage.module.css'

type PageState =
  | { status: 'loading' }
  | { status: 'invalid' }
  | { status: 'preview'; data: InvitationPreview }
  | { status: 'joining' }
  | { status: 'success'; groupName: string }
  | { status: 'error'; message: string }
  | { status: 'already-member' }

export function JoinPage() {
  const { token: inviteToken } = useSearch({ from: '/join' })
  const { token: authToken, isLoading: authLoading } = useAuth()
  const { refreshGroups } = useGroup()
  const navigate = useNavigate()

  const [state, setState] = useState<PageState>({ status: 'loading' })

  // Fetch invitation preview (public endpoint — no auth required)
  useEffect(() => {
    if (!inviteToken) {
      setState({ status: 'invalid' })
      return
    }

    let cancelled = false

    apiGetInvitationPreview(inviteToken)
      .then((data) => {
        if (!cancelled) {
          setState({ status: 'preview', data })
        }
      })
      .catch(() => {
        if (!cancelled) {
          setState({ status: 'invalid' })
        }
      })

    return () => {
      cancelled = true
    }
  }, [inviteToken])

  const handleJoin = async () => {
    if (!authToken) {
      // Redirect to login; after OAuth the user lands back at the app root.
      // We store the invite URL in sessionStorage so they can re-visit.
      sessionStorage.setItem('koin_pending_invite', window.location.href)
      window.location.href = `${import.meta.env.VITE_API_URL ?? ''}/api/v1/auth/google`
      return
    }

    setState({ status: 'joining' })
    try {
      const result = await apiAcceptInvitation(authToken, inviteToken)
      await refreshGroups()
      setState({ status: 'success', groupName: result.groupName })
    } catch (err: unknown) {
      // Check for 409 Conflict (already a member)
      if (err && typeof err === 'object' && 'statusCode' in err && err.statusCode === 409) {
        setState({ status: 'already-member' })
      } else {
        setState({
          status: 'error',
          message: 'Could not join this group. The invite link may have expired or already been used.',
        })
      }
    }
  }

  const handleGoToDashboard = () => {
    void navigate({ to: '/' })
  }

  if (authLoading || state.status === 'loading') {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <p className={styles.loading}>Loading…</p>
        </div>
      </div>
    )
  }

  if (state.status === 'invalid') {
    return (
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
          {authToken && (
            <button className={styles['btn-primary']} onClick={handleGoToDashboard}>
              Go to dashboard
            </button>
          )}
          {!authToken && (
            <a href={`${import.meta.env.VITE_API_URL ?? ''}/api/v1/auth/google`} className={styles['btn-primary']}>
              Sign in with Google
            </a>
          )}
        </div>
      </div>
    )
  }

  if (state.status === 'already-member') {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <div className={styles['icon-wrap']} aria-hidden="true">
            <span className="material-symbols-outlined" style={{ fontSize: '40px', color: 'var(--color-primary-on)' }}>
              check_circle
            </span>
          </div>
          <h1 className={styles.title}>Already a member</h1>
          <p className={styles.body}>
            You are already a member of this group.
          </p>
          <button className={styles['btn-primary']} onClick={handleGoToDashboard}>
            Go to dashboard
          </button>
        </div>
      </div>
    )
  }

  if (state.status === 'success') {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <div className={styles['icon-wrap']} aria-hidden="true">
            <span className="material-symbols-outlined" style={{ fontSize: '40px', color: 'var(--color-income)' }}>
              check_circle
            </span>
          </div>
          <h1 className={styles.title}>You joined {state.groupName}</h1>
          <p className={styles.body}>
            You now have access to this group's transactions and reports.
          </p>
          <button className={styles['btn-primary']} onClick={handleGoToDashboard}>
            Go to dashboard
          </button>
        </div>
      </div>
    )
  }

  if (state.status === 'error') {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <div className={styles['icon-wrap']} aria-hidden="true">
            <span className="material-symbols-outlined" style={{ fontSize: '40px', color: 'var(--color-error)' }}>
              error
            </span>
          </div>
          <h1 className={styles.title}>Something went wrong</h1>
          <p className={styles.body}>{state.message}</p>
          <button className={styles['btn-primary']} onClick={handleGoToDashboard}>
            Go to dashboard
          </button>
        </div>
      </div>
    )
  }

  // Preview state
  const preview = state.data
  const roleLabel = preview.role.charAt(0).toUpperCase() + preview.role.slice(1)
  const expiresDate = new Date(preview.expiresAt).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        {/* Logo mark */}
        <div className={styles.logo} aria-hidden="true">
          <span className="material-symbols-outlined" style={{ fontSize: '32px', color: 'var(--color-primary-on)' }}>
            savings
          </span>
        </div>

        <h1 className={styles.title}>
          You&rsquo;re invited to join
        </h1>
        <p className={styles['group-name']}>{preview.groupName}</p>

        <dl className={styles['preview-list']}>
          <div className={styles['preview-item']}>
            <dt className={styles['preview-item__label']}>Invited by</dt>
            <dd className={styles['preview-item__value']}>{preview.invitedBy}</dd>
          </div>
          <div className={styles['preview-item']}>
            <dt className={styles['preview-item__label']}>Your role</dt>
            <dd className={styles['preview-item__value']}>
              <span className={[styles['role-badge'], styles[`role-badge--${preview.role}`]].join(' ')}>
                {roleLabel}
              </span>
            </dd>
          </div>
          <div className={styles['preview-item']}>
            <dt className={styles['preview-item__label']}>Link expires</dt>
            <dd className={styles['preview-item__value']}>{expiresDate}</dd>
          </div>
        </dl>

        {!authToken && (
          <p className={styles.hint}>
            You&rsquo;ll need to sign in with Google before joining.
          </p>
        )}

        <button
          className={styles['btn-primary']}
          onClick={handleJoin}
          disabled={state.status === 'joining'}
          aria-busy={state.status === 'joining'}
        >
          {state.status === 'joining'
            ? 'Joining…'
            : authToken
            ? 'Join group'
            : 'Sign in and join group'}
        </button>
      </div>
    </div>
  )
}
