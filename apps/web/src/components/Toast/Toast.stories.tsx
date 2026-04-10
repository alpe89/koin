import type { Meta, StoryObj } from '@storybook/react'
import { ToastProvider, useToast } from './Toast'

const meta: Meta = {
  title: 'Components/Toast',
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <ToastProvider>
        <Story />
      </ToastProvider>
    ),
  ],
}

export default meta
type Story = StoryObj

function ToastTrigger({ message, type }: { message: string; type?: 'default' | 'error' }) {
  const { showToast } = useToast()
  return (
    <button
      onClick={() => showToast(message, type)}
      style={{
        padding: '12px 24px',
        background: type === 'error' ? 'var(--color-error)' : 'var(--color-primary)',
        color: type === 'error' ? '#ffffff' : 'var(--color-primary-on)',
        border: 'none',
        borderRadius: '9999px',
        fontWeight: 600,
        cursor: 'pointer',
        minHeight: '44px',
      }}
    >
      Show {type === 'error' ? 'error' : 'default'} toast
    </button>
  )
}

export const DefaultToast: Story = {
  render: () => <ToastTrigger message="Transaction saved" />,
}

export const ErrorToast: Story = {
  render: () => <ToastTrigger message="Could not save. Please try again." type="error" />,
}

export const MultipleToasts: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
      <ToastTrigger message="Transaction saved" />
      <ToastTrigger message="Group created" />
      <ToastTrigger message="Something went wrong" type="error" />
    </div>
  ),
}
