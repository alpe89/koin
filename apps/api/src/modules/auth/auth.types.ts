export interface AuthUser {
  id: string
  email: string
  displayName: string
  avatarUrl: string | null
  defaultGroupId: string | null
}

export interface AuthenticatedUser {
  id: string
  email: string
  displayName: string
}
