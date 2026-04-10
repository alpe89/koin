import { describe, it, expect } from 'bun:test'
import type { User, Group, Transaction, RecurringRule } from './index.js'

describe('@koin/shared types', () => {
  it('User type has required fields', () => {
    const user: User = {
      id: 'uuid',
      email: 'user@example.com',
      displayName: 'Jane Smith',
      avatarUrl: null,
      defaultGroupId: null,
    }
    expect(user.id).toBe('uuid')
    expect(user.email).toBe('user@example.com')
  })

  it('Group type has required fields', () => {
    const group: Group = {
      id: 'uuid',
      name: 'Family',
      ownerId: 'owner-uuid',
      createdAt: '2026-04-10T00:00:00Z',
    }
    expect(group.name).toBe('Family')
  })

  it('Transaction amount is in cents', () => {
    const tx: Transaction = {
      id: 'uuid',
      categoryId: 'cat-uuid',
      categoryName: 'Food & Groceries',
      createdBy: 'user-uuid',
      createdByName: 'Jane',
      amountCents: 1250,
      type: 'expense',
      date: '2026-04-10',
      note: null,
      isRecurringFired: false,
      recurringRuleId: null,
      createdAt: '2026-04-10T00:00:00Z',
    }
    expect(tx.amountCents).toBe(1250)
    expect(tx.type).toBe('expense')
  })

  it('RecurringRule dayOfMonth is constrained conceptually to 1-28', () => {
    const rule: RecurringRule = {
      id: 'uuid',
      categoryId: 'cat-uuid',
      categoryName: 'Salary',
      createdBy: 'user-uuid',
      createdByName: 'Jane',
      amountCents: 150000,
      type: 'income',
      dayOfMonth: 1,
      note: null,
      isActive: true,
      lastFiredAt: null,
      createdAt: '2026-04-10T00:00:00Z',
    }
    expect(rule.dayOfMonth).toBeGreaterThanOrEqual(1)
    expect(rule.dayOfMonth).toBeLessThanOrEqual(28)
  })
})
