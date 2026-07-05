'use client'

import { useState, useEffect } from 'react'
import { AppLayout } from '@/components/layout/AppLayout'
import { apiFetch } from '@/lib/auth'
import { MoreHorizontal, Plus, User, DollarSign, Clock, X } from 'lucide-react'

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface Oportunidade {
  id: string
  nome: string
  valorEstimado: number
  tags: string[]
  operador: { nome: string } | null
  diasNoEstagio: number
}
interface ColunaPipeline {
  id: string
  nome: string
  cor: string
  ordem: number
  oportunidades: Oportunidade[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatarValor(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
}

function iniciais(nome: string) {
  return nome.split(' ').map(n => n[0]).slice(0, 2).join('')
}

// ─── Card do pipeline ─────────────────────────────────────────────────────────

function PipelineCard({ card, cor, mostrarTempo }: { card: Oportunidade; cor: string; mostrarTempo: boolean }) {
  return (
    <div
      className="rounded-lg p-3.5 cursor-pointer transition-shadow hover:shadow-md group"
      style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
    >
      {/* Topo */}
      <div className="flex items-start justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-semibold shrink-0"
            style={{ backgroundColor: cor }}
          >
            {iniciais(card.nome)}
          </div>
          <p className="text-[12px] font-semibold truncate" style={{ color: 'var(--color-text)' }}>
            {card.nome}
          </p>
        </div>
        <button
          disabled
          title="Em breve"
          className="p-0.5 rounded opacity-0 group-hover:opacity-40 cursor-not-allowed transition-opacity shrink-0"
          style={{ color: 'var(--color-text3)' }}
        >
          <MoreHorizontal size={14} />
        </button>
      </div>

      {/* Valor estimado */}
      <div
        className="flex items-center gap-1.5 px-2 py-1.5 rounded-md mb-2.5"
        style={{ backgroundColor: 'var(--color-bg)' }}
      >
        <DollarSign size={11} style={{ color: 'var(--color-green)' }} />
        <span className="text-[12px] font-semibold" style={{ color: 'var(--color-green)' }}>
          {formatarValor(card.valorEstimado)}
        </span>
      </div>

      {/* Tags */}
      {card.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2.5">
          {card.tags.map(tag => (
            <span
              key={tag}
              className="text-[9px] font-medium px-1.5 py-0.5 rounded-full"
              style={{ backgroundColor: 'var(--color-purple-light)', color: 'var(--color-accent)' }}
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1" style={{ color: 'var(--color-text3)' }}>
          <User size={10} />
          <span className="text-[10px]">
            {card.operador ? card.operador.nome.split(' ')[0] : 'Sem operador'}
          </span>
        </div>
        {mostrarTempo && (
          <div className="flex items-center gap-1" style={{ color: card.diasNoEstagio > 5 ? 'var(--color-amber)' : 'var(--color-text3)' }}>
            <Clock size={10} />
            <span className="text-[10px]">{card.diasNoEstagio}d</span>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Coluna do pipeline ───────────────────────────────────────────────────────

function PipelineColuna({ coluna, onNovoCard }: { coluna: ColunaPipeline; onNovoCard: (colunaId: string) => void }) {
  const cards = coluna.oportunidades
  const totalValor = cards.reduce((s, c) => s + c.valorEstimado, 0)
  const etapaFinal = coluna.nome === 'Fechado' || coluna.nome === 'Perdido'

  return (
    <div className="flex flex-col w-[260px] shrink-0 h-full">
      <div
        className="flex items-center justify-between px-3 py-2.5 rounded-t-lg mb-2"
        style={{ backgroundColor: coluna.cor + '15', border: `1px solid ${coluna.cor}30` }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: coluna.cor }} />
          <span className="text-[12px] font-semibold truncate" style={{ color: 'var(--color-text)' }}>
            {coluna.nome}
          </span>
          <span
            className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full text-white shrink-0"
            style={{ backgroundColor: coluna.cor }}
          >
            {cards.length}
          </span>
        </div>
        <button disabled title="Em breve" className="opacity-40 cursor-not-allowed" style={{ color: 'var(--color-text3)' }}>
          <MoreHorizontal size={14} />
        </button>
      </div>

      {/* Total da coluna */}
      {cards.length > 0 && (
        <p className="text-[11px] font-medium px-1 mb-2" style={{ color: 'var(--color-text3)' }}>
          {formatarValor(totalValor)} em negociação
        </p>
      )}

      <div className="flex-1 overflow-y-auto scrollbar-thin space-y-2.5 px-0.5 pb-2" style={{ maxHeight: 'calc(100vh - 220px)' }}>
        {cards.length === 0 ? (
          <div
            className="flex items-center justify-center py-8 rounded-lg"
            style={{ border: '2px dashed var(--color-border)' }}
          >
            <p className="text-[11px]" style={{ color: 'var(--color-text3)' }}>Nenhum card</p>
          </div>
        ) : (
          cards.map(card => (
            <PipelineCard key={card.id} card={card} cor={coluna.cor} mostrarTempo={!etapaFinal} />
          ))
        )}
        <button
          onClick={() => onNovoCard(coluna.id)}
          className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] transition-colors hover:bg-gray-100"
          style={{ border: '1px dashed var(--color-border)', color: 'var(--color-text3)' }}
        >
          <Plus size={12} /> Adicionar
        </button>
      </div>
    </div>
  )
}

// ─── Modal: novo card ─────────────────────────────────────────────────────────

function ModalNovoCard({
  colunas, colunaInicial, onClose, onSalvo,
}: {
  colunas: ColunaPipeline[]
  colunaInicial: string | null
  onClose: () => void
  onSalvo: () => void
}) {
  const [nome, setNome] = useState('')
  const [valor, setValor] = useState('')
  const [tags, setTags] = useState('')
  const [colunaId, setColunaId] = useState(colunaInicial ?? colunas[0]?.id ?? '')
  const [erro, setErro] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)

  async function salvar() {
    setErro(null)
    if (!nome) { setErro('Informe o nome da oportunidade'); return }
    setSalvando(true)
    try {
      const res = await apiFetch('/api/pipeline/oportunidades', {
        method: 'POST',
        body: JSON.stringify({
          nome,
          valorEstimado: Number(valor.replace(',', '.')) || 0,
          tags: tags.split(',').map(t => t.trim()).filter(Boolean),
          kanbanColunaId: colunaId || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setErro(data?.error ?? 'Erro ao salvar'); return }
      onSalvo()
    } catch { setErro('Falha de conexão') } finally { setSalvando(false) }
  }

  const inputCls = 'w-full text-[13px] px-3 py-2.5 rounded-lg outline-none'
  const inputStyle = { border: '1.5px solid var(--color-purple-border)', backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' } as const
  const labelCls = 'text-[12px] font-medium block mb-1.5'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-xl shadow-2xl" style={{ backgroundColor: 'var(--color-surface)' }}>
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
          <p className="text-[15px] font-semibold" style={{ color: 'var(--color-text)' }}>Nova oportunidade</p>
          <button onClick={onClose} style={{ color: 'var(--color-text3)' }}><X size={18} /></button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div>
            <label className={labelCls} style={{ color: 'var(--color-text2)' }}>Nome / empresa *</label>
            <input value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Tech Solutions Ltda" className={inputCls} style={inputStyle} />
          </div>
          <div>
            <label className={labelCls} style={{ color: 'var(--color-text2)' }}>Valor estimado (R$)</label>
            <input type="number" min="0" value={valor} onChange={e => setValor(e.target.value)} placeholder="0" className={inputCls} style={inputStyle} />
          </div>
          <div>
            <label className={labelCls} style={{ color: 'var(--color-text2)' }}>Etapa</label>
            <select value={colunaId} onChange={e => setColunaId(e.target.value)} className={inputCls} style={inputStyle}>
              {colunas.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls} style={{ color: 'var(--color-text2)' }}>Tags (separadas por vírgula)</label>
            <input value={tags} onChange={e => setTags(e.target.value)} placeholder="b2b, vip" className={inputCls} style={inputStyle} />
          </div>
          {erro && <p className="text-[12px]" style={{ color: 'var(--color-red)' }}>{erro}</p>}
        </div>

        <div className="flex gap-3 px-6 py-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
          <button onClick={onClose} className="flex-1 py-2.5 rounded-lg text-[13px] font-medium" style={{ border: '1px solid var(--color-border)', color: 'var(--color-text2)' }}>
            Cancelar
          </button>
          <button onClick={salvar} disabled={salvando} className="flex-1 py-2.5 rounded-lg text-[13px] font-medium text-white disabled:opacity-50" style={{ backgroundColor: 'var(--color-accent)' }}>
            {salvando ? 'Salvando…' : 'Criar card'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Página ───────────────────────────────────────────────────────────────────

export default function PipelinePage() {
  const [colunas, setColunas] = useState<ColunaPipeline[]>([])
  const [operadorFiltro, setOperadorFiltro] = useState('')
  const [modalColuna, setModalColuna] = useState<string | null>(null)
  const [modalAberto, setModalAberto] = useState(false)

  function carregarPipeline() {
    apiFetch('/api/pipeline')
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setColunas(d as ColunaPipeline[]) })
      .catch(() => {})
  }
  useEffect(() => { carregarPipeline() }, [])

  function abrirModal(colunaId: string | null) {
    setModalColuna(colunaId)
    setModalAberto(true)
  }

  const operadores = Array.from(new Set(
    colunas.flatMap(c => c.oportunidades.map(o => o.operador?.nome)).filter(Boolean) as string[]
  ))

  const colunasFiltradas = colunas.map(c => ({
    ...c,
    oportunidades: operadorFiltro
      ? c.oportunidades.filter(o => o.operador?.nome === operadorFiltro)
      : c.oportunidades,
  }))

  const totalGeral = colunasFiltradas
    .filter(c => c.nome !== 'Perdido')
    .flatMap(c => c.oportunidades)
    .reduce((s, c) => s + c.valorEstimado, 0)

  return (
    <AppLayout title="Pipeline de Vendas" subtitle="Gestão visual do funil de vendas">
      <div className="flex flex-col h-[calc(100vh-58px)]">
        {/* Barra de controles */}
        <div
          className="flex items-center justify-between px-6 py-3 border-b shrink-0"
          style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold"
              style={{ backgroundColor: 'var(--color-green-bg)', color: 'var(--color-green)' }}
            >
              <DollarSign size={13} />
              {formatarValor(totalGeral)} em pipeline
            </div>
          </div>
          <div className="flex items-center gap-2">
            <select
              className="text-[12px] px-3 py-1.5 rounded-md outline-none"
              style={{ border: '1px solid var(--color-border)', color: 'var(--color-text2)', backgroundColor: 'var(--color-surface)' }}
              value={operadorFiltro}
              onChange={e => setOperadorFiltro(e.target.value)}
            >
              <option value="">Todos os operadores</option>
              {operadores.map(op => <option key={op}>{op}</option>)}
            </select>
            <button
              onClick={() => abrirModal(null)}
              className="flex items-center gap-1.5 text-[12px] px-3 py-1.5 rounded-md text-white transition-opacity hover:opacity-80"
              style={{ backgroundColor: 'var(--color-accent)' }}
            >
              <Plus size={13} /> Novo card
            </button>
          </div>
        </div>

        {/* Board */}
        <div className="flex-1 overflow-x-auto">
          <div className="flex gap-4 p-6 h-full" style={{ minWidth: 'max-content' }}>
            {colunasFiltradas.length === 0 ? (
              <div className="text-[13px] p-4" style={{ color: 'var(--color-text3)' }}>
                Nenhuma coluna de pipeline ainda.
              </div>
            ) : (
              colunasFiltradas.map(coluna => (
                <PipelineColuna key={coluna.id} coluna={coluna} onNovoCard={abrirModal} />
              ))
            )}
          </div>
        </div>
      </div>

      {modalAberto && (
        <ModalNovoCard
          colunas={colunas}
          colunaInicial={modalColuna}
          onClose={() => setModalAberto(false)}
          onSalvo={() => { setModalAberto(false); carregarPipeline() }}
        />
      )}
    </AppLayout>
  )
}
