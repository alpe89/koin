import Fastify from 'fastify'
import cors from '@fastify/cors'
import cookie from '@fastify/cookie'
import rateLimit from '@fastify/rate-limit'

import { pool } from './infrastructure/db/pool.ts'
import { GoogleAuthAdapter } from './infrastructure/auth/google.adapter.ts'
import { Rs256JwtAdapter } from './infrastructure/jwt/rs256.adapter.ts'

import { buildAuthService } from './modules/auth/auth.service.ts'
import { buildGroupsService } from './modules/groups/groups.service.ts'
import { buildMembersService } from './modules/groups/members.service.ts'
import { buildInvitationsService } from './modules/groups/invitations.service.ts'
import { buildUsersService } from './modules/users/users.service.ts'

import { authRoutes } from './modules/auth/auth.routes.ts'
import { groupRoutes, invitationRoutes } from './modules/groups/groups.routes.ts'
import { userRoutes } from './modules/users/users.routes.ts'

// ── Environment ────────────────────────────────────────────────────────────────

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Missing required environment variable: ${name}`)
  return value
}

const PORT = Number(process.env['PORT'] ?? 3000)
const NODE_ENV = process.env['NODE_ENV'] ?? 'development'
const APP_URL = process.env['APP_URL'] ?? 'http://localhost:5173'

const GOOGLE_CLIENT_ID = requireEnv('GOOGLE_CLIENT_ID')
const GOOGLE_CLIENT_SECRET = requireEnv('GOOGLE_CLIENT_SECRET')
const GOOGLE_REDIRECT_URI = requireEnv('GOOGLE_REDIRECT_URI')
const JWT_PRIVATE_KEY = requireEnv('JWT_PRIVATE_KEY').replace(/\\n/g, '\n')
const JWT_PUBLIC_KEY = requireEnv('JWT_PUBLIC_KEY').replace(/\\n/g, '\n')

// ── Adapters ───────────────────────────────────────────────────────────────────

const authProvider = new GoogleAuthAdapter(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET)
const jwtService = new Rs256JwtAdapter(JWT_PRIVATE_KEY, JWT_PUBLIC_KEY)

// ── Services ───────────────────────────────────────────────────────────────────

const authService = buildAuthService(pool, authProvider, jwtService, GOOGLE_REDIRECT_URI)
const groupsService = buildGroupsService(pool)
const membersService = buildMembersService(pool)
const invitationsService = buildInvitationsService(pool, APP_URL)
const usersService = buildUsersService(pool)

// ── Fastify instance ───────────────────────────────────────────────────────────

const fastify = Fastify({
  logger: {
    level: NODE_ENV === 'production' ? 'info' : 'debug',
  },
  // Attach request ID to every log line
  genReqId: () => crypto.randomUUID(),
})

// ── Plugins ────────────────────────────────────────────────────────────────────

await fastify.register(cors, {
  origin: APP_URL,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false,
})

await fastify.register(cookie)

await fastify.register(rateLimit, {
  max: 100,
  timeWindow: '1 minute',
  keyGenerator: (request) =>
    (request.headers['x-forwarded-for'] as string | undefined) ??
    request.ip,
})

// ── Global error handler ───────────────────────────────────────────────────────

fastify.setErrorHandler((error, request, reply) => {
  request.log.error({ err: error, reqId: request.id }, 'Unhandled error')
  // Never expose internal details to clients
  return reply.status(500).send({
    error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
  })
})

// ── Health check ───────────────────────────────────────────────────────────────

fastify.get('/health', async () => ({ status: 'ok' }))

// ── Routes ─────────────────────────────────────────────────────────────────────

const API_PREFIX = '/api/v1'

await fastify.register(
  async (app) => {
    await authRoutes(app, { authService, jwtService, appUrl: APP_URL })
    await groupRoutes(app, { groupsService, membersService, invitationsService, jwtService, db: pool })
    await invitationRoutes(app, { invitationsService, jwtService })
    await userRoutes(app, { usersService, jwtService })
  },
  { prefix: API_PREFIX },
)

// ── Start ──────────────────────────────────────────────────────────────────────

try {
  await fastify.listen({ port: PORT, host: '0.0.0.0' })
  fastify.log.info(`API server listening on port ${PORT}`)
} catch (err) {
  fastify.log.error(err)
  process.exit(1)
}
