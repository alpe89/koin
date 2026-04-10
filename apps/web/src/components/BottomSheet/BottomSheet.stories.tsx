import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { BottomSheet } from './BottomSheet'

const meta: Meta<typeof BottomSheet> = {
  title: 'Components/BottomSheet',
  component: BottomSheet,
  parameters: {
    layout: 'fullscreen',
  },
}

export default meta
type Story = StoryObj<typeof BottomSheet>

function BottomSheetDemo({
  title,
  children,
}: {
  title?: string
  children: React.ReactNode
}) {
  const [isOpen, setIsOpen] = useState(false)
  return (
    <div style={{ padding: '40px 20px', background: 'var(--color-surface)', minHeight: '100vh' }}>
      <button
        onClick={() => setIsOpen(true)}
        style={{
          padding: '12px 24px',
          background: 'var(--color-primary)',
          color: 'var(--color-primary-on)',
          border: 'none',
          borderRadius: '9999px',
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        Open sheet
      </button>
      <BottomSheet isOpen={isOpen} onClose={() => setIsOpen(false)} title={title}>
        {children}
      </BottomSheet>
    </div>
  )
}

export const Default: Story = {
  render: () => (
    <BottomSheetDemo title="Sheet title">
      <p style={{ color: 'var(--color-on-surface-muted)', marginBottom: 16 }}>
        Sheet body content goes here. This sheet has a title, handle, and can be dismissed via Escape,
        backdrop click, or a close button inside.
      </p>
      <button
        style={{
          width: '100%',
          padding: '14px',
          background: 'var(--color-primary)',
          border: 'none',
          borderRadius: '9999px',
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        Primary action
      </button>
    </BottomSheetDemo>
  ),
}

export const NoTitle: Story = {
  render: () => (
    <BottomSheetDemo>
      <p style={{ color: 'var(--color-on-surface-muted)' }}>
        Sheet without a title — handle only.
      </p>
    </BottomSheetDemo>
  ),
}

export const TallContent: Story = {
  render: () => (
    <BottomSheetDemo title="Scrollable sheet">
      {Array.from({ length: 20 }, (_, i) => (
        <p key={i} style={{ color: 'var(--color-on-surface-muted)', marginBottom: 12 }}>
          Row {i + 1} — long content that requires scrolling within the sheet.
        </p>
      ))}
    </BottomSheetDemo>
  ),
}
