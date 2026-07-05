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
}
