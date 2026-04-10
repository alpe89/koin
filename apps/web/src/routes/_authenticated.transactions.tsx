import { createFileRoute } from '@tanstack/react-router'

/**
 * Transactions list route — placeholder until feature milestone.
 */
export const Route = createFileRoute('/_authenticated/transactions')({
  component: function TransactionsPage() {
    return (
      <div style={{ padding: '20px 16px' }}>
        <h1 style={{ fontSize: 'var(--text-headline-l)', fontWeight: 700 }}>Transactions</h1>
        <p style={{ marginTop: 8, color: 'var(--color-on-surface-muted)', fontSize: 'var(--text-body-m)' }}>
          Transaction list coming in a future milestone.
        </p>
      </div>
    )
  },
})
