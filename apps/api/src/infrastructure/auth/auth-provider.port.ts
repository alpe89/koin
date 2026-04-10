export interface UserProfile {
  googleSub: string
  email: string
  displayName: string
  avatarUrl: string | null
}

export interface AuthProvider {
  buildAuthUrl(redirectUri: string, state: string): string
  exchangeCodeForProfile(code: string, redirectUri: string): Promise<UserProfile>
}
