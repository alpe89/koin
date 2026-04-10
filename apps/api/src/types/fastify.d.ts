import type { MemberRole } from '@koin/shared'

declare module 'fastify' {
  interface FastifyRequest {
    user: {
      id: string
      email: string
      displayName: string
    }
    groupMember: {
      groupId: string
      userId: string
      role: MemberRole
    }
  }
}
