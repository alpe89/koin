import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { AppShell } from '../components/AppShell/AppShell'

/**
 * Layout route for all authenticated pages.
 * TanStack Router uses the `_` prefix for pathless layout routes.
 *
 * The beforeLoad guard checks for a stored token. If absent, redirect to
 * /login. The actual user fetch happens in AuthContext bootstrap.
 */
export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async () => {
    // Dynamically import storage to avoid circular deps at module-level
    const { getToken } = await import('../auth/storage')
    const token = await getToken()
    if (!token) {
      throw redirect({ to: '/login' })
    }
  },
  component: function AuthenticatedLayout() {
    return (
      <AppShell>
        <Outlet />
      </AppShell>
    )
  },
})
