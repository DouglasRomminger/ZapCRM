import dotenv from 'dotenv'
import { resolve } from 'path'
// Carrega o .env da raiz do monorepo (apps/api está 2 níveis abaixo)
dotenv.config({ path: resolve(process.cwd(), '../../.env') })

import Fastify from 'fastify'
import cors from '@fastify/cors'
import { Server as SocketServer } from 'socket.io'
import { evolutionRoutes } from './modules/evolution/evolution.routes'
import { evolutionWebhook } from './modules/evolution/evolution.webhook'
import { initSocket } from './socket'

const PORT = Number(process.env.API_PORT ?? 3001)

const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  'http://localhost:3003',
  process.env.APP_URL,
].filter(Boolean) as string[]

async function bootstrap() {
  const fastify = Fastify({ logger: { level: 'warn' } })

  await fastify.register(cors, {
    origin: ALLOWED_ORIGINS,
    credentials: true,
  })

  // Rotas da Evolution API
  await fastify.register(evolutionRoutes, { prefix: '/api/evolution' })

  // Webhook recebido da Evolution API
  await fastify.register(evolutionWebhook, { prefix: '/webhook' })

  // Health check
  fastify.get('/health', async () => ({ ok: true }))

  // Socket.io usa o mesmo servidor HTTP do Fastify
  const io = new SocketServer(fastify.server, {
    cors: { origin: ALLOWED_ORIGINS, credentials: true },
  })

  initSocket(io)
  fastify.decorate('io', io)

  await fastify.listen({ port: PORT, host: '0.0.0.0' })
  console.log(`API rodando em http://localhost:${PORT}`)
}

bootstrap().catch((err) => {
  console.error('Erro ao iniciar API:', err)
  process.exit(1)
})

declare module 'fastify' {
  interface FastifyInstance {
    io: SocketServer
  }
}
