import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import type { UsersService } from './users.service.ts'
import type { JwtService } from '../../infrastructure/jwt/jwt.port.ts'
import { authenticate } from '../../hooks/authenticate.ts'

const updateUserSchema = z.object({
  displayName: z.string().min(1).max(100).optional(),
  defaultGroupId: z.string().uuid().nullable().optional(),
})

export async function userRoutes(
  fastify: FastifyInstance,
  opts: { usersService: UsersService; jwtService: JwtService },
): Promise<void> {
  const { usersService, jwtService } = opts
  const auth = authenticate(jwtService)

  // PATCH /api/v1/users/me — update own profile
  fastify.patch('/users/me', {
    preHandler: [auth],
    handler: async (request, reply) => {
      const parse = updateUserSchema.safeParse(request.body)
      if (!parse.success) {
        return reply.status(422).send({
          error: { code: 'VALIDATION_ERROR', message: parse.error.message },
        })
      }

      const { displayName, defaultGroupId } = parse.data
      const userId = request.user.id

      // If setting a defaultGroupId, verify the user is an active member of that group
      if (defaultGroupId !== undefined && defaultGroupId !== null) {
        const isMember = await usersService.isActiveMember(userId, defaultGroupId)
        if (!isMember) {
          return reply.status(403).send({
            error: {
              code: 'NOT_A_MEMBER',
              message: 'You are not an active member of that group',
            },
          })
        }
      }

      const updated = await usersService.updateUser(userId, {
        ...(displayName !== undefined ? { displayName } : {}),
        ...('defaultGroupId' in parse.data ? { defaultGroupId: defaultGroupId ?? null } : {}),
      })

      if (!updated) {
        return reply.status(404).send({
          error: { code: 'USER_NOT_FOUND', message: 'User not found' },
        })
      }

      return reply.send(updated)
    },
  })
}
