import type { Meta, StoryObj } from '@storybook/react'
import { Avatar } from './Avatar'

const meta: Meta<typeof Avatar> = {
  title: 'Components/Avatar',
  component: Avatar,
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg'],
    },
  },
}

export default meta
type Story = StoryObj<typeof Avatar>

export const WithPhoto: Story = {
  args: {
    displayName: 'Jane Smith',
    avatarUrl: 'https://i.pravatar.cc/150?img=47',
    size: 'md',
  },
}

export const InitialsFallback: Story = {
  args: {
    displayName: 'Jane Smith',
    avatarUrl: null,
    size: 'md',
  },
}

export const SingleName: Story = {
  args: {
    displayName: 'Alex',
    avatarUrl: null,
    size: 'md',
  },
}

export const ExtraSmall: Story = {
  args: {
    displayName: 'Jane Smith',
    avatarUrl: null,
    size: 'xs',
  },
}

export const Small: Story = {
  args: {
    displayName: 'Jane Smith',
    avatarUrl: null,
    size: 'sm',
  },
}

export const Large: Story = {
  args: {
    displayName: 'Jane Smith',
    avatarUrl: null,
    size: 'lg',
  },
}

export const BrokenImageFallback: Story = {
  args: {
    displayName: 'Jane Smith',
    avatarUrl: 'https://example.invalid/broken.jpg',
    size: 'md',
  },
}

export const AllSizes: Story = {
  render: () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
      <Avatar displayName="Alex Pereira" size="xs" />
      <Avatar displayName="Alex Pereira" size="sm" />
      <Avatar displayName="Alex Pereira" size="md" />
      <Avatar displayName="Alex Pereira" size="lg" />
    </div>
  ),
}
