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

export async function contatosRoutes(fastify: FastifyInstance) {

  // GET /api/contatos — lista contatos da empresa enriquecidos com atendimento/avaliações
  fastify.get('/contatos', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const empresaId = resolverEmpresaId(req)

      const contatos = await prisma.contato.findMany({
        where: { empresaId },
        include: {
          chats: {
            orderBy: { atualizadoEm: 'desc' },
            select: { atualizadoEm: true, operador: { select: { nome: true } } },
          },
          avaliacoes: true,
        },
        orderBy: { criadoEm: 'desc' },
      })

      return contatos.map(c => {
        const notaMedia = c.avaliacoes.length
          ? c.avaliacoes.reduce((s, a) => s + a.nota, 0) / c.avaliacoes.length
          : undefined
        return {
          id: c.id,
          empresaId: c.empresaId,
          nome: c.nome,
          telefone: c.telefone,
          email: c.email,
          avatar: c.avatar,
          optin: c.optin,
          tags: c.tags,
          notas: c.notas,
          criadoEm: c.criadoEm.toISOString(),
          operadorNome: c.chats[0]?.operador?.nome ?? undefined,
          ultimoAtendimento: c.chats[0]?.atualizadoEm.toISOString(),
          totalAtendimentos: c.chats.length,
          notaMedia,
          avaliacoes: c.avaliacoes.map(a => ({
            id: a.id,
            nota: a.nota,
            comentario: a.comentario,
            criadaEm: a.criadaEm.toISOString(),
          })),
        }
      })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro interno'
      return reply.status(msg.includes('autoriz') ? 401 : 500).send({ error: msg })
    }
  })
}
