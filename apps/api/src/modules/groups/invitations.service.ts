import { randomBytes } from 'node:crypto'
import type { Pool } from 'pg'
import type { GroupInvitation, InvitationPreview, InvitationAcceptResult, InvitationRole } from '@koin/shared'

const INVITE_EXPIRY_HOURS = 48

export function buildInvitationsService(db: Pool, appUrl: string) {
  async function createInvitation(
    groupId: string,
    createdBy: string,
    role: InvitationRole,
  ): Promise<GroupInvitation> {
    const token = randomBytes(32).toString('base64url')
    const expiresAt = new Date(Date.now() + INVITE_EXPIRY_HOURS * 60 * 60 * 1000)

    const result = await db.query<{
      id: string
      token: string
      role: string
      expires_at: Date
    }>(
      `INSERT INTO group_invitations (group_id, token, role, created_by, expires_at)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, token, role, expires_at`,
      [groupId, token, role, createdBy, expiresAt],
    )

    const row = result.rows[0]
    if (!row) throw new Error('Failed to create invitation')

    return {
      id: row.id,
      token: row.token,
      inviteUrl: `${appUrl}/join?token=${row.token}`,
      role: row.role as InvitationRole,
      expiresAt: row.expires_at.toISOString(),
    }
  }

  async function getInvitationPreview(token: string): Promise<InvitationPreview | null> {
    const result = await db.query<{
      group_name: string
      role: string
      invited_by: string
      expires_at: Date
    }>(
      `SELECT
         g.name AS group_name,
         gi.role,
         u.display_name AS invited_by,
         gi.expires_at
       FROM group_invitations gi
       JOIN groups g ON g.id = gi.group_id
       JOIN users u ON u.id = gi.created_by
       WHERE gi.token = $1
         AND gi.used_at IS NULL
         AND gi.expires_at > now()`,
      [token],
    )

    const row = result.rows[0]
    if (!row) return null

    return {
      groupName: row.group_name,
      role: row.role as InvitationRole,
      invitedBy: row.invited_by,
      expiresAt: row.expires_at.toISOString(),
    }
  }

  async function acceptInvitation(
    token: string,
    userId: string,
  ): Promise<{ result: InvitationAcceptResult } | { conflict: true } | { notFound: true }> {
    const client = await db.connect()
    try {
      await client.query('BEGIN')

      // Lock the invitation row to prevent concurrent accepts
      const inviteResult = await client.query<{
        id: string
        group_id: string
        role: string
        expires_at: Date
        used_at: Date | null
      }>(
        `SELECT id, group_id, role, expires_at, used_at
         FROM group_invitations
         WHERE token = $1
         FOR UPDATE`,
        [token],
      )

      const invite = inviteResult.rows[0]

      // Token not found, already used, or expired → 404
      if (!invite || invite.used_at !== null || invite.expires_at < new Date()) {
        await client.query('ROLLBACK')
        return { notFound: true }
      }

      // Check if user is already an active member
      const memberCheck = await client.query(
        `SELECT 1 FROM group_members
         WHERE group_id = $1 AND user_id = $2 AND removed_at IS NULL`,
        [invite.group_id, userId],
      )

      if ((memberCheck.rowCount ?? 0) > 0) {
        await client.query('ROLLBACK')
        return { conflict: true }
      }

      // Insert group membership
      await client.query(
        `INSERT INTO group_members (group_id, user_id, role)
         VALUES ($1, $2, $3)`,
        [invite.group_id, userId, invite.role],
      )

      // Mark token as used
      await client.query(
        `UPDATE group_invitations
         SET used_by = $1, used_at = now()
         WHERE id = $2`,
        [userId, invite.id],
      )

      // Fetch group name for response
      const groupResult = await client.query<{ name: string }>(
        `SELECT name FROM groups WHERE id = $1`,
        [invite.group_id],
      )

      await client.query('COMMIT')

      const groupName = groupResult.rows[0]?.name ?? ''

      return {
        result: {
          groupId: invite.group_id,
          groupName,
          role: invite.role as InvitationRole,
        },
      }
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }
  }

  return { createInvitation, getInvitationPreview, acceptInvitation }
}

export type InvitationsService = ReturnType<typeof buildInvitationsService>
