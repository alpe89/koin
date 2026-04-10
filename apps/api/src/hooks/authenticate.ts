import type { FastifyRequest, FastifyReply, preHandlerHookHandler } from 'fastify'
import type { JwtService } from '../infrastructure/jwt/jwt.port.ts'

export function authenticate(jwtService: JwtService): preHandlerHookHandler {
  return async function (request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const authHeader = request.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.status(401).send({
        error: { code: 'MISSING_TOKEN', message: 'Authorization header required' },
      })
    }

    const token = authHeader.slice(7)
    try {
      const payload = jwtService.verify(token)
      request.user = {
        id: payload.sub,
        email: payload.email,
        displayName: payload.displayName,
      }
    } catch {
      return reply.status(401).send({
        error: { code: 'INVALID_TOKEN', message: 'Invalid or expired token' },
      })
    }
  }
}
