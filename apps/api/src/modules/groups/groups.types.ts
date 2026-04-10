import type { MemberRole, InvitationRole } from '@koin/shared'

export interface GroupRow {
  id: string
  name: string
  owner_id: string
  created_at: Date
}

export interface GroupMemberRow {
  user_id: string
  display_name: string
  avatar_url: string | null
  role: MemberRole
  joined_at: Date
}

export interface InvitationRow {
  id: string
  group_id: string
  token: string
  role: InvitationRole
  created_by: string
  used_by: string | null
  used_at: Date | null
  expires_at: Date
  created_at: Date
}
