import type { FastifyInstance } from 'fastify'
import { randomBytes } from 'node:crypto'
import type { AuthService } from './auth.service.ts'
import type { JwtService } from '../../infrastructure/jwt/jwt.port.ts'
import { authenticate } from '../../hooks/authenticate.ts'

const CSRF_COOKIE_NAME = 'oauth_state'
const CSRF_COOKIE_MAX_AGE = 600 // 10 minutes

export async function authRoutes(
  fastify: FastifyInstance,
  opts: { authService: AuthService; jwtService: JwtService; appUrl: string },
): Promise<void> {
  const { authService, appUrl } = opts

  // GET /api/v1/auth/google — initiates OAuth flow
  fastify.get('/auth/google', {
    handler: async (request, reply) => {
      const state = randomBytes(32).toString('base64url')

      // Store CSRF nonce in HttpOnly Secure SameSite=Strict cookie
      reply.cookie(CSRF_COOKIE_NAME, state, {
        httpOnly: true,
        secure: process.env['NODE_ENV'] === 'production',
        sameSite: 'strict',
        path: '/api/v1/auth',
        maxAge: CSRF_COOKIE_MAX_AGE,
      })

      const authUrl = authService.buildGoogleAuthUrl(state)
      return reply.redirect(authUrl)
    },
  })

  // GET /api/v1/auth/google/callback — Google redirects here
  fastify.get<{
    Querystring: { code?: string; state?: string; error?: string }
  }>('/auth/google/callback', {
    handler: async (request, reply) => {
      const { code, state, error } = request.query

      if (error) {
        request.log.warn({ error }, 'Google OAuth error')
        return reply.redirect(`${appUrl}/#error=oauth_denied`)
      }

      if (!code || !state) {
        return reply.redirect(`${appUrl}/#error=oauth_invalid`)
      }

      // Verify CSRF nonce
      const storedState = (request.cookies as Record<string, string | undefined>)[CSRF_COOKIE_NAME]
      if (!storedState || storedState !== state) {
        request.log.warn('OAuth CSRF state mismatch')
        return reply.status(400).send({
          error: { code: 'CSRF_MISMATCH', message: 'Invalid state parameter' },
        })
      }

      // Clear the CSRF cookie
      reply.clearCookie(CSRF_COOKIE_NAME, { path: '/api/v1/auth' })

      try {
        const { token } = await authService.handleCallback(code)
        return reply.redirect(`${appUrl}/#token=${token}`)
      } catch (err) {
        request.log.error(err, 'OAuth callback failed')
        return reply.redirect(`${appUrl}/#error=oauth_failed`)
      }
    },
  })

  // POST /api/v1/auth/signout — stateless, client discards token
  fastify.post('/auth/signout', {
    preHandler: [authenticate(opts.jwtService)],
    handler: async (_request, reply) => {
      return reply.status(204).send()
    },
  })

  // GET /api/v1/auth/me — returns authenticated user
  fastify.get('/auth/me', {
    preHandler: [authenticate(opts.jwtService)],
    handler: async (request, reply) => {
      const userId = request.user.id
      const user = await authService.getMe(userId)
      if (!user) {
        return reply.status(401).send({
          error: { code: 'USER_NOT_FOUND', message: 'User not found' },
        })
      }
      return reply.send(user)
    },
  })
}
