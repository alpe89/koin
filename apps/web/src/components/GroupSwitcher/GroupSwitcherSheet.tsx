import { useRef, useState } from 'react'
import { useAuth } from '../../auth/AuthContext'
import { useGroup } from '../../auth/GroupContext'
import { BottomSheet } from '../BottomSheet/BottomSheet'
import { apiCreateGroup, apiUpdateMe } from '../../api/client'
import { useToast } from '../Toast/Toast'
import styles from './GroupSwitcherSheet.module.css'

// ---- Create Group inline form ----

interface CreateGroupFormProps {
  token: string
  onCreated: () => void
  onCancel: () => void
}

function CreateGroupForm({ token, onCreated, onCancel }: CreateGroupFormProps) {
  const [name, setName] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const { showToast } = useToast()
  const { refreshGroups } = useGroup()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) {
      setError('Group name cannot be empty')
      return
    }
    if (trimmed.length > 100) {
      setError('Group name must be 100 characters or less')
      return
    }
    setError('')
    setIsSaving(true)
    try {
      await apiCreateGroup(token, trimmed)
      await refreshGroups()
      showToast('Group created')
      onCreated()
    } catch {
      setError('Could not create group. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form className={styles['create-form']} onSubmit={handleSubmit}>
      <div className={styles['form-field']}>
        <label htmlFor="new-group-name" className={styles['form-field__label']}>
          Group name
        </label>
        <input
          id="new-group-name"
          type="text"
          className={styles['form-field__input']}
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={100}
          placeholder="e.g. Smith Family"
          autoFocus
          aria-describedby={error ? 'new-group-error' : undefined}
          aria-invalid={error ? 'true' : undefined}
        />
        {error && (
          <span id="new-group-error" className={styles['form-field__error']} role="alert">
            {error}
          </span>
        )}
      </div>
      <button
        type="submit"
        className={styles['btn-primary']}
        disabled={isSaving || !name.trim()}
        aria-busy={isSaving}
      >
        {isSaving ? 'Creating…' : 'Create group'}
      </button>
      <button type="button" className={styles['btn-cancel']} onClick={onCancel}>
        Cancel
      </button>
    </form>
  )
}

// ---- Main sheet ----

export interface GroupSwitcherSheetProps {
  isOpen: boolean
  onClose: () => void
  /** Ref to the element that triggered the sheet — focus returns here on close */
  returnFocusRef?: React.RefObject<HTMLElement | null>
}

export function GroupSwitcherSheet({
  isOpen,
  onClose,
  returnFocusRef,
}: GroupSwitcherSheetProps) {
  const { token, user, updateDefaultGroup } = useAuth()
  const { groups, activeGroup, switchGroup } = useGroup()
  const { showToast } = useToast()
  const [showCreate, setShowCreate] = useState(false)
  const createBtnRef = useRef<HTMLButtonElement>(null)

  const handleSwitch = async (groupId: string) => {
    switchGroup(groupId)
    // Persist the selection as the user's default group
    if (token && user) {
      try {
        await apiUpdateMe(token, { defaultGroupId: groupId })
        updateDefaultGroup(groupId)
      } catch {
        // Non-fatal — the group still switches locally
      }
    }
    onClose()
  }

  const handleCreated = () => {
    setShowCreate(false)
    onClose()
  }

  if (!token) return null

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={() => {
        setShowCreate(false)
        onClose()
      }}
      title={showCreate ? 'Create new group' : 'Switch group'}
      returnFocusRef={returnFocusRef}
    >
      {showCreate ? (
        <CreateGroupForm
          token={token}
          onCreated={handleCreated}
          onCancel={() => setShowCreate(false)}
        />
      ) : (
        <div className={styles.content}>
          {groups.length === 0 ? (
            <p className={styles.empty}>No groups yet.</p>
          ) : (
            <ul className={styles['group-list']} aria-label="Your groups">
              {groups.map((group) => {
                const isActive = group.id === activeGroup?.id
                return (
                  <li key={group.id}>
                    <button
                      className={[
                        styles['group-item'],
                        isActive ? styles['group-item--active'] : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      onClick={() => void handleSwitch(group.id)}
                      aria-pressed={isActive}
                    >
                      <span className={styles['group-item__name']}>{group.name}</span>
                      <span className={styles['group-item__meta']}>
                        {group.memberCount} {group.memberCount === 1 ? 'member' : 'members'}
                      </span>
                      {isActive && (
                        <span
                          className="material-symbols-outlined"
                          style={{ fontSize: '20px', color: 'var(--color-primary-on)', marginLeft: 'auto' }}
                          aria-hidden="true"
                        >
                          check
                        </span>
                      )}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}

          <div className={styles.divider} />

          <button
            ref={createBtnRef}
            className={styles['create-row']}
            onClick={() => setShowCreate(true)}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: '20px' }}
              aria-hidden="true"
            >
              add_circle
            </span>
            Create new group
          </button>
        </div>
      )}
    </BottomSheet>
  )
}
