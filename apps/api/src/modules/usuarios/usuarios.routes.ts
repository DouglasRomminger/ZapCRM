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

export async function usuariosRoutes(fastify: FastifyInstance) {

  // GET /api/usuarios — operadores da empresa com chats abertos e nota média
  fastify.get('/usuarios', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const empresaId = resolverEmpresaId(req)

      const usuarios = await prisma.usuario.findMany({
        where: { empresaId, ativo: true },
        orderBy: { criadoEm: 'asc' },
        select: { id: true, empresaId: true, nome: true, email: true, role: true, status: true, avatar: true },
      })

      return Promise.all(
        usuarios.map(async u => {
          const chatsAbertos = await prisma.chat.count({
            where: { operadorId: u.id, status: { not: 'ENCERRADO' } },
          })
          const avals = await prisma.avaliacao.findMany({
            where: { chat: { operadorId: u.id } },
            select: { nota: true },
          })
          const notaMedia = avals.length
            ? Number((avals.reduce((s, a) => s + a.nota, 0) / avals.length).toFixed(1))
            : null
          return { ...u, chatsAbertos, notaMedia }
        }),
      )
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro interno'
      return reply.status(msg.includes('autoriz') ? 401 : 500).send({ error: msg })
    }
  })
}
