import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { prisma } from '../../lib/prisma'
import { verifyToken } from '../../lib/jwt'
import { emitParaEmpresa } from '../../socket'
import { sendTextMessage } from '../evolution/evolution.client'

// ─── Auth helper (igual ao evolution.routes) ──────────────────────────────────

function resolverEmpresaId(req: FastifyRequest): string {
  const devId = req.headers['x-empresa-id'] as string | undefined
  if (devId) return devId
  const auth = req.headers.authorization
  if (!auth?.startsWith('Bearer ')) throw new Error('Não autorizado')
  return verifyToken(auth.slice(7)).empresaId
}

// ─── Rotas ────────────────────────────────────────────────────────────────────

export async function chatRoutes(fastify: FastifyInstance) {

  // GET /api/chats — lista chats ativos da empresa
  fastify.get('/chats', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const empresaId = resolverEmpresaId(req)

      const chats = await prisma.chat.findMany({
        where: {
          empresaId,
          status: { in: ['AGUARDANDO', 'EM_ATENDIMENTO', 'AGUARDANDO_CLIENTE'] },
        },
        include: {
          contato: true,
          operador: { select: { id: true, nome: true, avatar: true } },
          kanbanColuna: { select: { id: true, nome: true, cor: true, ordem: true } },
          mensagens: {
            orderBy: { criadaEm: 'desc' },
            take: 1,
          },
        },
        orderBy: { atualizadoEm: 'desc' },
      })

      const resultado = chats.map(chat => ({
        id: chat.id,
        empresaId: chat.empresaId,
        status: chat.status,
        contato: {
          id: chat.contato.id,
          nome: chat.contato.nome,
          telefone: chat.contato.telefone,
          avatar: chat.contato.avatar,
          tags: chat.contato.tags,
        },
        operador: chat.operador,
        kanbanColuna: chat.kanbanColuna,
        totalNaoLidas: chat.mensagens.filter(m => !m.lida && !m.autorId).length,
        ultimaMensagem: chat.mensagens[0] ? {
          id: chat.mensagens[0].id,
          chatId: chat.id,
          autorId: chat.mensagens[0].autorId,
          conteudo: chat.mensagens[0].conteudo,
          tipo: chat.mensagens[0].tipo,
          lida: chat.mensagens[0].lida,
          criadaEm: chat.mensagens[0].criadaEm.toISOString(),
        } : null,
        criadoEm: chat.criadoEm.toISOString(),
        atualizadoEm: chat.atualizadoEm.toISOString(),
      }))

      return resultado
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro interno'
      return reply.status(401).send({ error: msg })
    }
  })

  // GET /api/chats/:id/mensagens — mensagens de um chat
  fastify.get('/chats/:id/mensagens', async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const empresaId = resolverEmpresaId(req)
      const { id } = req.params

      const chat = await prisma.chat.findFirst({
        where: { id, empresaId },
      })
      if (!chat) return reply.status(404).send({ error: 'Chat não encontrado' })

      const [mensagens, logs] = await Promise.all([
        prisma.mensagem.findMany({
          where: { chatId: id },
          include: { autor: { select: { id: true, nome: true } } },
          orderBy: { criadaEm: 'asc' },
        }),
        prisma.logAtividade.findMany({
          where: { chatId: id },
          orderBy: { criadoEm: 'asc' },
        }),
      ])

      // Marcar mensagens não lidas como lidas
      await prisma.mensagem.updateMany({
        where: { chatId: id, lida: false, autorId: null },
        data: { lida: true },
      })

      // Combina e ordena por data
      const itens = [
        ...mensagens.map(m => ({
          id: m.id,
          chatId: m.chatId,
          tipo: m.tipo as 'texto' | 'imagem' | 'audio' | 'documento',
          autorId: m.autorId,
          autorNome: m.autor?.nome ?? null,
          conteudo: m.conteudo,
          lida: m.lida,
          criadaEm: m.criadaEm.toISOString(),
        })),
        ...logs.map(l => ({
          id: l.id,
          chatId: l.chatId,
          tipo: 'log_atividade' as const,
          autorId: null,
          autorNome: 'Sistema',
          conteudo: l.descricao,
          lida: true,
          criadaEm: l.criadoEm.toISOString(),
        })),
      ].sort((a, b) => new Date(a.criadaEm).getTime() - new Date(b.criadaEm).getTime())

      return itens
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro interno'
      return reply.status(500).send({ error: msg })
    }
  })

  // POST /api/chats/:id/mensagens — envia mensagem
  fastify.post('/chats/:id/mensagens', async (req: FastifyRequest<{
    Params: { id: string }
    Body: { conteudo: string; tipo?: string }
  }>, reply: FastifyReply) => {
    try {
      const empresaId = resolverEmpresaId(req)
      const { id } = req.params
      const { conteudo, tipo = 'texto' } = req.body

      const chat = await prisma.chat.findFirst({
        where: { id, empresaId },
        include: { contato: true, empresa: true },
      })
      if (!chat) return reply.status(404).send({ error: 'Chat não encontrado' })

      // Envia via Evolution API
      if (chat.empresa.instanciaId) {
        await sendTextMessage(chat.empresa.instanciaId, chat.contato.telefone, conteudo)
      }

      // Salva no banco — autorId null temporariamente (sem auth real ainda)
      const mensagem = await prisma.mensagem.create({
        data: { chatId: id, autorId: null, conteudo, tipo, lida: true },
      })

      await prisma.chat.update({
        where: { id },
        data: { atualizadoEm: new Date() },
      })

      const payload = {
        id: mensagem.id,
        chatId: id,
        tipo,
        autorId: 'operador', // placeholder até auth real
        autorNome: 'Operador',
        conteudo,
        lida: true,
        criadaEm: mensagem.criadaEm.toISOString(),
      }

      emitParaEmpresa(fastify.io, empresaId, 'nova_mensagem', { chatId: id, mensagem: payload })

      return payload
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro interno'
      return reply.status(500).send({ error: msg })
    }
  })
}
