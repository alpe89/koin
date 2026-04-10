import { createFileRoute } from '@tanstack/react-router'

/**
 * Monthly report route — placeholder until feature milestone.
 */
export const Route = createFileRoute('/_authenticated/report')({
  component: function ReportPage() {
    return (
      <div style={{ padding: '20px 16px' }}>
        <h1 style={{ fontSize: 'var(--text-headline-l)', fontWeight: 700 }}>Monthly Report</h1>
        <p style={{ marginTop: 8, color: 'var(--color-on-surface-muted)', fontSize: 'var(--text-body-m)' }}>
          Report content coming in a future milestone.
        </p>
      </div>
    )
  },
})
