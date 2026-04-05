'use client'

import { useState } from 'react'
import { AppLayout } from '@/components/layout/AppLayout'
import { mockChats } from '@/src/mocks/chats'
import { mockColunasAtendimento } from '@/src/mocks/kanban'
import type { Chat, KanbanColuna } from '@/src/types'
import { MoreHorizontal, Plus, Clock, User, MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function tempoRelativo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  if (diff < 60000) return 'agora'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m atrás`
  return `${Math.floor(diff / 3600000)}h atrás`
}

function iniciais(nome: string) {
  return nome.split(' ').map(n => n[0]).slice(0, 2).join('')
}

// ─── Card de chat no Kanban ────────────────────────────────────────────────────

function KanbanCard({ chat, cor }: { chat: Chat; cor: string }) {
  const urgente = chat.status === 'AGUARDANDO' && (Date.now() - new Date(chat.atualizadoEm).getTime()) > 10 * 60000

  return (
    <div
      className={cn(
        'rounded-lg p-3.5 cursor-pointer transition-shadow hover:shadow-md group',
        urgente && 'ring-1 ring-[var(--color-red)]'
      )}
      style={{
        backgroundColor: 'var(--color-surface)',
        border: `1px solid ${urgente ? 'var(--color-red)' : 'var(--color-border)'}`,
      }}
    >
      {/* Topo do card */}
      <div className="flex items-start justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-semibold shrink-0"
            style={{ backgroundColor: cor }}
          >
            {iniciais(chat.contato.nome)}
          </div>
          <div className="min-w-0">
            <p className="text-[12px] font-semibold truncate" style={{ color: 'var(--color-text)' }}>
              {chat.contato.nome}
            </p>
            <p className="text-[10px]" style={{ color: 'var(--color-text3)' }}>
              {chat.contato.telefone.slice(-8).replace(/(\d{4})(\d{4})/, '$1-$2')}
            </p>
          </div>
        </div>
        <button
          className="p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ color: 'var(--color-text3)' }}
        >
          <MoreHorizontal size={14} />
        </button>
      </div>

      {/* Última mensagem */}
      {chat.ultimaMensagem && (
        <p
          className="text-[11px] line-clamp-2 mb-2.5 px-2 py-1.5 rounded-md"
          style={{ color: 'var(--color-text2)', backgroundColor: 'var(--color-bg)' }}
        >
          {chat.ultimaMensagem.conteudo}
        </p>
      )}

      {/* Footer do card */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Operador */}
          {chat.operador ? (
            <div
              className="flex items-center gap-1 text-[10px]"
              style={{ color: 'var(--color-text3)' }}
            >
              <User size={10} />
              <span>{chat.operador.nome.split(' ')[0]}</span>
            </div>
          ) : (
            <span
              className="text-[10px] px-1.5 py-0.5 rounded-full"
              style={{ backgroundColor: 'var(--color-blue-bg)', color: 'var(--color-blue)' }}
            >
              Sem operador
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Não lidas */}
          {chat.totalNaoLidas > 0 && (
            <span
              className="flex items-center gap-0.5 text-[10px] font-semibold"
              style={{ color: 'var(--color-accent)' }}
            >
              <MessageSquare size={10} />
              {chat.totalNaoLidas}
            </span>
          )}
          {/* Tempo */}
          <span
            className="flex items-center gap-0.5 text-[10px]"
            style={{ color: urgente ? 'var(--color-red)' : 'var(--color-text3)' }}
          >
            <Clock size={10} />
            {tempoRelativo(chat.atualizadoEm)}
          </span>
        </div>
      </div>
    </div>
  )
}

// ─── Coluna do Kanban ─────────────────────────────────────────────────────────

function KanbanColuna_({ coluna, chats }: { coluna: KanbanColuna; chats: Chat[] }) {
  return (
    <div className="flex flex-col w-[272px] shrink-0 h-full">
      {/* Header da coluna */}
      <div
        className="flex items-center justify-between px-3 py-2.5 rounded-t-lg mb-2"
        style={{ backgroundColor: coluna.cor + '15', border: `1px solid ${coluna.cor}30` }}
      >
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: coluna.cor }} />
          <span className="text-[13px] font-semibold" style={{ color: 'var(--color-text)' }}>{coluna.nome}</span>
          <span
            className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full text-white"
            style={{ backgroundColor: coluna.cor }}
          >
            {chats.length}
          </span>
        </div>
        <button style={{ color: 'var(--color-text3)' }}>
          <MoreHorizontal size={14} />
        </button>
      </div>

      {/* Cards */}
      <div
        className="flex-1 overflow-y-auto scrollbar-thin space-y-2.5 px-0.5 pb-2"
        style={{ maxHeight: 'calc(100vh - 200px)' }}
      >
        {chats.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-8 rounded-lg text-center"
            style={{ border: '2px dashed var(--color-border)' }}
          >
            <p className="text-[11px]" style={{ color: 'var(--color-text3)' }}>Nenhum chat nesta coluna</p>
          </div>
        ) : (
          chats.map(chat => (
            <KanbanCard key={chat.id} chat={chat} cor={coluna.cor} />
          ))
        )}

        {/* Adicionar card */}
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

export default function KanbanPage() {
  const [tipo, setTipo] = useState<'ATENDIMENTO' | 'PIPELINE'>('ATENDIMENTO')

  // Distribui os chats mock pelas colunas
  const chatsPorColuna = (colunaId: string) =>
    mockChats.filter(c => c.kanbanColuna?.id === colunaId)

  return (
    <AppLayout
      title="Kanban"
      subtitle="Gestão visual dos atendimentos"
    >
      <div className="flex flex-col h-[calc(100vh-58px)]">
        {/* Barra de controles */}
        <div
          className="flex items-center justify-between px-6 py-3 border-b shrink-0"
          style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
        >
          {/* Toggle Atendimento / Pipeline */}
          <div
            className="flex items-center p-0.5 rounded-lg gap-0.5"
            style={{ backgroundColor: 'var(--color-bg)' }}
          >
            {(['ATENDIMENTO', 'PIPELINE'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTipo(t)}
                className="px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors"
                style={{
                  backgroundColor: tipo === t ? 'var(--color-surface)' : 'transparent',
                  color: tipo === t ? 'var(--color-accent)' : 'var(--color-text2)',
                  boxShadow: tipo === t ? '0 1px 3px rgba(0,0,0,0.08)' : undefined,
                }}
              >
                {t === 'ATENDIMENTO' ? 'Atendimentos' : 'Pipeline de Vendas'}
              </button>
            ))}
          </div>

          {/* Filtros */}
          <div className="flex items-center gap-2">
            <select
              className="text-[12px] px-3 py-1.5 rounded-md outline-none"
              style={{ border: '1px solid var(--color-border)', color: 'var(--color-text2)', backgroundColor: 'var(--color-surface)' }}
            >
              <option>Todos os operadores</option>
              <option>Ana Costa</option>
              <option>Bruno Lima</option>
            </select>
            <button
              className="flex items-center gap-1.5 text-[12px] px-3 py-1.5 rounded-md text-white"
              style={{ backgroundColor: 'var(--color-accent)' }}
            >
              <Plus size={13} /> Nova coluna
            </button>
          </div>
        </div>

        {/* Board */}
        <div className="flex-1 overflow-x-auto">
          <div className="flex gap-4 p-6 h-full" style={{ minWidth: 'max-content' }}>
            {mockColunasAtendimento.map(coluna => (
              <KanbanColuna_
                key={coluna.id}
                coluna={coluna}
                chats={chatsPorColuna(coluna.id)}
              />
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
