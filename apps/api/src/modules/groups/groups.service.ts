import type { Pool } from 'pg'
import type { Group, GroupListItem } from '@koin/shared'
import { seedGroupCategories } from '../auth/auth.service.ts'

export function buildGroupsService(db: Pool) {
  async function createGroup(
    userId: string,
    name: string,
  ): Promise<Group> {
    const client = await db.connect()
    try {
      await client.query('BEGIN')

      const groupResult = await client.query<{
        id: string
        name: string
        owner_id: string
        created_at: Date
      }>(
        `INSERT INTO groups (name, owner_id) VALUES ($1, $2)
         RETURNING id, name, owner_id, created_at`,
        [name.trim(), userId],
      )

      const group = groupResult.rows[0]
      if (!group) throw new Error('Failed to create group')

      // Creator becomes owner
      await client.query(
        `INSERT INTO group_members (group_id, user_id, role) VALUES ($1, $2, 'owner')`,
        [group.id, userId],
      )

      // Seed default categories
      await seedGroupCategories(client, group.id)

      await client.query('COMMIT')

      return {
        id: group.id,
        name: group.name,
        ownerId: group.owner_id,
        createdAt: group.created_at.toISOString(),
      }
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }
  }

  async function listGroups(userId: string): Promise<GroupListItem[]> {
    const result = await db.query<{
      id: string
      name: string
      owner_id: string
      role: string
      member_count: string
      created_at: Date
    }>(
      `SELECT
         g.id,
         g.name,
         g.owner_id,
         gm.role,
         COUNT(gm2.id) AS member_count,
         g.created_at
       FROM active_groups g
       JOIN group_members gm ON gm.group_id = g.id AND gm.user_id = $1 AND gm.removed_at IS NULL
       JOIN group_members gm2 ON gm2.group_id = g.id AND gm2.removed_at IS NULL
       GROUP BY g.id, g.name, g.owner_id, gm.role, g.created_at
       ORDER BY g.created_at ASC`,
      [userId],
    )

    return result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      ownerId: row.owner_id,
      role: row.role as GroupListItem['role'],
      memberCount: parseInt(row.member_count, 10),
      createdAt: row.created_at.toISOString(),
    }))
  }

  async function getGroup(
    groupId: string,
    userId: string,
  ): Promise<(Group & { role: string }) | null> {
    const result = await db.query<{
      id: string
      name: string
      owner_id: string
      role: string
      created_at: Date
    }>(
      `SELECT
         g.id,
         g.name,
         g.owner_id,
         gm.role,
         g.created_at
       FROM active_groups g
       JOIN group_members gm ON gm.group_id = g.id AND gm.user_id = $2 AND gm.removed_at IS NULL
       WHERE g.id = $1`,
      [groupId, userId],
    )

    const row = result.rows[0]
    if (!row) return null

    return {
      id: row.id,
      name: row.name,
      ownerId: row.owner_id,
      role: row.role,
      createdAt: row.created_at.toISOString(),
    }
  }

  async function renameGroup(
    groupId: string,
    name: string,
  ): Promise<Group | null> {
    const result = await db.query<{
      id: string
      name: string
      owner_id: string
      created_at: Date
    }>(
      `UPDATE groups SET name = $1, updated_at = now()
       WHERE id = $2 AND deleted_at IS NULL
       RETURNING id, name, owner_id, created_at`,
      [name.trim(), groupId],
    )

    const row = result.rows[0]
    if (!row) return null

    return {
      id: row.id,
      name: row.name,
      ownerId: row.owner_id,
      createdAt: row.created_at.toISOString(),
    }
  }

  return { createGroup, listGroups, getGroup, renameGroup }
}

export type GroupsService = ReturnType<typeof buildGroupsService>
