/**
 * Thin API client. Attaches the Authorization header from the token passed
 * into each call. The caller (hooks) is responsible for sourcing the token
 * from AuthContext.
 */

export interface ApiError {
  code: string
  message: string
}

class KoinApiError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly apiError: ApiError,
  ) {
    super(apiError.message)
    this.name = 'KoinApiError'
  }
}

const API_BASE = (import.meta.env.VITE_API_URL ?? '') + '/api/v1'

async function request<T>(
  path: string,
  token: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers ?? {}),
    },
  })

  if (res.status === 204) {
    return undefined as unknown as T
  }

  const body = await res.json()

  if (!res.ok) {
    throw new KoinApiError(res.status, (body as { error: ApiError }).error)
  }

  return body as T
}

// --- Auth ---

export function apiSignOut(token: string) {
  return request<void>('/auth/signout', token, { method: 'POST' })
}

// --- Groups ---

export interface Group {
  id: string
  name: string
  ownerId: string
  role: 'owner' | 'editor' | 'viewer'
  memberCount: number
  createdAt: string
}

export function apiListGroups(token: string) {
  return request<Group[]>('/groups', token)
}

export function apiCreateGroup(token: string, name: string) {
  return request<{ id: string; name: string; ownerId: string; createdAt: string }>(
    '/groups',
    token,
    { method: 'POST', body: JSON.stringify({ name }) },
  )
}

export function apiRenameGroup(token: string, groupId: string, name: string) {
  return request<Group>(`/groups/${groupId}`, token, {
    method: 'PATCH',
    body: JSON.stringify({ name }),
  })
}

// --- Group Members ---

export interface Member {
  userId: string
  displayName: string
  avatarUrl: string | null
  role: 'owner' | 'editor' | 'viewer'
  joinedAt: string
}

export function apiListMembers(token: string, groupId: string) {
  return request<Member[]>(`/groups/${groupId}/members`, token)
}

export function apiChangeMemberRole(
  token: string,
  groupId: string,
  userId: string,
  role: 'editor' | 'viewer',
) {
  return request<Member>(`/groups/${groupId}/members/${userId}`, token, {
    method: 'PATCH',
    body: JSON.stringify({ role }),
  })
}

export function apiRemoveMember(token: string, groupId: string, userId: string) {
  return request<void>(`/groups/${groupId}/members/${userId}`, token, { method: 'DELETE' })
}

// --- Invitations ---

export interface InvitationPreview {
  groupName: string
  role: 'editor' | 'viewer'
  invitedBy: string
  expiresAt: string
}

export interface CreatedInvitation {
  id: string
  token: string
  inviteUrl: string
  role: 'editor' | 'viewer'
  expiresAt: string
}

export function apiCreateInvitation(
  token: string,
  groupId: string,
  role: 'editor' | 'viewer',
) {
  return request<CreatedInvitation>(`/groups/${groupId}/invitations`, token, {
    method: 'POST',
    body: JSON.stringify({ role }),
  })
}

export function apiGetInvitationPreview(inviteToken: string) {
  // This endpoint is public — no auth header needed
  return fetch(`${API_BASE}/invitations/${inviteToken}`).then(async (res) => {
    const body = await res.json()
    if (!res.ok) throw new KoinApiError(res.status, (body as { error: ApiError }).error)
    return body as InvitationPreview
  })
}

export function apiAcceptInvitation(token: string, inviteToken: string) {
  return request<{ groupId: string; groupName: string; role: string }>(
    `/invitations/${inviteToken}/accept`,
    token,
    { method: 'POST' },
  )
}

// --- Users ---

export function apiUpdateMe(token: string, patch: { displayName?: string; defaultGroupId?: string | null }) {
  return request<{
    id: string
    email: string
    displayName: string
    avatarUrl: string | null
    defaultGroupId: string | null
  }>('/users/me', token, { method: 'PATCH', body: JSON.stringify(patch) })
}
