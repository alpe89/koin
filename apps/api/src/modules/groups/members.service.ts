import type { Pool } from 'pg'
import type { GroupMember, InvitationRole } from '@koin/shared'
import { eventBus } from '../../infrastructure/events/event-bus.ts'

export function buildMembersService(db: Pool) {
  async function listMembers(groupId: string): Promise<GroupMember[]> {
    const result = await db.query<{
      user_id: string
      display_name: string
      avatar_url: string | null
      role: string
      joined_at: Date
    }>(
      `SELECT
         gm.user_id,
         u.display_name,
         u.avatar_url,
         gm.role,
         gm.joined_at
       FROM group_members gm
       JOIN users u ON u.id = gm.user_id
       WHERE gm.group_id = $1 AND gm.removed_at IS NULL
       ORDER BY gm.joined_at ASC`,
      [groupId],
    )

    return result.rows.map((row) => ({
      userId: row.user_id,
      displayName: row.display_name,
      avatarUrl: row.avatar_url,
      role: row.role as GroupMember['role'],
      joinedAt: row.joined_at.toISOString(),
    }))
  }

  async function changeRole(
    groupId: string,
    userId: string,
    role: InvitationRole,
  ): Promise<GroupMember | null> {
    const result = await db.query<{
      user_id: string
      display_name: string
      avatar_url: string | null
      role: string
      joined_at: Date
    }>(
      `UPDATE group_members gm
       SET role = $1
       FROM users u
       WHERE gm.group_id = $2
         AND gm.user_id = $3
         AND gm.removed_at IS NULL
         AND u.id = gm.user_id
       RETURNING gm.user_id, u.display_name, u.avatar_url, gm.role, gm.joined_at`,
      [role, groupId, userId],
    )

    const row = result.rows[0]
    if (!row) return null

    return {
      userId: row.user_id,
      displayName: row.display_name,
      avatarUrl: row.avatar_url,
      role: row.role as GroupMember['role'],
      joinedAt: row.joined_at.toISOString(),
    }
  }

  async function removeMember(groupId: string, userId: string): Promise<boolean> {
    const client = await db.connect()
    try {
      await client.query('BEGIN')

      // Soft-delete the membership
      const removeResult = await client.query(
        `UPDATE group_members
         SET removed_at = now()
         WHERE group_id = $1 AND user_id = $2 AND removed_at IS NULL`,
        [groupId, userId],
      )

      if (removeResult.rowCount === 0) {
        await client.query('ROLLBACK')
        return false
      }

      // Deactivate all recurring rules owned by removed member in this group
      await client.query(
        `UPDATE recurring_rules
         SET is_active = false
         WHERE group_id = $1 AND created_by = $2 AND is_active = true`,
        [groupId, userId],
      )

      // Clear default_group_id if it points to this group
      await client.query(
        `UPDATE users
         SET default_group_id = NULL, updated_at = now()
         WHERE id = $1 AND default_group_id = $2`,
        [userId, groupId],
      )

      await client.query('COMMIT')

      // Publish domain event (for future subscribers like recurring.handlers)
      eventBus.publish('member.removed', { groupId, userId })

      return true
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }
  }

  return { listMembers, changeRole, removeMember }
}

export type MembersService = ReturnType<typeof buildMembersService>
