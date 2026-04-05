import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { prisma } from '../../lib/prisma'
import { emitParaEmpresa } from '../../socket'

// ─── Tipos dos eventos Evolution API ─────────────────────────────────────────

interface EvolutionWebhookPayload {
  event: string
  instance: string    // instanceName = "zapcrmapp-{empresaId}"
  data: unknown
  apikey?: string
}

interface QrcodeUpdatedData {
  qrcode: { base64: string; count: number }
}

interface ConnectionUpdateData {
  state: 'open' | 'connecting' | 'close'
  statusReason?: number
  wuid?: string       // número conectado: "5511999999999@s.whatsapp.net"
}

interface MessagesUpsertData {
  key: {
    remoteJid: string   // "5511999999999@s.whatsapp.net"
    fromMe: boolean
    id: string
  }
  message?: {
    conversation?: string
    extendedTextMessage?: { text: string }
    imageMessage?: { caption?: string }
    audioMessage?: unknown
    documentMessage?: { title?: string }
  }
  messageType: string
  pushName?: string    // nome do contato no WhatsApp
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function extrairEmpresaId(instanceName: string): string {
  // instanceName = "zapcrmapp-{empresaId}"
  return instanceName.replace('zapcrmapp-', '')
}

function extrairNumero(jid: string): string {
  // "5511999999999@s.whatsapp.net" → "5511999999999"
  return jid.split('@')[0]
}

function extrairTexto(data: MessagesUpsertData): string {
  const msg = data.message
  if (!msg) return ''
  return (
    msg.conversation ??
    msg.extendedTextMessage?.text ??
    msg.imageMessage?.caption ??
    '[mídia]'
  )
}

// ─── Handler de cada evento ───────────────────────────────────────────────────

async function handleQrcodeUpdated(
  empresaId: string,
  data: QrcodeUpdatedData,
  io: FastifyInstance['io'],
) {
  emitParaEmpresa(io, empresaId, 'qrcode_atualizado', {
    qrcode: data.qrcode.base64,
  })
}

async function handleConnectionUpdate(
  empresaId: string,
  data: ConnectionUpdateData,
  io: FastifyInstance['io'],
) {
  const updateData: Record<string, unknown> = { instanciaStatus: data.state }

  if (data.state === 'open' && data.wuid) {
    updateData.whatsappNumero = extrairNumero(data.wuid)
    updateData.whatsappConectadoEm = new Date()
  }

  if (data.state === 'close') {
    updateData.whatsappNumero = null
    updateData.whatsappConectadoEm = null
  }

  await prisma.empresa.update({
    where: { id: empresaId },
    data: updateData,
  })

  emitParaEmpresa(io, empresaId, 'conexao_atualizada', {
    status: data.state,
    numero: updateData.whatsappNumero ?? null,
    conectadoEm: updateData.whatsappConectadoEm ?? null,
  })
}

async function handleMessagesUpsert(
  empresaId: string,
  data: MessagesUpsertData,
  io: FastifyInstance['io'],
) {
  // Ignora mensagens enviadas pelo próprio sistema
  if (data.key.fromMe) return

  const numero = extrairNumero(data.key.remoteJid)
  const texto  = extrairTexto(data)

  // Busca ou cria Contato
  const contato = await prisma.contato.upsert({
    where: { empresaId_telefone: { empresaId, telefone: numero } },
    update: {},
    create: {
      empresaId,
      nome: data.pushName ?? numero,
      telefone: numero,
    },
  })

  // Busca chat aberto ou cria um novo
  let chat = await prisma.chat.findFirst({
    where: {
      empresaId,
      contatoId: contato.id,
      status: { in: ['AGUARDANDO', 'EM_ATENDIMENTO', 'AGUARDANDO_CLIENTE'] },
    },
    orderBy: { criadoEm: 'desc' },
  })

  if (!chat) {
    chat = await prisma.chat.create({
      data: {
        empresaId,
        contatoId: contato.id,
        status: 'AGUARDANDO',
      },
    })
  }

  // Salva mensagem — autorId null = mensagem do contato externo
  const mensagem = await prisma.mensagem.create({
    data: {
      chatId: chat.id,
      autorId: null,
      conteudo: texto,
      tipo: data.messageType === 'audioMessage' ? 'audio'
          : data.messageType === 'imageMessage'  ? 'imagem'
          : data.messageType === 'documentMessage' ? 'documento'
          : 'texto',
    },
  })

  // Atualiza timestamp do chat
  await prisma.chat.update({
    where: { id: chat.id },
    data: { atualizadoEm: new Date() },
  })

  // Emite nova_mensagem via Socket.io para o frontend
  const msgPayload = {
    id: mensagem.id,
    chatId: chat.id,
    tipo: mensagem.tipo,
    autorId: null,
    autorNome: data.pushName ?? contato.nome,
    conteudo: texto,
    lida: false,
    criadaEm: mensagem.criadaEm.toISOString(),
  }
  emitParaEmpresa(io, empresaId, 'nova_mensagem', { chatId: chat.id, mensagem: msgPayload })
  emitParaEmpresa(io, empresaId, 'chat_atualizado', { chatId: chat.id })
}

// ─── Rota do webhook ──────────────────────────────────────────────────────────

export async function evolutionWebhook(fastify: FastifyInstance) {
  fastify.post(
    '/evolution',
    async (req: FastifyRequest, reply: FastifyReply) => {
      const payload = req.body as EvolutionWebhookPayload

      // Valida token — Evolution API v2 envia o token da instância no header e no body
      const apikey = (req.headers['apikey'] as string | undefined) ?? payload.apikey
      const tokenEsperado = process.env.EVOLUTION_INSTANCE_TOKEN ?? process.env.EVOLUTION_API_KEY
      if (tokenEsperado && apikey !== tokenEsperado) {
        return reply.status(401).send({ error: 'Não autorizado' })
      }

      // Nunca logar conteúdo de mensagens de usuários finais
      if (process.env.NODE_ENV === 'development' && payload.event !== 'MESSAGES_UPSERT') {
        fastify.log.info({ event: payload.event, instance: payload.instance }, 'webhook evolution')
      }

      const empresaId = extrairEmpresaId(payload.instance)

      try {
        switch (payload.event) {
          case 'QRCODE_UPDATED':
          case 'qrcode.updated':
            await handleQrcodeUpdated(empresaId, payload.data as QrcodeUpdatedData, fastify.io)
            break

          case 'CONNECTION_UPDATE':
          case 'connection.update':
            await handleConnectionUpdate(empresaId, payload.data as ConnectionUpdateData, fastify.io)
            break

          case 'MESSAGES_UPSERT':
          case 'messages.upsert':
            await handleMessagesUpsert(empresaId, payload.data as MessagesUpsertData, fastify.io)
            break
        }
      } catch (err) {
        fastify.log.error({ event: payload.event, empresaId }, 'Erro ao processar webhook')
      }

      // Sempre responde 200 para a Evolution API não reenviar
      return reply.status(200).send({ ok: true })
    },
  )
}
