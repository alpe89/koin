import { createFileRoute, redirect } from '@tanstack/react-router'
import { LoginPage } from '../pages/login/LoginPage'

/**
 * Login route — only accessible when unauthenticated.
 * If a token is already stored, redirect to the dashboard.
 */
export const Route = createFileRoute('/login')({
  beforeLoad: async () => {
    const { getToken } = await import('../auth/storage')
    const token = await getToken()
    if (token) {
      throw redirect({ to: '/' })
    }
  },
  component: LoginPage,
})
