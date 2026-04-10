import type { AuthProvider, UserProfile } from './auth-provider.port.ts'

interface GoogleTokenResponse {
  access_token: string
  id_token: string
  token_type: string
  expires_in: number
}

interface GoogleUserInfo {
  sub: string
  email: string
  name: string
  picture: string | null
}

export class GoogleAuthAdapter implements AuthProvider {
  private readonly clientId: string
  private readonly clientSecret: string
  private static readonly AUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth'
  private static readonly TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token'
  private static readonly USERINFO_ENDPOINT = 'https://www.googleapis.com/oauth2/v3/userinfo'

  constructor(clientId: string, clientSecret: string) {
    this.clientId = clientId
    this.clientSecret = clientSecret
  }

  buildAuthUrl(redirectUri: string, state: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      state,
      access_type: 'online',
      prompt: 'select_account',
    })
    return `${GoogleAuthAdapter.AUTH_ENDPOINT}?${params.toString()}`
  }

  async exchangeCodeForProfile(code: string, redirectUri: string): Promise<UserProfile> {
    // Exchange authorization code for tokens
    const tokenRes = await fetch(GoogleAuthAdapter.TOKEN_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: this.clientId,
        client_secret: this.clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }).toString(),
    })

    if (!tokenRes.ok) {
      const body = await tokenRes.text()
      throw new Error(`Google token exchange failed: ${tokenRes.status} ${body}`)
    }

    const tokens = (await tokenRes.json()) as GoogleTokenResponse

    // Fetch user info using the access token
    const userInfoRes = await fetch(GoogleAuthAdapter.USERINFO_ENDPOINT, {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    })

    if (!userInfoRes.ok) {
      throw new Error(`Google userinfo fetch failed: ${userInfoRes.status}`)
    }

    const userInfo = (await userInfoRes.json()) as GoogleUserInfo

    return {
      googleSub: userInfo.sub,
      email: userInfo.email,
      displayName: userInfo.name,
      avatarUrl: userInfo.picture ?? null,
    }
  }
}
