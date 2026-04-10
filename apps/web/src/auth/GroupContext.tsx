import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { apiListGroups, type Group } from '../api/client'
import { useAuth } from './AuthContext'

interface GroupContextValue {
  groups: Group[]
  activeGroup: Group | null
  isLoading: boolean
  switchGroup: (groupId: string) => void
  refreshGroups: () => Promise<void>
}

const GroupContext = createContext<GroupContextValue | null>(null)

export function GroupProvider({ children }: { children: ReactNode }) {
  const { token, user } = useAuth()
  const [groups, setGroups] = useState<Group[]>([])
  const [activeGroup, setActiveGroup] = useState<Group | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const fetchGroups = useCallback(async () => {
    if (!token) {
      setGroups([])
      setActiveGroup(null)
      return
    }

    setIsLoading(true)
    try {
      const list = await apiListGroups(token)
      setGroups(list)

      // Pick the active group:
      // 1. The user's defaultGroupId (if in the list)
      // 2. The first group otherwise
      const preferred = user?.defaultGroupId
        ? list.find((g) => g.id === user.defaultGroupId) ?? list[0]
        : list[0]

      setActiveGroup((current) => {
        // If we already have an active group that still exists, keep it
        if (current) {
          const still = list.find((g) => g.id === current.id)
          return still ?? preferred ?? null
        }
        return preferred ?? null
      })
    } finally {
      setIsLoading(false)
    }
  }, [token, user?.defaultGroupId])

  useEffect(() => {
    void fetchGroups()
  }, [fetchGroups])

  const switchGroup = useCallback(
    (groupId: string) => {
      const group = groups.find((g) => g.id === groupId)
      if (group) setActiveGroup(group)
    },
    [groups],
  )

  const refreshGroups = useCallback(async () => {
    await fetchGroups()
  }, [fetchGroups])

  return (
    <GroupContext.Provider value={{ groups, activeGroup, isLoading, switchGroup, refreshGroups }}>
      {children}
    </GroupContext.Provider>
  )
}

export function useGroup(): GroupContextValue {
  const ctx = useContext(GroupContext)
  if (!ctx) throw new Error('useGroup must be used inside GroupProvider')
  return ctx
}
