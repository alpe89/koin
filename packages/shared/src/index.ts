// ============================================================
// Common
// ============================================================

export interface ApiError {
  error: {
    code: string
    message: string
  }
}

// ============================================================
// Entities
// ============================================================

export interface User {
  id: string
  email: string
  displayName: string
  avatarUrl: string | null
  defaultGroupId: string | null
}

export interface Group {
  id: string
  name: string
  ownerId: string
  createdAt: string
}

export interface GroupListItem extends Group {
  role: MemberRole
  memberCount: number
}

export interface GroupMember {
  userId: string
  displayName: string
  avatarUrl: string | null
  role: MemberRole
  joinedAt: string
}

export interface GroupInvitation {
  id: string
  token: string
  inviteUrl: string
  role: InvitationRole
  expiresAt: string
}

export interface InvitationPreview {
  groupName: string
  role: InvitationRole
  invitedBy: string
  expiresAt: string
}

export interface InvitationAcceptResult {
  groupId: string
  groupName: string
  role: InvitationRole
}

export interface Category {
  id: string
  name: string
  type: TransactionType
  sortOrder: number
}

export interface Transaction {
  id: string
  categoryId: string
  categoryName: string
  createdBy: string
  createdByName: string
  amountCents: number
  type: TransactionType
  date: string
  note: string | null
  isRecurringFired: boolean
  recurringRuleId: string | null
  createdAt: string
}

export interface TransactionSummary {
  totalExpenseCents: number
  totalIncomeCents: number
  netCents: number
}

export interface TransactionListResponse {
  transactions: Transaction[]
  summary: TransactionSummary
}

export interface RecurringRule {
  id: string
  categoryId: string
  categoryName: string
  createdBy: string
  createdByName: string
  amountCents: number
  type: TransactionType
  dayOfMonth: number
  note: string | null
  isActive: boolean
  lastFiredAt: string | null
  createdAt: string
}

export interface CategoryBreakdownItem {
  categoryId: string
  categoryName: string
  type: TransactionType
  totalCents: number
  percentageOfType: number
}

export interface TrendItem {
  year: number
  month: number
  totalExpenseCents: number
  totalIncomeCents: number
}

export interface DashboardResponse {
  period: { year: number; month: number }
  totalExpenseCents: number
  totalIncomeCents: number
  netCents: number
  categoryBreakdown: CategoryBreakdownItem[]
  trend: TrendItem[]
}

export interface MonthlyReportResponse {
  period: { year: number; month: number }
  totalIncomeCents: number
  totalExpenseCents: number
  netCents: number
  categoryBreakdown: CategoryBreakdownItem[]
}

// ============================================================
// Enums / Literals
// ============================================================

export type MemberRole = 'owner' | 'editor' | 'viewer'
export type InvitationRole = 'editor' | 'viewer'
export type TransactionType = 'expense' | 'income'

// ============================================================
// Request bodies
// ============================================================

export interface UpdateUserRequest {
  displayName?: string
  defaultGroupId?: string | null
}

export interface CreateGroupRequest {
  name: string
}

export interface UpdateGroupRequest {
  name: string
}

export interface UpdateMemberRoleRequest {
  role: InvitationRole
}

export interface CreateInvitationRequest {
  role: InvitationRole
}

export interface CreateTransactionRequest {
  categoryId: string
  amountCents: number
  type: TransactionType
  date: string
  note?: string | null
  recurringRule?: {
    enabled: boolean
    dayOfMonth: number
  }
}

export interface UpdateTransactionRequest {
  categoryId?: string
  amountCents?: number
  type?: TransactionType
  date?: string
  note?: string | null
}

export interface UpdateRecurringRuleRequest {
  categoryId?: string
  amountCents?: number
  type?: TransactionType
  dayOfMonth?: number
  note?: string | null
  isActive?: boolean
}
