import Fastify from 'fastify'
import cors from '@fastify/cors'

const PORT = Number(process.env['PORT'] ?? 3000)
const APP_URL = process.env['APP_URL'] ?? 'http://localhost:5173'
const NODE_ENV = process.env['NODE_ENV'] ?? 'development'

const fastify = Fastify({
  logger: {
    level: NODE_ENV === 'production' ? 'info' : 'debug',
  },
})

await fastify.register(cors, {
  origin: APP_URL,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false,
})

fastify.get('/health', async () => {
  return { status: 'ok' }
})

try {
  await fastify.listen({ port: PORT, host: '0.0.0.0' })
  fastify.log.info(`API server listening on port ${PORT}`)
} catch (err) {
  fastify.log.error(err)
  process.exit(1)
}
