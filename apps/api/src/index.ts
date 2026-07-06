import dotenv from 'dotenv'
import { resolve } from 'path'

// Carrega o .env apenas em desenvolvimento (produção usa variáveis do ambiente)
if (process.env.NODE_ENV !== 'production') {
  const envPath = resolve(__dirname, '../../../.env')
  const result = dotenv.config({ path: envPath })

  if (result.error) {
    console.warn(`Aviso: não foi possível carregar o arquivo .env em ${envPath}: ${result.error.message}`)
  }
}

import Fastify from 'fastify'
import cors from '@fastify/cors'
import { Server as SocketServer } from 'socket.io'
import { evolutionRoutes } from './modules/evolution/evolution.routes'
import { evolutionWebhook } from './modules/evolution/evolution.webhook'
import { chatRoutes } from './modules/chat/chat.routes'
import { authRoutes } from './modules/auth/auth.routes'
import { contatosRoutes } from './modules/contatos/contatos.routes'
import { dashboardRoutes } from './modules/dashboard/dashboard.routes'
import { kanbanRoutes } from './modules/kanban/kanban.routes'
import { usuariosRoutes } from './modules/usuarios/usuarios.routes'
import { pipelineRoutes } from './modules/pipeline/pipeline.routes'
import { prospeccaoRoutes } from './modules/prospeccao/prospeccao.routes'
import { initSocket } from './socket'

const PORT = Number(process.env.API_PORT ?? 3001)

if (!Number.isInteger(PORT) || PORT < 1 || PORT > 65535) {
  throw new Error(
    `Configuração inválida: API_PORT deve ser um número inteiro entre 1 e 65535. Valor recebido: "${process.env.API_PORT}"`,
  )
}

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
    allowedHeaders: ['Content-Type', 'Authorization', 'x-empresa-id', 'apikey'],
  })

  // Rotas de autenticação
  await fastify.register(authRoutes, { prefix: '/api/auth' })

  // Rotas da Evolution API
  await fastify.register(evolutionRoutes, { prefix: '/api/evolution' })

  // Webhook recebido da Evolution API
  await fastify.register(evolutionWebhook, { prefix: '/webhook' })

  // Rotas de chat
  await fastify.register(chatRoutes, { prefix: '/api' })

  // Rotas de contatos
  await fastify.register(contatosRoutes, { prefix: '/api' })

  // Rotas do dashboard
  await fastify.register(dashboardRoutes, { prefix: '/api' })

  // Rotas do kanban
  await fastify.register(kanbanRoutes, { prefix: '/api' })

  // Rotas de usuários / equipe
  await fastify.register(usuariosRoutes, { prefix: '/api' })

  // Rotas do pipeline de vendas
  await fastify.register(pipelineRoutes, { prefix: '/api' })

  // Rotas de prospecção de leads (Apify)
  await fastify.register(prospeccaoRoutes, { prefix: '/api' })

  // Health check
  fastify.get('/health', async () => ({ ok: true }))

  // Socket.io usa o mesmo servidor HTTP do Fastify
  const io = new SocketServer(fastify.server, {
    cors: { origin: ALLOWED_ORIGINS, credentials: true },
  })

  initSocket(io)
  fastify.decorate('io', io)

  let encerrando = false

  const shutdown = async (signal: NodeJS.Signals) => {
    if (encerrando) return
    encerrando = true

    console.log(`Sinal ${signal} recebido. Encerrando servidor...`)

    const timeout = setTimeout(() => {
      console.error('Timeout ao encerrar o servidor. Forçando saída.')
      process.exit(1)
    }, 10_000)

    try {
      io.close()
      await fastify.close()
      clearTimeout(timeout)
      console.log('Servidor encerrado com sucesso.')
      process.exit(0)
    } catch (err) {
      clearTimeout(timeout)
      console.error('Erro ao encerrar o servidor:', err)
      process.exit(1)
    }
  }

  process.once('SIGTERM', () => void shutdown('SIGTERM'))
  process.once('SIGINT', () => void shutdown('SIGINT'))

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
