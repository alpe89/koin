import { useCallback, useEffect, useRef, useState } from 'react'
import {
  apiChangeMemberRole,
  apiCreateInvitation,
  apiListMembers,
  apiRemoveMember,
  apiRenameGroup,
  type Member,
} from '../../api/client'
import { useAuth } from '../../auth/AuthContext'
import { useGroup } from '../../auth/GroupContext'
import { Avatar } from '../../components/Avatar/Avatar'
import { BottomSheet } from '../../components/BottomSheet/BottomSheet'
import { useToast } from '../../components/Toast/Toast'
import styles from './GroupPage.module.css'

// --- Role badge ---

function RoleBadge({ role }: { role: 'owner' | 'editor' | 'viewer' }) {
  const label = role.charAt(0).toUpperCase() + role.slice(1)
  return (
    <span
      className={[styles['role-badge'], styles[`role-badge--${role}`]].join(' ')}
      aria-label={`Role: ${label}`}
    >
      {label}
    </span>
  )
}

// --- Format join date ---

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

// --- Member row ---

interface MemberRowProps {
  member: Member
  isOwner: boolean
  currentUserId: string
  groupId: string
  token: string
  onRefresh: () => void
}

function MemberRow({ member, isOwner, currentUserId, groupId, token, onRefresh }: MemberRowProps) {
  const { showToast } = useToast()
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false)
  const [isRemoving, setIsRemoving] = useState(false)
  const [isChangingRole, setIsChangingRole] = useState(false)
  const removeButtonRef = useRef<HTMLButtonElement>(null)

  const isSelf = member.userId === currentUserId
  const canManage = isOwner && member.role !== 'owner'

  const handleRoleChange = async (newRole: 'editor' | 'viewer') => {
    if (isChangingRole) return
    setIsChangingRole(true)
    try {
      await apiChangeMemberRole(token, groupId, member.userId, newRole)
      onRefresh()
      showToast('Role updated')
    } catch {
      showToast('Could not update role', 'error')
    } finally {
      setIsChangingRole(false)
    }
  }

  const handleRemove = async () => {
    setIsRemoving(true)
    try {
      await apiRemoveMember(token, groupId, member.userId)
      setShowRemoveConfirm(false)
      onRefresh()
      showToast(`${member.displayName} removed`)
    } catch {
      showToast('Could not remove member', 'error')
    } finally {
      setIsRemoving(false)
    }
  }

  return (
    <>
      <li className={styles['member-row']}>
        <Avatar displayName={member.displayName} avatarUrl={member.avatarUrl} size="md" />
        <div className={styles['member-row__info']}>
          <div className={styles['member-row__name']}>
            {member.displayName}
            {isSelf && <span className="sr-only"> (you)</span>}
          </div>
          <div className={styles['member-row__meta']}>Joined {formatDate(member.joinedAt)}</div>
        </div>

        <div className={styles['member-row__actions']}>
          {canManage ? (
            <div className={styles['inline-role']}>
              <label className="sr-only" htmlFor={`role-${member.userId}`}>
                Role for {member.displayName}
              </label>
              <select
                id={`role-${member.userId}`}
                className={styles['role-select-inline']}
                value={member.role}
                disabled={isChangingRole}
                onChange={(e) => handleRoleChange(e.target.value as 'editor' | 'viewer')}
                aria-label={`Change role for ${member.displayName}`}
              >
                <option value="editor">Editor</option>
                <option value="viewer">Viewer</option>
              </select>

              <button
                ref={removeButtonRef}
                className={[styles['icon-btn'], styles['icon-btn--danger']].join(' ')}
                onClick={() => setShowRemoveConfirm(true)}
                aria-label={`Remove ${member.displayName}`}
              >
                <span className="material-symbols-outlined" aria-hidden="true">
                  person_remove
                </span>
              </button>
            </div>
          ) : (
            <RoleBadge role={member.role} />
          )}
        </div>
      </li>

      <BottomSheet
        isOpen={showRemoveConfirm}
        onClose={() => setShowRemoveConfirm(false)}
        title={`Remove ${member.displayName}?`}
        returnFocusRef={removeButtonRef}
      >
        <p className={styles['confirm-body']}>
          They will lose access to this group immediately. Their past transactions will remain
          visible to other members.
        </p>
        <div className={styles['confirm-actions']}>
          <button
            className={styles['btn-danger']}
            onClick={handleRemove}
            disabled={isRemoving}
            aria-busy={isRemoving}
          >
            {isRemoving ? 'Removing…' : 'Remove member'}
          </button>
          <button className={styles['btn-cancel']} onClick={() => setShowRemoveConfirm(false)}>
            Cancel
          </button>
        </div>
      </BottomSheet>
    </>
  )
}

// --- Group Settings Sheet ---

interface GroupSettingsSheetProps {
  isOpen: boolean
  onClose: () => void
  groupId: string
  groupName: string
  token: string
  onRenamed: (newName: string) => void
  returnFocusRef: React.RefObject<HTMLButtonElement | null>
}

function GroupSettingsSheet({
  isOpen,
  onClose,
  groupId,
  groupName,
  token,
  onRenamed,
  returnFocusRef,
}: GroupSettingsSheetProps) {
  const { showToast } = useToast()
  const [name, setName] = useState(groupName)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  // Sync when groupName changes (sheet re-opened)
  useEffect(() => {
    if (isOpen) setName(groupName)
  }, [isOpen, groupName])

  const handleSave = async () => {
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
      await apiRenameGroup(token, groupId, trimmed)
      onRenamed(trimmed)
      showToast('Group renamed')
      onClose()
    } catch {
      setError('Could not save. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Group settings"
      returnFocusRef={returnFocusRef}
    >
      <form
        className={styles['settings-form']}
        onSubmit={(e) => {
          e.preventDefault()
          void handleSave()
        }}
      >
        <div className={styles['form-field']}>
          <label htmlFor="group-name" className={styles['form-field__label']}>
            Group name
          </label>
          <input
            id="group-name"
            type="text"
            className={styles['form-field__input']}
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={100}
            placeholder="e.g. Smith Family"
            aria-describedby={error ? 'group-name-error' : undefined}
            aria-invalid={error ? 'true' : undefined}
          />
          {error && (
            <span id="group-name-error" className={styles['form-field__error']} role="alert">
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
          {isSaving ? 'Saving…' : 'Save changes'}
        </button>
        <button type="button" className={styles['btn-cancel']} onClick={onClose}>
          Cancel
        </button>
      </form>
    </BottomSheet>
  )
}

// --- Invite Section ---

interface InviteSectionProps {
  groupId: string
  token: string
}

function InviteSection({ groupId, token }: InviteSectionProps) {
  const { showToast } = useToast()
  const [role, setRole] = useState<'editor' | 'viewer'>('editor')
  const [isLoading, setIsLoading] = useState(false)

  const handleCopyLink = async () => {
    setIsLoading(true)
    try {
      const invitation = await apiCreateInvitation(token, groupId, role)
      await navigator.clipboard.writeText(invitation.inviteUrl)
      showToast('Invite link copied — share it with whoever you want to invite')
    } catch {
      showToast('Could not generate invite link', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={styles.invite}>
      <p className={styles['invite__description']}>
        Share a link to invite someone. The link can only be used once and expires in 48 hours.
      </p>
      <div className={styles['invite__controls']}>
        <label className="sr-only" htmlFor="invite-role">
          Invite as
        </label>
        <select
          id="invite-role"
          className={styles['invite__role-select']}
          value={role}
          onChange={(e) => setRole(e.target.value as 'editor' | 'viewer')}
          aria-label="Role for invited member"
        >
          <option value="editor">Editor</option>
          <option value="viewer">Viewer</option>
        </select>

        <button
          className={styles['invite__copy-btn']}
          onClick={handleCopyLink}
          disabled={isLoading}
          aria-busy={isLoading}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }} aria-hidden="true">
            link
          </span>
          {isLoading ? 'Generating…' : 'Copy invite link'}
        </button>
      </div>
    </div>
  )
}

// --- Main Group Page ---

export function GroupPage() {
  const { token, user } = useAuth()
  const { activeGroup, refreshGroups } = useGroup()
  const { showToast } = useToast()

  const [members, setMembers] = useState<Member[]>([])
  const [isMembersLoading, setIsMembersLoading] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const settingsBtnRef = useRef<HTMLButtonElement>(null)

  const [groupName, setGroupName] = useState(activeGroup?.name ?? '')

  useEffect(() => {
    setGroupName(activeGroup?.name ?? '')
  }, [activeGroup?.name])

  const loadMembers = useCallback(async () => {
    if (!token || !activeGroup) return
    setIsMembersLoading(true)
    try {
      const list = await apiListMembers(token, activeGroup.id)
      setMembers(list)
    } catch {
      showToast('Could not load members', 'error')
    } finally {
      setIsMembersLoading(false)
    }
  }, [token, activeGroup, showToast])

  useEffect(() => {
    void loadMembers()
  }, [loadMembers])

  const handleRenamed = (newName: string) => {
    setGroupName(newName)
    void refreshGroups()
  }

  if (!activeGroup || !token || !user) {
    return <div className={styles.loading}>Loading…</div>
  }

  const isOwner = activeGroup.role === 'owner'

  return (
    <>
      {/* Top app bar */}
      <header className={styles['top-bar']}>
        <h1 className={styles['top-bar__title']}>{groupName}</h1>
        {isOwner && (
          <button
            ref={settingsBtnRef}
            className={styles['top-bar__action']}
            onClick={() => setSettingsOpen(true)}
            aria-label="Group settings"
          >
            <span className="material-symbols-outlined" aria-hidden="true">
              settings
            </span>
          </button>
        )}
      </header>

      <div className={styles.page}>
        {/* Invite section — owner only */}
        {isOwner && (
          <section className={styles.section} aria-labelledby="invite-heading">
            <h2 id="invite-heading" className={styles['section__heading']}>
              Invite someone
            </h2>
            <InviteSection groupId={activeGroup.id} token={token} />
          </section>
        )}

        {/* Members section */}
        <section className={styles.section} aria-labelledby="members-heading">
          <h2 id="members-heading" className={styles['section__heading']}>
            Members
          </h2>

          {isMembersLoading ? (
            <div className={styles.loading}>Loading members…</div>
          ) : members.length === 0 ? (
            <p className={styles.empty}>Just you here. Copy an invite link to add someone.</p>
          ) : (
            <ul className={styles['member-list']} aria-label="Group members">
              {members.map((member) => (
                <MemberRow
                  key={member.userId}
                  member={member}
                  isOwner={isOwner}
                  currentUserId={user.id}
                  groupId={activeGroup.id}
                  token={token}
                  onRefresh={loadMembers}
                />
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Group settings sheet */}
      {isOwner && (
        <GroupSettingsSheet
          isOpen={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          groupId={activeGroup.id}
          groupName={groupName}
          token={token}
          onRenamed={handleRenamed}
          returnFocusRef={settingsBtnRef}
        />
      )}
    </>
  )
}
