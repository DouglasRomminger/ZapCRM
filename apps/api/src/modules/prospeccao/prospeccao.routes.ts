import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import type { Prisma } from '@prisma/client'
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
  totalScore?: number
  reviewsCount?: number
}

// Converte um resultado do Google Maps em dados de Contato (ou null se inválido)
export function leadParaContato(item: LeadApify, termo: string) {
  const telefone = normalizarTelefoneBR(item.phoneUnformatted ?? item.phone)
  if (!telefone || !item.title) return null
  return {
    nome: item.title,
    telefone,
    tags: ['prospeccao', termo.trim().toLowerCase()],
    optin: false, // lead frio: NUNCA entra em campanha de marketing (Regra Crítica #5)
    categoria: item.categoryName ?? null,
    endereco: item.address ?? null,
    site: item.website ?? null,
    instagram: item.instagrams?.[0] ?? null,
    googleNota: item.totalScore ?? null,
    googleAvaliacoes: item.reviewsCount ?? null,
  }
}

// true quando o lead tem site cadastrado (usado pelo filtro "só empresas sem site")
export function leadTemSite(item: LeadApify): boolean {
  return typeof item.website === 'string' && item.website.trim().length > 0
}

// Campos estruturados que a prospecção enriquece num Contato existente
export interface CamposProspeccao {
  categoria: string | null
  endereco: string | null
  site: string | null
  instagram: string | null
  googleNota: number | null
  googleAvaliacoes: number | null
}

// Monta o patch de enriquecimento: só preenche campo do Contato existente que está
// null/vazio com o valor novo (não-null). Nunca sobrescreve dado já preenchido.
// Retorna objeto vazio quando não há nada a enriquecer.
export function montarEnriquecimento(
  existente: Partial<CamposProspeccao>,
  novo: CamposProspeccao,
): Partial<CamposProspeccao> {
  const patch: Partial<CamposProspeccao> = {}
  const vazio = (v: unknown) => v === null || v === undefined || (typeof v === 'string' && v.trim() === '')
  if (vazio(existente.categoria) && !vazio(novo.categoria)) patch.categoria = novo.categoria
  if (vazio(existente.endereco) && !vazio(novo.endereco)) patch.endereco = novo.endereco
  if (vazio(existente.site) && !vazio(novo.site)) patch.site = novo.site
  if (vazio(existente.instagram) && !vazio(novo.instagram)) patch.instagram = novo.instagram
  if (vazio(existente.googleNota) && !vazio(novo.googleNota)) patch.googleNota = novo.googleNota
  if (vazio(existente.googleAvaliacoes) && !vazio(novo.googleAvaliacoes)) patch.googleAvaliacoes = novo.googleAvaliacoes
  return patch
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
    Querystring: { termo?: string; apenasSemSite?: string }
  }>, reply: FastifyReply) => {
    try {
      const empresaId = resolverEmpresaId(req)
      const { runId } = req.params
      const { termo = 'prospeccao', apenasSemSite } = req.query

      const st = await fetch(`${APIFY_BASE}/actor-runs/${runId}?token=${apifyToken()}`)
      const stData = (await st.json()) as { data?: { status?: string; defaultDatasetId?: string } }
      const status = stData.data?.status ?? 'UNKNOWN'
      if (status !== 'SUCCEEDED') return { status }

      // Deriva o dataset do PRÓPRIO run — nunca confia num datasetId vindo do cliente
      // (querystring forjada poderia importar dados de outro dataset da conta Apify)
      const datasetId = stData.data?.defaultDatasetId
      if (!datasetId) return reply.status(502).send({ error: 'Run concluído sem dataset associado' })
      const itensRes = await fetch(`${APIFY_BASE}/datasets/${datasetId}/items?token=${apifyToken()}&clean=true`)
      const todosItens = (await itensRes.json()) as LeadApify[]

      // Filtro "só empresas sem site" (item C): alvo de venda de presença digital
      const soSemSite = apenasSemSite === 'true' || apenasSemSite === '1'
      const itens = soSemSite ? todosItens.filter(i => !leadTemSite(i)) : todosItens

      const contatos = itens
        .map(i => leadParaContato(i, String(termo)))
        .filter((c): c is NonNullable<ReturnType<typeof leadParaContato>> => c !== null)

      // Upsert por (empresaId, telefone): cria novos e ENRIQUECE os existentes (item B).
      // Busca os já cadastrados numa query só para evitar N+1 na decisão de criar/atualizar.
      const telefones = contatos.map(c => c.telefone)
      const existentes = telefones.length
        ? await prisma.contato.findMany({
            where: { empresaId, telefone: { in: telefones } },
            select: {
              telefone: true, categoria: true, endereco: true,
              site: true, instagram: true, googleNota: true, googleAvaliacoes: true,
            },
          })
        : []
      const mapaExistente = new Map(existentes.map(e => [e.telefone, e]))

      const novos = contatos.filter(c => !mapaExistente.has(c.telefone))
      const paraEnriquecer = contatos
        .map(c => {
          const atual = mapaExistente.get(c.telefone)
          if (!atual) return null
          const patch = montarEnriquecimento(atual, c)
          return Object.keys(patch).length ? { telefone: c.telefone, patch } : null
        })
        .filter((x): x is { telefone: string; patch: Partial<CamposProspeccao> } => x !== null)

      // Cria os novos em bloco (skipDuplicates protege contra corrida concorrente)
      const criacao = novos.length
        ? await prisma.contato.createMany({
            data: novos.map(c => ({ ...c, empresaId })),
            skipDuplicates: true,
          })
        : { count: 0 }

      // Enriquece os existentes em lotes pequenos para não estourar o pool do Supabase.
      // updateMany condicionado aos campos AINDA nulos torna a escrita atômica: se outra
      // requisição preencheu o campo entre a leitura e aqui, este update não o sobrescreve.
      let enriquecidos = 0
      const TAMANHO_LOTE = 10
      for (let i = 0; i < paraEnriquecer.length; i += TAMANHO_LOTE) {
        const lote = paraEnriquecer.slice(i, i + TAMANHO_LOTE)
        const counts = await Promise.all(
          lote.map(({ telefone, patch }) => {
            const soNulos: Prisma.ContatoWhereInput = { empresaId, telefone }
            for (const campo of Object.keys(patch)) (soNulos as Record<string, unknown>)[campo] = null
            return prisma.contato.updateMany({ where: soNulos, data: patch })
          }),
        )
        enriquecidos += counts.reduce((s, r) => s + r.count, 0)
      }

      return {
        status,
        encontrados: itens.length,
        comTelefone: contatos.length,
        criados: criacao.count,
        enriquecidos,
        leads: contatos.map(c => ({
          nome: c.nome,
          telefone: c.telefone,
          notas: [c.categoria, c.googleNota ? `⭐ ${c.googleNota}` : null, c.site].filter(Boolean).join(' · ') || null,
        })),
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro interno'
      const code = msg.includes('autoriz') ? 401 : msg.includes('APIFY_TOKEN') ? 503 : 500
      return reply.status(code).send({ error: msg })
    }
  })
}
