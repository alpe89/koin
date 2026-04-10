import { createRootRoute, Outlet } from '@tanstack/react-router'
import { useAuthCallback } from '../auth/AuthCallback'

/**
 * Root route — handles OAuth token extraction from the URL fragment.
 * All child routes are rendered via <Outlet />.
 */
function RootComponent() {
  // Runs on every mount; reads /#token= from the fragment and signs in
  useAuthCallback()

  return <Outlet />
}

export const Route = createRootRoute({
  component: RootComponent,
})
