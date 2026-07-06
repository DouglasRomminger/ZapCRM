import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { prisma } from '../../lib/prisma'
import { verifyToken } from '../../lib/jwt'

const APIFY_BASE = 'https://api.apify.com/v2'
// Actor oficial de scraping do Google Maps (compass/crawler-google-places)
const ACTOR = 'compass~crawler-google-places'

function resolverEmpresaId(req: FastifyRequest): string {
  const devId = req.headers['x-empresa-id'] as string | undefined
  if (devId && process.env.NODE_ENV !== 'production') return devId
  const auth = req.headers.authorization
  if (!auth?.startsWith('Bearer ')) throw new Error('Não autorizado')
  return verifyToken(auth.slice(7)).empresaId
}

function apifyToken(): string {
  const t = process.env.APIFY_TOKEN
  if (!t) throw new Error('APIFY_TOKEN não configurado — adicione a env no backend')
  return t
}

// ─── Helpers puros (exportados para teste) ────────────────────────────────────

// Normaliza telefone brasileiro para o formato do WhatsApp: 55 + DDD + número
export function normalizarTelefoneBR(raw?: string | null): string | null {
  if (!raw) return null
  const d = raw.replace(/\D/g, '')
  if (d.length < 10) return null
  if (d.startsWith('55') && d.length >= 12) return d
  if (d.length === 10 || d.length === 11) return `55${d}`
  return d
}

export interface LeadApify {
  title?: string
  phone?: string
  phoneUnformatted?: string
  address?: string
  categoryName?: string
  website?: string
  instagrams?: string[]
}

// Converte um resultado do Google Maps em dados de Contato (ou null se inválido)
export function leadParaContato(item: LeadApify, termo: string) {
  const telefone = normalizarTelefoneBR(item.phoneUnformatted ?? item.phone)
  if (!telefone || !item.title) return null
  const notas = [item.categoryName, item.address, item.website, item.instagrams?.[0]].filter(Boolean).join(' · ')
  return {
    nome: item.title,
    telefone,
    tags: ['prospeccao', termo.trim().toLowerCase()],
    optin: false, // lead frio: NUNCA entra em campanha de marketing (Regra Crítica #5)
    notas: notas || null,
  }
}

// ─── Rotas ────────────────────────────────────────────────────────────────────

export async function prospeccaoRoutes(fastify: FastifyInstance) {

  // POST /api/prospeccao/buscar — inicia uma busca de leads no Google Maps via Apify
  fastify.post('/prospeccao/buscar', async (req: FastifyRequest<{
    Body: { termo?: string; cidade?: string; quantidade?: number }
  }>, reply: FastifyReply) => {
    try {
      resolverEmpresaId(req)
      const { termo, cidade, quantidade = 20 } = req.body ?? {}
      if (!termo || !cidade) return reply.status(400).send({ error: 'Informe o termo de busca e a cidade' })
      const qtd = Math.min(Math.max(Number(quantidade) || 20, 1), 50)

      const res = await fetch(`${APIFY_BASE}/acts/${ACTOR}/runs?token=${apifyToken()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          searchStringsArray: [termo],
          locationQuery: `${cidade}, Brasil`,
          maxCrawledPlacesPerSearch: qtd,
          language: 'pt-BR',
          scrapeContacts: true, // enriquece com redes sociais do site (Instagram etc.)
        }),
      })
      if (!res.ok) {
        const corpo = await res.text()
        throw new Error(`Apify ${res.status}: ${corpo.slice(0, 200)}`)
      }
      const data = (await res.json()) as { data: { id: string; defaultDatasetId: string } }
      return { runId: data.data.id, datasetId: data.data.defaultDatasetId }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro interno'
      const code = msg.includes('autoriz') ? 401 : msg.includes('APIFY_TOKEN') ? 503 : 500
      return reply.status(code).send({ error: msg })
    }
  })

  // GET /api/prospeccao/runs/:runId — status da busca; quando concluída, importa os leads
  fastify.get('/prospeccao/runs/:runId', async (req: FastifyRequest<{
    Params: { runId: string }
    Querystring: { datasetId?: string; termo?: string }
  }>, reply: FastifyReply) => {
    try {
      const empresaId = resolverEmpresaId(req)
      const { runId } = req.params
      const { datasetId, termo = 'prospeccao' } = req.query

      const st = await fetch(`${APIFY_BASE}/actor-runs/${runId}?token=${apifyToken()}`)
      const stData = (await st.json()) as { data?: { status?: string } }
      const status = stData.data?.status ?? 'UNKNOWN'
      if (status !== 'SUCCEEDED') return { status }

      if (!datasetId) return reply.status(400).send({ error: 'datasetId ausente' })
      const itensRes = await fetch(`${APIFY_BASE}/datasets/${datasetId}/items?token=${apifyToken()}&clean=true`)
      const itens = (await itensRes.json()) as LeadApify[]

      const contatos = itens
        .map(i => leadParaContato(i, String(termo)))
        .filter((c): c is NonNullable<ReturnType<typeof leadParaContato>> => c !== null)

      const r = await prisma.contato.createMany({
        data: contatos.map(c => ({ ...c, empresaId })),
        skipDuplicates: true,
      })

      return {
        status,
        encontrados: itens.length,
        comTelefone: contatos.length,
        importados: r.count,
        duplicados: contatos.length - r.count,
        leads: contatos.map(c => ({ nome: c.nome, telefone: c.telefone, notas: c.notas })),
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro interno'
      const code = msg.includes('autoriz') ? 401 : msg.includes('APIFY_TOKEN') ? 503 : 500
      return reply.status(code).send({ error: msg })
    }
  })
}
