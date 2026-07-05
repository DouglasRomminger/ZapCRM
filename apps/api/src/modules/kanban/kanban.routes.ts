import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { prisma } from '../../lib/prisma'
import { verifyToken } from '../../lib/jwt'

function resolverEmpresaId(req: FastifyRequest): string {
  const devId = req.headers['x-empresa-id'] as string | undefined
  if (devId && process.env.NODE_ENV !== 'production') return devId
  const auth = req.headers.authorization
  if (!auth?.startsWith('Bearer ')) throw new Error('Não autorizado')
  return verifyToken(auth.slice(7)).empresaId
}

export async function kanbanRoutes(fastify: FastifyInstance) {

  // GET /api/kanban — colunas da empresa com seus chats (atendimento e pipeline)
  fastify.get('/kanban', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const empresaId = resolverEmpresaId(req)

      const colunas = await prisma.kanbanColuna.findMany({
        where: { empresaId },
        orderBy: { ordem: 'asc' },
        include: {
          chats: {
            orderBy: { atualizadoEm: 'desc' },
            include: {
              contato: { select: { nome: true, telefone: true } },
              operador: { select: { nome: true } },
              mensagens: { orderBy: { criadaEm: 'desc' }, take: 1, select: { conteudo: true } },
              _count: { select: { mensagens: { where: { lida: false, autorId: null } } } },
            },
          },
        },
      })

      return colunas.map(col => ({
        id: col.id,
        nome: col.nome,
        cor: col.cor,
        ordem: col.ordem,
        tipo: col.tipo,
        chats: col.chats.map(ch => ({
          id: ch.id,
          status: ch.status,
          atualizadoEm: ch.atualizadoEm.toISOString(),
          totalNaoLidas: ch._count.mensagens,
          contato: { nome: ch.contato.nome, telefone: ch.contato.telefone },
          operador: ch.operador ? { nome: ch.operador.nome } : null,
          ultimaMensagem: ch.mensagens[0] ? { conteudo: ch.mensagens[0].conteudo } : null,
        })),
      }))
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro interno'
      return reply.status(msg.includes('autoriz') ? 401 : 500).send({ error: msg })
    }
  })

  // POST /api/kanban/colunas — cria coluna nova
  fastify.post('/kanban/colunas', async (req: FastifyRequest<{
    Body: { nome?: string; cor?: string; tipo?: 'ATENDIMENTO' | 'PIPELINE' }
  }>, reply: FastifyReply) => {
    try {
      const empresaId = resolverEmpresaId(req)
      const { nome, cor = '#7C3AED', tipo = 'ATENDIMENTO' } = req.body ?? {}
      if (!nome) return reply.status(400).send({ error: 'Informe o nome da coluna' })

      const ultima = await prisma.kanbanColuna.findFirst({
        where: { empresaId, tipo },
        orderBy: { ordem: 'desc' },
      })
      const coluna = await prisma.kanbanColuna.create({
        data: { empresaId, nome, cor, tipo, ordem: (ultima?.ordem ?? 0) + 1 },
      })
      return reply.status(201).send(coluna)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro interno'
      return reply.status(msg.includes('autoriz') ? 401 : 500).send({ error: msg })
    }
  })
}
