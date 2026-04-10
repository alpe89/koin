import { createFileRoute } from '@tanstack/react-router'

/**
 * Dashboard route — placeholder until the dashboard feature is built.
 * Issue #15 will implement the full dashboard screen.
 */
export const Route = createFileRoute('/_authenticated/')({
  component: function DashboardPage() {
    return (
      <div style={{ padding: '20px 16px' }}>
        <h1 style={{ fontSize: 'var(--text-headline-l)', fontWeight: 700 }}>Dashboard</h1>
        <p style={{ marginTop: 8, color: 'var(--color-on-surface-muted)', fontSize: 'var(--text-body-m)' }}>
          Dashboard content coming in a future milestone.
        </p>
      </div>
    )
  },
})
