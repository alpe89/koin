import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { GroupSwitcherSheet } from './GroupSwitcherSheet'
import { AuthProvider } from '../../auth/AuthContext'
import { GroupProvider } from '../../auth/GroupContext'
import { ToastProvider } from '../Toast/Toast'

const meta: Meta<typeof GroupSwitcherSheet> = {
  title: 'Components/GroupSwitcherSheet',
  component: GroupSwitcherSheet,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <AuthProvider>
        <GroupProvider>
          <ToastProvider>
            <Story />
          </ToastProvider>
        </GroupProvider>
      </AuthProvider>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof GroupSwitcherSheet>

function SheetDemo() {
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
        Open group switcher
      </button>
      <GroupSwitcherSheet isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </div>
  )
}

export const Default: Story = {
  render: () => <SheetDemo />,
}
