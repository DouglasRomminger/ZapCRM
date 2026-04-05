import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { prisma } from '../../lib/prisma'
import { verifyToken } from '../../lib/jwt'
import {
  createInstance,
  getConnectionState,
  getQrCode,
  logoutInstance,
  setWebhook,
} from './evolution.client'

// ─── Auth helper ──────────────────────────────────────────────────────────────

function extrairEmpresaId(req: FastifyRequest): string {
  const auth = req.headers.authorization
  if (!auth?.startsWith('Bearer ')) {
    throw new Error('Não autorizado')
  }
  const payload = verifyToken(auth.slice(7))
  return payload.empresaId
}

// Em desenvolvimento, aceita header x-empresa-id para testes sem JWT
function resolverEmpresaId(req: FastifyRequest): string {
  if (process.env.NODE_ENV !== 'production') {
    const devId = req.headers['x-empresa-id'] as string | undefined
    if (devId) return devId
  }
  return extrairEmpresaId(req)
}

// ─── Rotas ────────────────────────────────────────────────────────────────────

export async function evolutionRoutes(fastify: FastifyInstance) {

  // GET /api/evolution/status — estado atual da instância
  fastify.get('/status', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const empresaId = resolverEmpresaId(req)

      const empresa = await prisma.empresa.findUnique({
        where: { id: empresaId },
        select: {
          instanciaId: true,
          instanciaStatus: true,
          whatsappNumero: true,
          whatsappConectadoEm: true,
        },
      })

      if (!empresa) return { status: 'sem_instancia' }

      // Se não tem instância ainda, retorna desconectado
      if (!empresa.instanciaId) {
        return { status: 'sem_instancia' }
      }

      // Busca estado real na Evolution API
      try {
        const estado = await getConnectionState(empresa.instanciaId)
        return {
          status: estado.instance.state,
          instanciaId: empresa.instanciaId,
          numero: empresa.whatsappNumero,
          conectadoEm: empresa.whatsappConectadoEm,
        }
      } catch {
        // Se a Evolution API não encontra a instância, limpa o banco
        await prisma.empresa.update({
          where: { id: empresaId },
          data: { instanciaId: null, instanciaStatus: null, whatsappNumero: null },
        })
        return { status: 'sem_instancia' }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro interno'
      return reply.status(401).send({ error: msg })
    }
  })

  // POST /api/evolution/connect — cria instância e retorna QR code
  fastify.post('/connect', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const empresaId = resolverEmpresaId(req)
      const instanceName = `zapcrmapp-${empresaId}`
      const webhookUrl = `${process.env.WEBHOOK_URL ?? 'http://localhost:3001'}/webhook/evolution`

      // Em dev, garante que a empresa existe no banco
      if (process.env.NODE_ENV !== 'production') {
        const existe = await prisma.empresa.findUnique({ where: { id: empresaId } })
        if (!existe) {
          await prisma.empresa.create({ data: { id: empresaId, nome: 'Empresa Dev' } })
        }
      }

      // Tenta criar a instância (pode já existir — tratamos o erro)
      let qrcodeBase64: string | null = null
      try {
        const criada = await createInstance(instanceName)
        qrcodeBase64 = criada.qrcode?.base64 ?? (criada as any).base64 ?? null

        // Configura webhook na instância recém-criada
        await setWebhook({ instanceName, webhookUrl })
      } catch (err: unknown) {
        // Instância já existe — apenas busca o QR
        const msg = err instanceof Error ? err.message : ''
        if (!msg.includes('already')) throw err
      }

      // Salva instanciaId no banco
      await prisma.empresa.update({
        where: { id: empresaId },
        data: { instanciaId: instanceName, instanciaStatus: 'connecting' },
      })

      // Se não veio QR na criação, busca explicitamente
      if (!qrcodeBase64) {
        try {
          const qrResult = await getQrCode(instanceName)
          qrcodeBase64 = qrResult.qrcode?.base64 ?? null
        } catch { /* QR ainda não disponível, chegará via webhook */ }
      }

      return { instanciaId: instanceName, qrcode: qrcodeBase64 }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro interno'
      return reply.status(err instanceof Error && msg.includes('Não autorizado') ? 401 : 500).send({ error: msg })
    }
  })

  // GET /api/evolution/qrcode — busca QR code atual
  fastify.get('/qrcode', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const empresaId = resolverEmpresaId(req)

      const empresa = await prisma.empresa.findUnique({
        where: { id: empresaId },
        select: { instanciaId: true },
      })

      if (!empresa?.instanciaId) {
        return reply.status(404).send({ error: 'Sem instância ativa' })
      }

      const result = await getQrCode(empresa.instanciaId)
      const base64 = result.base64 ?? result.qrcode?.base64 ?? null
      return { qrcode: base64 }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro interno'
      return reply.status(500).send({ error: msg })
    }
  })

  // POST /api/evolution/disconnect — desconecta o WhatsApp
  fastify.post('/disconnect', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const empresaId = resolverEmpresaId(req)

      const empresa = await prisma.empresa.findUnique({
        where: { id: empresaId },
        select: { instanciaId: true },
      })

      if (!empresa?.instanciaId) {
        return reply.status(404).send({ error: 'Sem instância ativa' })
      }

      await logoutInstance(empresa.instanciaId)

      await prisma.empresa.update({
        where: { id: empresaId },
        data: {
          instanciaStatus: 'close',
          whatsappNumero: null,
          whatsappConectadoEm: null,
        },
      })

      return { ok: true }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro interno'
      return reply.status(500).send({ error: msg })
    }
  })
}
