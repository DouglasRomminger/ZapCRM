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

const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export async function dashboardRoutes(fastify: FastifyInstance) {

  // GET /api/dashboard — KPIs, distribuição do kanban, atendimentos recentes e gráfico 7 dias
  fastify.get('/dashboard', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const empresaId = resolverEmpresaId(req)

      const inicioHoje = new Date()
      inicioHoje.setHours(0, 0, 0, 0)
      const seteDias = new Date(inicioHoje)
      seteDias.setDate(seteDias.getDate() - 6)

      const [emAtendimento, aguardando, encerradosHoje, criadosHoje, avals, colunas, recentesRaw, chats7d] =
        await Promise.all([
          prisma.chat.count({ where: { empresaId, status: 'EM_ATENDIMENTO' } }),
          prisma.chat.count({ where: { empresaId, status: 'AGUARDANDO' } }),
          prisma.chat.count({ where: { empresaId, status: 'ENCERRADO', atualizadoEm: { gte: inicioHoje } } }),
          prisma.chat.count({ where: { empresaId, criadoEm: { gte: inicioHoje } } }),
          prisma.avaliacao.findMany({ where: { contato: { empresaId } }, select: { nota: true } }),
          prisma.kanbanColuna.findMany({ where: { empresaId }, orderBy: { ordem: 'asc' } }),
          prisma.chat.findMany({
            where: { empresaId },
            orderBy: { atualizadoEm: 'desc' },
            take: 5,
            include: {
              contato: { select: { nome: true } },
              mensagens: { orderBy: { criadaEm: 'desc' }, take: 1, select: { conteudo: true } },
            },
          }),
          prisma.chat.findMany({
            where: { empresaId, criadoEm: { gte: seteDias } },
            select: { criadoEm: true, status: true, atualizadoEm: true },
          }),
        ])

      const notaMedia = avals.length
        ? Number((avals.reduce((s, a) => s + a.nota, 0) / avals.length).toFixed(1))
        : 0

      const colunasComContagem = await Promise.all(
        colunas.map(async col => ({
          id: col.id,
          nome: col.nome,
          cor: col.cor,
          totalChats: await prisma.chat.count({ where: { kanbanColunaId: col.id } }),
        })),
      )

      const grafico: { dia: string; total: number; encerrados: number }[] = []
      for (let i = 6; i >= 0; i--) {
        const d = new Date(inicioHoje)
        d.setDate(d.getDate() - i)
        const prox = new Date(d)
        prox.setDate(prox.getDate() + 1)
        grafico.push({
          dia: DIAS[d.getDay()],
          total: chats7d.filter(c => c.criadoEm >= d && c.criadoEm < prox).length,
          encerrados: chats7d.filter(
            c => c.status === 'ENCERRADO' && c.atualizadoEm >= d && c.atualizadoEm < prox,
          ).length,
        })
      }

      return {
        kpis: {
          totalAtendimentos: criadosHoje,
          emAtendimento,
          aguardando,
          encerradosHoje,
          tmrMinutos: 0,
          notaMedia,
        },
        colunas: colunasComContagem,
        recentes: recentesRaw.map(c => ({
          id: c.id,
          status: c.status,
          contato: { nome: c.contato.nome },
          ultimaMensagem: c.mensagens[0] ? { conteudo: c.mensagens[0].conteudo } : null,
        })),
        grafico,
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro interno'
      return reply.status(msg.includes('autoriz') ? 401 : 500).send({ error: msg })
    }
  })
}
