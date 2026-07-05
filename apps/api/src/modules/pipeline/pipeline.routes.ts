import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { prisma } from '../../lib/prisma'
import { verifyToken } from '../../lib/jwt'
import { garantirColunasPadrao } from '../../lib/colunas'

function resolverEmpresaId(req: FastifyRequest): string {
  const devId = req.headers['x-empresa-id'] as string | undefined
  if (devId && process.env.NODE_ENV !== 'production') return devId
  const auth = req.headers.authorization
  if (!auth?.startsWith('Bearer ')) throw new Error('Não autorizado')
  return verifyToken(auth.slice(7)).empresaId
}

const DIA_MS = 86400000

export async function pipelineRoutes(fastify: FastifyInstance) {

  // GET /api/pipeline — colunas do funil com suas oportunidades
  fastify.get('/pipeline', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const empresaId = resolverEmpresaId(req)

      const colunas = await prisma.kanbanColuna.findMany({
        where: { empresaId, tipo: 'PIPELINE' },
        orderBy: { ordem: 'asc' },
        include: {
          oportunidades: {
            orderBy: { atualizadoEm: 'desc' },
            include: { operador: { select: { nome: true } } },
          },
        },
      })

      return colunas.map(col => ({
        id: col.id,
        nome: col.nome,
        cor: col.cor,
        ordem: col.ordem,
        oportunidades: col.oportunidades.map(o => ({
          id: o.id,
          nome: o.nome,
          valorEstimado: Number(o.valorEstimado),
          tags: o.tags,
          operador: o.operador ? { nome: o.operador.nome } : null,
          diasNoEstagio: Math.max(0, Math.floor((Date.now() - o.atualizadoEm.getTime()) / DIA_MS)),
        })),
      }))
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro interno'
      return reply.status(msg.includes('autoriz') ? 401 : 500).send({ error: msg })
    }
  })

  // POST /api/pipeline/oportunidades — cria card no funil
  fastify.post('/pipeline/oportunidades', async (req: FastifyRequest<{
    Body: { nome?: string; valorEstimado?: number; tags?: string[]; kanbanColunaId?: string }
  }>, reply: FastifyReply) => {
    try {
      const empresaId = resolverEmpresaId(req)
      const { nome, valorEstimado = 0, tags = [], kanbanColunaId } = req.body ?? {}
      if (!nome) return reply.status(400).send({ error: 'Informe o nome da oportunidade' })

      let colunaId = kanbanColunaId
      if (!colunaId) {
        const colunas = await garantirColunasPadrao(empresaId)
        colunaId = colunas.find(c => c.tipo === 'PIPELINE')?.id
      }
      if (!colunaId) return reply.status(400).send({ error: 'Nenhuma coluna de pipeline encontrada' })

      const oportunidade = await prisma.oportunidade.create({
        data: { empresaId, nome, valorEstimado, tags, kanbanColunaId: colunaId },
      })
      return reply.status(201).send(oportunidade)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro interno'
      return reply.status(msg.includes('autoriz') ? 401 : 500).send({ error: msg })
    }
  })
}
