import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { clearToken, getToken, setToken } from './storage'

export interface User {
  id: string
  email: string
  displayName: string
  avatarUrl: string | null
  defaultGroupId: string | null
}

interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
}

interface AuthContextValue extends AuthState {
  signIn: (token: string) => Promise<void>
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
  updateDefaultGroup: (groupId: string | null) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

const AUTH_ME_URL = `${import.meta.env.VITE_API_URL ?? ''}/api/v1/auth/me`
const AUTH_SIGNOUT_URL = `${import.meta.env.VITE_API_URL ?? ''}/api/v1/auth/signout`

async function fetchMe(token: string): Promise<User> {
  const res = await fetch(AUTH_ME_URL, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) {
    throw new Error('Failed to fetch user profile')
  }
  return res.json() as Promise<User>
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isLoading: true,
  })

  // Track mounted state to avoid state updates after unmount
  const mountedRef = useRef(true)
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  // Bootstrap: read stored token and fetch user profile
  useEffect(() => {
    let cancelled = false

    async function bootstrap() {
      const storedToken = await getToken()

      if (!storedToken) {
        if (!cancelled && mountedRef.current) {
          setState({ user: null, token: null, isLoading: false })
        }
        return
      }

      try {
        const user = await fetchMe(storedToken)
        if (!cancelled && mountedRef.current) {
          setState({ user, token: storedToken, isLoading: false })
        }
      } catch {
        // Token invalid or expired — clear it
        await clearToken()
        if (!cancelled && mountedRef.current) {
          setState({ user: null, token: null, isLoading: false })
        }
      }
    }

    void bootstrap()

    return () => {
      cancelled = true
    }
  }, [])

  const signIn = useCallback(async (token: string) => {
    await setToken(token)
    const user = await fetchMe(token)
    if (mountedRef.current) {
      setState({ user, token, isLoading: false })
    }
  }, [])

  const signOut = useCallback(async () => {
    const { token } = state
    if (token) {
      // Fire and forget — server is stateless; we clear local state regardless
      try {
        await fetch(AUTH_SIGNOUT_URL, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        })
      } catch {
        // ignore network errors during sign-out
      }
    }
    await clearToken()
    if (mountedRef.current) {
      setState({ user: null, token: null, isLoading: false })
    }
  }, [state])

  const refreshUser = useCallback(async () => {
    const { token } = state
    if (!token) return
    try {
      const user = await fetchMe(token)
      if (mountedRef.current) {
        setState((prev) => ({ ...prev, user }))
      }
    } catch {
      // token may have expired
      await clearToken()
      if (mountedRef.current) {
        setState({ user: null, token: null, isLoading: false })
      }
    }
  }, [state])

  const updateDefaultGroup = useCallback((groupId: string | null) => {
    setState((prev) =>
      prev.user ? { ...prev, user: { ...prev.user, defaultGroupId: groupId } } : prev,
    )
  }, [])

  return (
    <AuthContext.Provider value={{ ...state, signIn, signOut, refreshUser, updateDefaultGroup }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
