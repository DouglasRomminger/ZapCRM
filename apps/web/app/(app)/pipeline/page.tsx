'use client'

import { useState } from 'react'
import { AppLayout } from '@/components/layout/AppLayout'
import { mockCardsPipeline } from '@/src/mocks/pipeline'
import { mockColunasPipeline } from '@/src/mocks/kanban'
import type { CardPipeline, KanbanColuna } from '@/src/types'
import { MoreHorizontal, Plus, User, Tag, DollarSign, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatarValor(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
}

function iniciais(nome: string) {
  return nome.split(' ').map(n => n[0]).slice(0, 2).join('')
}

// ─── Card do pipeline ─────────────────────────────────────────────────────────

function PipelineCard({ card, cor }: { card: CardPipeline; cor: string }) {
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
          className="p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
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
        {card.colunaId !== 'p5' && card.colunaId !== 'p6' && (
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

function PipelineColuna({ coluna, cards }: { coluna: KanbanColuna; cards: CardPipeline[] }) {
  const totalValor = cards.reduce((s, c) => s + c.valorEstimado, 0)

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
        <button style={{ color: 'var(--color-text3)' }}>
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
          cards.map(card => <PipelineCard key={card.id} card={card} cor={coluna.cor} />)
        )}
        <button
          className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] transition-colors hover:bg-gray-100"
          style={{ border: '1px dashed var(--color-border)', color: 'var(--color-text3)' }}
        >
          <Plus size={12} /> Adicionar
        </button>
      </div>
    </div>
  )
}

// ─── Página ───────────────────────────────────────────────────────────────────

export default function PipelinePage() {
  const [operadorFiltro, setOperadorFiltro] = useState('')

  const cardsPorColuna = (colunaId: string) =>
    mockCardsPipeline.filter(c =>
      c.colunaId === colunaId &&
      (!operadorFiltro || c.operador?.nome === operadorFiltro)
    )

  const totalGeral = mockCardsPipeline
    .filter(c => c.colunaId !== 'p6')
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
              <option>Ana Costa</option>
              <option>Bruno Lima</option>
            </select>
            <button
              className="flex items-center gap-1.5 text-[12px] px-3 py-1.5 rounded-md text-white"
              style={{ backgroundColor: 'var(--color-accent)' }}
            >
              <Plus size={13} /> Novo card
            </button>
          </div>
        </div>

        {/* Board */}
        <div className="flex-1 overflow-x-auto">
          <div className="flex gap-4 p-6 h-full" style={{ minWidth: 'max-content' }}>
            {mockColunasPipeline.map(coluna => (
              <PipelineColuna
                key={coluna.id}
                coluna={coluna}
                cards={cardsPorColuna(coluna.id)}
              />
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
