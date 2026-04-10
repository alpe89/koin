/**
 * Handles the OAuth redirect: /#token=<jwt>
 *
 * This hook is called from the root route on every mount. It extracts the
 * token from the URL fragment, strips the fragment, stores the token, and
 * navigates to the intended destination using TanStack Router.
 */
import { useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useAuth } from './AuthContext'

export function useAuthCallback() {
  const { signIn } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const hash = window.location.hash

    if (!hash.startsWith('#token=')) return

    const token = hash.slice('#token='.length)

    if (!token) return

    // Strip fragment from URL immediately — never let the token sit in history
    window.history.replaceState(null, '', window.location.pathname + window.location.search)

    signIn(token)
      .then(() => {
        void navigate({ to: '/', replace: true })
      })
      .catch(() => {
        void navigate({ to: '/login', replace: true })
      })
  }, [signIn, navigate])
}
