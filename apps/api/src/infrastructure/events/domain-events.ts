export type KoinEvent =
  | {
      type: 'transaction.created'
      payload: {
        transactionId: string
        groupId: string
        type: 'expense' | 'income'
        amountCents: number
        createdBy: string
        date: string // YYYY-MM-DD
      }
    }
  | {
      type: 'transaction.deleted'
      payload: { transactionId: string; groupId: string }
    }
  | {
      type: 'recurring_rule.created'
      payload: { ruleId: string; groupId: string; dayOfMonth: number }
    }
  | {
      type: 'member.removed'
      payload: { groupId: string; userId: string }
    }
