import type { Meta, StoryObj } from '@storybook/react'
import { AppShell } from './AppShell'
import { RouterProvider, createMemoryHistory, createRouter, createRootRoute, createRoute, Outlet } from '@tanstack/react-router'

const meta: Meta<typeof AppShell> = {
  title: 'Components/AppShell',
  parameters: {
    layout: 'fullscreen',
  },
}

export default meta
type Story = StoryObj<typeof AppShell>

/** Minimal TanStack Router setup for Storybook — no real routes needed */
function withRouter(content: React.ReactNode) {
  const rootRoute = createRootRoute({
    component: () => <AppShell><Outlet /></AppShell>,
  })
  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    component: () => <>{content}</>,
  })
  const groupRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/group',
    component: () => <>{content}</>,
  })
  const transactionsRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/transactions',
    component: () => <>{content}</>,
  })
  const reportRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/report',
    component: () => <>{content}</>,
  })
  const routeTree = rootRoute.addChildren([indexRoute, groupRoute, transactionsRoute, reportRoute])
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: ['/'] }),
  })
  return <RouterProvider router={router} />
}

export const Default: Story = {
  render: () =>
    withRouter(
      <div style={{ padding: '20px 16px' }}>
        <h1 style={{ fontSize: 'var(--text-headline-l)', fontWeight: 700 }}>Dashboard</h1>
        <p style={{ marginTop: 8, color: 'var(--color-on-surface-muted)' }}>
          Main content area — AppShell provides the bottom nav and main content region.
        </p>
      </div>,
    ),
}
