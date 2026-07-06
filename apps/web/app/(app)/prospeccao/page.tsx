'use client'

import { useState, useEffect, useRef } from 'react'
import { AppLayout } from '@/components/layout/AppLayout'
import { apiFetch } from '@/lib/auth'
import { Search, MapPin, Users, Loader2, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react'

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface LeadImportado { nome: string; telefone: string; notas: string | null }
interface Resultado {
  status: string
  encontrados: number
  comTelefone: number
  criados: number
  enriquecidos: number
  leads: LeadImportado[]
}

type Fase = 'idle' | 'buscando' | 'concluido' | 'erro'

// ─── Página ───────────────────────────────────────────────────────────────────

export default function ProspeccaoPage() {
  const [termo, setTermo] = useState('')
  const [cidade, setCidade] = useState('')
  const [quantidade, setQuantidade] = useState(20)
  const [apenasSemSite, setApenasSemSite] = useState(false)
  const [fase, setFase] = useState<Fase>('idle')
  const [erro, setErro] = useState<string | null>(null)
  const [resultado, setResultado] = useState<Resultado | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current) }, [])

  async function buscar() {
    setErro(null)
    setResultado(null)
    if (!termo.trim() || !cidade.trim()) { setErro('Informe o que buscar e a cidade'); return }
    setFase('buscando')
    try {
      const res = await apiFetch('/api/prospeccao/buscar', {
        method: 'POST',
        body: JSON.stringify({ termo: termo.trim(), cidade: cidade.trim(), quantidade }),
      })
      const data = await res.json()
      if (!res.ok) { setErro(data?.error ?? 'Erro ao iniciar a busca'); setFase('erro'); return }

      const { runId } = data as { runId: string }
      const url = `/api/prospeccao/runs/${runId}?termo=${encodeURIComponent(termo.trim())}${apenasSemSite ? '&apenasSemSite=true' : ''}`

      pollRef.current = setInterval(async () => {
        try {
          const r = await apiFetch(url)
          const d = await r.json()
          if (!r.ok) {
            if (pollRef.current) clearInterval(pollRef.current)
            setErro(d?.error ?? 'Erro ao consultar a busca')
            setFase('erro')
            return
          }
          if (d.status === 'SUCCEEDED') {
            if (pollRef.current) clearInterval(pollRef.current)
            setResultado(d as Resultado)
            setFase('concluido')
          } else if (['FAILED', 'ABORTED', 'TIMED-OUT'].includes(d.status)) {
            if (pollRef.current) clearInterval(pollRef.current)
            setErro(`A busca no Apify terminou com status ${d.status}`)
            setFase('erro')
          }
          // RUNNING/READY: continua aguardando
        } catch { /* tenta de novo no próximo tick */ }
      }, 5000)
    } catch {
      setErro('Falha de conexão com o servidor')
      setFase('erro')
    }
  }

  const inputCls = 'w-full text-[13px] px-3 py-2.5 rounded-lg outline-none'
  const inputStyle = { border: '1.5px solid var(--color-purple-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' } as const
  const labelCls = 'text-[12px] font-medium block mb-1.5'

  return (
    <AppLayout title="Prospecção" subtitle="Captação de leads B2B via Google Maps">
      <div className="p-6 space-y-5 max-w-[860px]">

        {/* Aviso de conformidade */}
        <div
          className="flex items-start gap-2.5 rounded-lg px-4 py-3 text-[12px]"
          style={{ backgroundColor: 'var(--color-amber-bg)', color: 'var(--color-text2)', border: '1px solid var(--color-amber)' }}
        >
          <AlertTriangle size={14} className="shrink-0 mt-0.5" style={{ color: 'var(--color-amber)' }} />
          <p>
            Leads captados entram como <strong>prospecção fria</strong> (sem optin): abordagem só pelo{' '}
            <strong>número dedicado</strong>, com opt-out fácil na primeira mensagem, warm-up gradual e
            disparos entre 08h–20h. Eles nunca entram em campanhas de marketing.
          </p>
        </div>

        {/* Formulário de busca */}
        <div
          className="rounded-lg p-5 space-y-4"
          style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
        >
          <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_140px] gap-4">
            <div>
              <label className={labelCls} style={{ color: 'var(--color-text2)' }}>O que buscar *</label>
              <input
                value={termo}
                onChange={e => setTermo(e.target.value)}
                placeholder="Ex: clínicas odontológicas"
                disabled={fase === 'buscando'}
                className={inputCls}
                style={inputStyle}
              />
            </div>
            <div>
              <label className={labelCls} style={{ color: 'var(--color-text2)' }}>Cidade *</label>
              <input
                value={cidade}
                onChange={e => setCidade(e.target.value)}
                placeholder="Ex: Blumenau, SC"
                disabled={fase === 'buscando'}
                className={inputCls}
                style={inputStyle}
              />
            </div>
            <div>
              <label className={labelCls} style={{ color: 'var(--color-text2)' }}>Quantidade</label>
              <select
                value={quantidade}
                onChange={e => setQuantidade(Number(e.target.value))}
                disabled={fase === 'buscando'}
                className={inputCls}
                style={inputStyle}
              >
                {[10, 20, 30, 50].map(q => <option key={q} value={q}>{q} leads</option>)}
              </select>
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer w-fit select-none">
            <input
              type="checkbox"
              checked={apenasSemSite}
              onChange={e => setApenasSemSite(e.target.checked)}
              disabled={fase === 'buscando'}
              className="w-4 h-4 rounded cursor-pointer"
              style={{ accentColor: 'var(--color-accent)' }}
            />
            <span className="text-[12px]" style={{ color: 'var(--color-text2)' }}>
              Somente empresas <strong>sem site</strong> (alvo para venda de presença digital)
            </span>
          </label>

          <div className="flex items-center gap-3">
            <button
              onClick={buscar}
              disabled={fase === 'buscando'}
              className="flex items-center gap-2 text-[13px] font-medium px-5 py-2.5 rounded-lg text-white disabled:opacity-60 transition-opacity hover:opacity-90"
              style={{ backgroundColor: 'var(--color-accent)' }}
            >
              {fase === 'buscando' ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
              {fase === 'buscando' ? 'Buscando leads…' : 'Buscar leads'}
            </button>
            {fase === 'buscando' && (
              <p className="text-[12px]" style={{ color: 'var(--color-text3)' }}>
                Varrendo o Google Maps — isso leva de 1 a 3 minutos. Pode continuar navegando em outra aba.
              </p>
            )}
          </div>

          {erro && (
            <div className="rounded-md px-3 py-2 text-[12px]" style={{ backgroundColor: 'var(--color-red-bg)', color: 'var(--color-red)' }}>
              {erro}
            </div>
          )}
        </div>

        {/* Resultado */}
        {fase === 'concluido' && resultado && (
          <div
            className="rounded-lg p-5 space-y-4"
            style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} style={{ color: 'var(--color-green)' }} />
              <h2 className="text-[14px] font-semibold" style={{ color: 'var(--color-text)' }}>Busca concluída</h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatBox label="Encontrados" valor={resultado.encontrados} cor="var(--color-blue)" bg="var(--color-blue-bg)" />
              <StatBox label="Com telefone" valor={resultado.comTelefone} cor="var(--color-accent)" bg="var(--color-purple-light)" />
              <StatBox label="Novos" valor={resultado.criados} cor="var(--color-green)" bg="var(--color-green-bg)" />
              <StatBox label="Enriquecidos" valor={resultado.enriquecidos} cor="var(--color-amber)" bg="var(--color-amber-bg)" />
            </div>

            {resultado.leads.length > 0 && (
              <div className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--color-border)' }}>
                {resultado.leads.slice(0, 20).map((l, i) => (
                  <div
                    key={l.telefone}
                    className="flex items-center gap-3 px-4 py-2.5"
                    style={{ borderTop: i > 0 ? '1px solid var(--color-border)' : undefined }}
                  >
                    <Users size={13} style={{ color: 'var(--color-text3)' }} className="shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium truncate" style={{ color: 'var(--color-text)' }}>{l.nome}</p>
                      {l.notas && <p className="text-[11px] truncate" style={{ color: 'var(--color-text3)' }}>{l.notas}</p>}
                    </div>
                    <span className="text-[12px] shrink-0" style={{ color: 'var(--color-text2)' }}>{l.telefone}</span>
                  </div>
                ))}
              </div>
            )}

            <a
              href="/contatos"
              className="inline-flex items-center gap-1.5 text-[13px] font-medium"
              style={{ color: 'var(--color-accent)' }}
            >
              Ver todos em Contatos <ArrowRight size={13} />
            </a>
          </div>
        )}

        {/* Dica inicial */}
        {fase === 'idle' && (
          <div className="flex items-center gap-2 text-[12px]" style={{ color: 'var(--color-text3)' }}>
            <MapPin size={13} />
            Busque por segmento + cidade (ex.: &quot;imobiliárias&quot; em &quot;Balneário Camboriú, SC&quot;) e os leads entram direto nos seus Contatos com a tag <code>prospeccao</code>.
          </div>
        )}
      </div>
    </AppLayout>
  )
}

function StatBox({ label, valor, cor, bg }: { label: string; valor: number; cor: string; bg: string }) {
  return (
    <div className="rounded-lg px-4 py-3" style={{ backgroundColor: bg }}>
      <p className="text-[20px] font-semibold" style={{ color: cor }}>{valor}</p>
      <p className="text-[11px]" style={{ color: 'var(--color-text2)' }}>{label}</p>
    </div>
  )
}
