import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import type { GroupsService } from './groups.service.ts'
import type { MembersService } from './members.service.ts'
import type { InvitationsService } from './invitations.service.ts'
import type { JwtService } from '../../infrastructure/jwt/jwt.port.ts'
import type { Pool } from 'pg'
import { authenticate } from '../../hooks/authenticate.ts'
import { requireGroupMember } from '../../hooks/require-group-member.ts'

// Validation schemas
const createGroupSchema = z.object({
  name: z.string().min(1).max(100).trim(),
})

const updateGroupSchema = z.object({
  name: z.string().min(1).max(100).trim(),
})

const updateMemberRoleSchema = z.object({
  role: z.enum(['editor', 'viewer']),
})

const createInvitationSchema = z.object({
  role: z.enum(['editor', 'viewer']),
})

const uuidSchema = z.string().uuid()

export async function groupRoutes(
  fastify: FastifyInstance,
  opts: {
    groupsService: GroupsService
    membersService: MembersService
    invitationsService: InvitationsService
    jwtService: JwtService
    db: Pool
  },
): Promise<void> {
  const { groupsService, membersService, invitationsService, jwtService, db } = opts
  const auth = authenticate(jwtService)
  const member = requireGroupMember(db)

  // POST /api/v1/groups — create group
  fastify.post('/groups', {
    preHandler: [auth],
    handler: async (request, reply) => {
      const parse = createGroupSchema.safeParse(request.body)
      if (!parse.success) {
        return reply.status(422).send({
          error: { code: 'VALIDATION_ERROR', message: parse.error.message },
        })
      }
      const group = await groupsService.createGroup(request.user.id, parse.data.name)
      return reply.status(201).send(group)
    },
  })

  // GET /api/v1/groups — list groups for authenticated user
  fastify.get('/groups', {
    preHandler: [auth],
    handler: async (request, reply) => {
      const groups = await groupsService.listGroups(request.user.id)
      return reply.send(groups)
    },
  })

  // GET /api/v1/groups/:groupId — group detail
  fastify.get<{ Params: { groupId: string } }>('/groups/:groupId', {
    preHandler: [auth, member],
    handler: async (request, reply) => {
      const { groupId } = request.params
      if (!uuidSchema.safeParse(groupId).success) {
        return reply.status(400).send({
          error: { code: 'INVALID_UUID', message: 'groupId must be a valid UUID' },
        })
      }
      const group = await groupsService.getGroup(groupId, request.user.id)
      if (!group) {
        return reply.status(404).send({
          error: { code: 'GROUP_NOT_FOUND', message: 'Group not found' },
        })
      }
      return reply.send(group)
    },
  })

  // PATCH /api/v1/groups/:groupId — rename group (owner only)
  fastify.patch<{ Params: { groupId: string } }>('/groups/:groupId', {
    preHandler: [auth, member],
    handler: async (request, reply) => {
      const { groupId } = request.params
      if (!uuidSchema.safeParse(groupId).success) {
        return reply.status(400).send({
          error: { code: 'INVALID_UUID', message: 'groupId must be a valid UUID' },
        })
      }
      if (request.groupMember.role !== 'owner') {
        return reply.status(403).send({
          error: { code: 'FORBIDDEN', message: 'Only the owner can rename the group' },
        })
      }
      const parse = updateGroupSchema.safeParse(request.body)
      if (!parse.success) {
        return reply.status(422).send({
          error: { code: 'VALIDATION_ERROR', message: parse.error.message },
        })
      }
      const group = await groupsService.renameGroup(groupId, parse.data.name)
      if (!group) {
        return reply.status(404).send({
          error: { code: 'GROUP_NOT_FOUND', message: 'Group not found' },
        })
      }
      return reply.send(group)
    },
  })

  // GET /api/v1/groups/:groupId/members — list active members
  fastify.get<{ Params: { groupId: string } }>('/groups/:groupId/members', {
    preHandler: [auth, member],
    handler: async (request, reply) => {
      const { groupId } = request.params
      if (!uuidSchema.safeParse(groupId).success) {
        return reply.status(400).send({
          error: { code: 'INVALID_UUID', message: 'groupId must be a valid UUID' },
        })
      }
      const members = await membersService.listMembers(groupId)
      return reply.send(members)
    },
  })

  // PATCH /api/v1/groups/:groupId/members/:userId — change role (owner only)
  fastify.patch<{ Params: { groupId: string; userId: string } }>(
    '/groups/:groupId/members/:userId',
    {
      preHandler: [auth, member],
      handler: async (request, reply) => {
        const { groupId, userId } = request.params

        if (!uuidSchema.safeParse(groupId).success || !uuidSchema.safeParse(userId).success) {
          return reply.status(400).send({
            error: { code: 'INVALID_UUID', message: 'Path parameters must be valid UUIDs' },
          })
        }
        if (request.groupMember.role !== 'owner') {
          return reply.status(403).send({
            error: { code: 'FORBIDDEN', message: 'Only the owner can change member roles' },
          })
        }
        // Cannot change the owner's own role via this endpoint
        if (userId === request.user.id) {
          return reply.status(409).send({
            error: { code: 'CANNOT_CHANGE_OWN_ROLE', message: 'Cannot change your own role' },
          })
        }

        const parse = updateMemberRoleSchema.safeParse(request.body)
        if (!parse.success) {
          return reply.status(422).send({
            error: { code: 'VALIDATION_ERROR', message: parse.error.message },
          })
        }

        const updated = await membersService.changeRole(groupId, userId, parse.data.role)
        if (!updated) {
          return reply.status(404).send({
            error: { code: 'MEMBER_NOT_FOUND', message: 'Member not found in this group' },
          })
        }
        return reply.send(updated)
      },
    },
  )

  // DELETE /api/v1/groups/:groupId/members/:userId — remove member (owner only)
  fastify.delete<{ Params: { groupId: string; userId: string } }>(
    '/groups/:groupId/members/:userId',
    {
      preHandler: [auth, member],
      handler: async (request, reply) => {
        const { groupId, userId } = request.params

        if (!uuidSchema.safeParse(groupId).success || !uuidSchema.safeParse(userId).success) {
          return reply.status(400).send({
            error: { code: 'INVALID_UUID', message: 'Path parameters must be valid UUIDs' },
          })
        }
        if (request.groupMember.role !== 'owner') {
          return reply.status(403).send({
            error: { code: 'FORBIDDEN', message: 'Only the owner can remove members' },
          })
        }
        // Cannot remove yourself
        if (userId === request.user.id) {
          return reply.status(409).send({
            error: { code: 'CANNOT_REMOVE_SELF', message: 'Owner cannot remove themselves' },
          })
        }

        const removed = await membersService.removeMember(groupId, userId)
        if (!removed) {
          return reply.status(404).send({
            error: { code: 'MEMBER_NOT_FOUND', message: 'Member not found in this group' },
          })
        }
        return reply.status(204).send()
      },
    },
  )

  // POST /api/v1/groups/:groupId/invitations — create invite (owner only)
  fastify.post<{ Params: { groupId: string } }>('/groups/:groupId/invitations', {
    preHandler: [auth, member],
    handler: async (request, reply) => {
      const { groupId } = request.params

      if (!uuidSchema.safeParse(groupId).success) {
        return reply.status(400).send({
          error: { code: 'INVALID_UUID', message: 'groupId must be a valid UUID' },
        })
      }
      if (request.groupMember.role !== 'owner') {
        return reply.status(403).send({
          error: { code: 'FORBIDDEN', message: 'Only the owner can create invitations' },
        })
      }

      const parse = createInvitationSchema.safeParse(request.body)
      if (!parse.success) {
        return reply.status(422).send({
          error: { code: 'VALIDATION_ERROR', message: parse.error.message },
        })
      }

      const invitation = await invitationsService.createInvitation(
        groupId,
        request.user.id,
        parse.data.role,
      )
      return reply.status(201).send(invitation)
    },
  })
}

export async function invitationRoutes(
  fastify: FastifyInstance,
  opts: {
    invitationsService: InvitationsService
    jwtService: JwtService
  },
): Promise<void> {
  const { invitationsService, jwtService } = opts
  const auth = authenticate(jwtService)

  // GET /api/v1/invitations/:token — public, preview before accepting
  fastify.get<{ Params: { token: string } }>('/invitations/:token', {
    handler: async (request, reply) => {
      const { token } = request.params
      const preview = await invitationsService.getInvitationPreview(token)
      if (!preview) {
        return reply.status(404).send({
          error: { code: 'INVITATION_NOT_FOUND', message: 'Invitation not found or expired' },
        })
      }
      return reply.send(preview)
    },
  })

  // POST /api/v1/invitations/:token/accept — authenticated
  fastify.post<{ Params: { token: string } }>('/invitations/:token/accept', {
    preHandler: [auth],
    handler: async (request, reply) => {
      const { token } = request.params
      const outcome = await invitationsService.acceptInvitation(token, request.user.id)

      if ('notFound' in outcome) {
        return reply.status(404).send({
          error: { code: 'INVITATION_NOT_FOUND', message: 'Invitation not found or expired' },
        })
      }
      if ('conflict' in outcome) {
        return reply.status(409).send({
          error: { code: 'ALREADY_A_MEMBER', message: 'You are already a member of this group' },
        })
      }
      return reply.send(outcome.result)
    },
  })
}
