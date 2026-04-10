import type { Pool } from 'pg'
import type { User } from '@koin/shared'
import type { UpdateUserInput } from './users.types.ts'

export function buildUsersService(db: Pool) {
  async function updateUser(userId: string, input: UpdateUserInput): Promise<User | null> {
    // Build SET clause dynamically — only update provided fields
    const sets: string[] = ['updated_at = now()']
    const values: unknown[] = []
    let paramIdx = 1

    if (input.displayName !== undefined) {
      sets.push(`display_name = $${paramIdx++}`)
      values.push(input.displayName)
    }

    if ('defaultGroupId' in input) {
      sets.push(`default_group_id = $${paramIdx++}`)
      values.push(input.defaultGroupId ?? null)
    }

    values.push(userId) // last param for WHERE clause

    const result = await db.query<{
      id: string
      email: string
      display_name: string
      avatar_url: string | null
      default_group_id: string | null
    }>(
      `UPDATE users
       SET ${sets.join(', ')}
       WHERE id = $${paramIdx}
       RETURNING id, email, display_name, avatar_url, default_group_id`,
      values,
    )

    const row = result.rows[0]
    if (!row) return null

    return {
      id: row.id,
      email: row.email,
      displayName: row.display_name,
      avatarUrl: row.avatar_url,
      defaultGroupId: row.default_group_id,
    }
  }

  async function isActiveMember(userId: string, groupId: string): Promise<boolean> {
    const result = await db.query(
      `SELECT 1 FROM group_members
       WHERE user_id = $1 AND group_id = $2 AND removed_at IS NULL`,
      [userId, groupId],
    )
    return (result.rowCount ?? 0) > 0
  }

  return { updateUser, isActiveMember }
}

export type UsersService = ReturnType<typeof buildUsersService>
