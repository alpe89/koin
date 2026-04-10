import type { FastifyRequest, FastifyReply, preHandlerHookHandler } from 'fastify'
import type { Pool } from 'pg'
import type { MemberRole } from '@koin/shared'

/**
 * Resolves group membership and role from DB.
 * Must run after `authenticate` — depends on `request.user` being set.
 * Attaches `request.groupMember` or returns 403.
 */
export function requireGroupMember(db: Pool): preHandlerHookHandler {
  return async function (request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const params = request.params as Record<string, string | undefined>
    const groupId = params['groupId']

    if (!groupId) {
      return reply.status(400).send({
        error: { code: 'MISSING_GROUP_ID', message: 'groupId path parameter required' },
      })
    }

    const userId = request.user.id

    const result = await db.query<{ role: MemberRole }>(
      `SELECT role FROM group_members
       WHERE group_id = $1 AND user_id = $2 AND removed_at IS NULL`,
      [groupId, userId],
    )

    const row = result.rows[0]
    if (!row) {
      return reply.status(403).send({
        error: { code: 'NOT_A_MEMBER', message: 'You are not a member of this group' },
      })
    }

    request.groupMember = {
      groupId,
      userId,
      role: row.role,
    }
  }
}
