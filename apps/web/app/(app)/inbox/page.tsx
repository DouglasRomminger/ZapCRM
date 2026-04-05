'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Sidebar } from '@/components/layout/Sidebar'
import { mockColunasAtendimento } from '@/src/mocks/kanban'
import { mockUsuarioLogado } from '@/src/mocks/usuarios'
import type { Chat, MensagemDisplay } from '@/src/types'
import { io } from 'socket.io-client'

const API_URL    = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'
const EMPRESA_ID = process.env.NEXT_PUBLIC_DEV_EMPRESA_ID ?? 'empresa-dev-001'

async function apiFetch(path: string, options?: RequestInit) {
  return fetch(`${API_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', 'x-empresa-id': EMPRESA_ID, ...(options?.headers ?? {}) },
  })
}

// ─── Hook: lista de chats em tempo real ───────────────────────────────────────

function useChats() {
  const [chats, setChats] = useState<Chat[]>([])
  const [carregando, setCarregando] = useState(true)

  const buscarChats = useCallback(async () => {
    try {
      const res  = await apiFetch('/api/chats')
      const data = await res.json()
      if (Array.isArray(data)) setChats(data as Chat[])
    } catch { /* mantém estado anterior */ }
    finally { setCarregando(false) }
  }, [])

  useEffect(() => { buscarChats() }, [buscarChats])

  useEffect(() => {
    const socket = io(API_URL, { auth: { empresaId: EMPRESA_ID } })
    socket.on('nova_mensagem', ({ chatId }: { chatId: string }) => {
      setChats(prev => prev.map(c =>
        c.id === chatId ? { ...c, totalNaoLidas: c.totalNaoLidas + 1, atualizadoEm: new Date().toISOString() } : c
      ).sort((a, b) => new Date(b.atualizadoEm).getTime() - new Date(a.atualizadoEm).getTime()))
    })
    socket.on('chat_atualizado', () => { buscarChats() })
    return () => { socket.disconnect() }
  }, [buscarChats])

  return { chats, carregando, recarregar: buscarChats }
}
import {
  Search, Send, Paperclip, Smile, MoreVertical,
  User, Clock, ChevronRight, CheckCheck, Check,
  ArrowLeftRight, XCircle, Lock, Zap, Bell,
  Tag, Star, MessageSquare, Filter, Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function tempoRelativo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  if (diff < 60000) return 'agora'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`
  return `${Math.floor(diff / 86400000)}d`
}

function iniciais(nome: string) {
  return nome.split(' ').map(n => n[0]).slice(0, 2).join('')
}

type Filtro = 'Todos' | 'Meus' | 'Fila' | 'VIP'

function filtrarChats(chats: Chat[], filtro: Filtro, busca: string) {
  const uid = mockUsuarioLogado.id
  let resultado = chats
  if (filtro === 'Meus')  resultado = chats.filter(c => c.operador?.id === uid)
  if (filtro === 'Fila')  resultado = chats.filter(c => !c.operador)
  if (filtro === 'VIP')   resultado = chats.filter(c => c.contato.tags.includes('vip'))
  if (busca) resultado = resultado.filter(c =>
    c.contato.nome.toLowerCase().includes(busca.toLowerCase())
  )
  return resultado
}

// ─── ChatItem ─────────────────────────────────────────────────────────────────

function ChatItem({ chat, active, onClick }: { chat: Chat; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-start gap-3 px-4 py-3 transition-colors text-left border-b relative',
        active ? 'bg-[var(--color-purple-light)]' : 'hover:bg-gray-50'
      )}
      style={{ borderColor: 'var(--color-border)' }}
    >
      {active && (
        <span
          className="absolute left-0 top-0 bottom-0 w-[3px] rounded-r"
          style={{ backgroundColor: 'var(--color-accent)' }}
        />
      )}
      <div className="relative shrink-0 mt-0.5">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-white text-[11px] font-semibold"
          style={{ backgroundColor: active ? 'var(--color-accent)' : '#CBD5E1' }}
        >
          {iniciais(chat.contato.nome)}
        </div>
        <span
          className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white"
          style={{ backgroundColor: chat.kanbanColuna?.cor ?? '#888' }}
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2">
          <span
            className={cn('text-[13px] truncate', active ? 'font-semibold' : 'font-medium')}
            style={{ color: 'var(--color-text)' }}
          >
            {chat.contato.nome}
          </span>
          <span className="text-[10px] shrink-0" style={{ color: 'var(--color-text3)' }}>
            {chat.ultimaMensagem ? tempoRelativo(chat.ultimaMensagem.criadaEm) : ''}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2 mt-0.5">
          <p className="text-[11px] truncate" style={{ color: 'var(--color-text3)' }}>
            {chat.ultimaMensagem?.autorId ? '↩ ' : ''}{chat.ultimaMensagem?.conteudo}
          </p>
          {chat.totalNaoLidas > 0 && (
            <span
              className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 text-white min-w-[18px] text-center"
              style={{ backgroundColor: 'var(--color-accent)' }}
            >
              {chat.totalNaoLidas}
            </span>
          )}
        </div>
        {chat.kanbanColuna && (
          <div className="flex items-center gap-1 mt-1">
            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: chat.kanbanColuna.cor }} />
            <span className="text-[10px] truncate" style={{ color: 'var(--color-text3)' }}>
              {chat.kanbanColuna.nome}
            </span>
          </div>
        )}
      </div>
    </button>
  )
}

// ─── KanbanProgress ───────────────────────────────────────────────────────────

function KanbanProgress({ chat }: { chat: Chat }) {
  const colunas = mockColunasAtendimento
  const idxAtual = colunas.findIndex(c => c.id === chat.kanbanColuna?.id)

  return (
    <div className="flex flex-col gap-1 flex-1 max-w-[380px]">
      <div className="flex items-center gap-0.5">
        {colunas.map((col, i) => (
          <div key={col.id} className="flex items-center gap-0.5 flex-1 min-w-0">
            <div
              className="flex-1 flex items-center justify-center px-1 py-0.5 rounded text-[9px] font-medium truncate"
              style={{
                backgroundColor: i === idxAtual ? col.cor : i < idxAtual ? col.cor + '25' : 'var(--color-bg)',
                color: i === idxAtual ? '#fff' : i < idxAtual ? col.cor : 'var(--color-text3)',
                border: `1px solid ${i <= idxAtual ? col.cor + '50' : 'var(--color-border)'}`,
              }}
            >
              {col.nome.split(' ')[0]}
            </div>
            {i < colunas.length - 1 && (
              <ChevronRight size={8} style={{ color: 'var(--color-border)', flexShrink: 0 }} />
            )}
          </div>
        ))}
      </div>
      <div className="h-1 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-bg)' }}>
        <div
          className="h-1 rounded-full transition-all duration-500"
          style={{
            width: `${((idxAtual + 1) / colunas.length) * 100}%`,
            backgroundColor: chat.kanbanColuna?.cor ?? 'var(--color-accent)',
          }}
        />
      </div>
    </div>
  )
}

// ─── ChatTopbar ────────────────────────────────────────────────────────────────

function ChatTopbar({ chat }: { chat: Chat }) {
  return (
    <div
      className="flex items-center justify-between px-5 h-[58px] border-b shrink-0 gap-4"
      style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
    >
      <div className="flex items-center gap-3 shrink-0">
        <div className="relative">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-semibold"
            style={{ backgroundColor: 'var(--color-accent)' }}
          >
            {iniciais(chat.contato.nome)}
          </div>
          <span
            className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white"
            style={{ backgroundColor: 'var(--color-green)' }}
          />
        </div>
        <div>
          <p className="text-[13px] font-semibold" style={{ color: 'var(--color-text)' }}>
            {chat.contato.nome}
          </p>
          <p className="text-[10px]" style={{ color: 'var(--color-text3)' }}>
            {chat.contato.telefone} · online agora
          </p>
        </div>
      </div>

      <KanbanProgress chat={chat} />

      <div className="flex items-center gap-1.5 shrink-0">
        <button
          className="flex items-center gap-1 text-[11px] font-medium px-2.5 py-1.5 rounded-md transition-colors hover:bg-gray-50"
          style={{ border: '1px solid var(--color-border)', color: 'var(--color-text2)' }}
        >
          <ArrowLeftRight size={11} /> Transferir
        </button>
        <button
          className="flex items-center gap-1 text-[11px] font-medium px-2.5 py-1.5 rounded-md transition-colors hover:bg-gray-50"
          style={{ border: '1px solid var(--color-border)', color: 'var(--color-text2)' }}
        >
          <Bell size={11} /> Soneca
        </button>
        <button
          className="flex items-center gap-1 text-[11px] font-medium px-2.5 py-1.5 rounded-md text-white transition-opacity hover:opacity-80"
          style={{ backgroundColor: 'var(--color-red)' }}
        >
          <XCircle size={11} /> Encerrar
        </button>
        <button
          className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
          style={{ color: 'var(--color-text2)' }}
        >
          <MoreVertical size={14} />
        </button>
      </div>
    </div>
  )
}

// ─── Bolha de mensagem ────────────────────────────────────────────────────────

function BolhaMensagem({ msg }: { msg: MensagemDisplay }) {
  const isOperador = !!msg.autorId
  return (
    <div className={cn('flex items-end gap-2', isOperador ? 'justify-end' : 'justify-start')}>
      {!isOperador && (
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-semibold shrink-0 mb-0.5"
          style={{ backgroundColor: '#CBD5E1' }}
        >
          C
        </div>
      )}
      <div
        className="max-w-[65%] px-3.5 py-2.5 text-[13px] shadow-sm"
        style={{
          backgroundColor: isOperador ? 'var(--color-accent)' : 'var(--color-surface)',
          color: isOperador ? '#fff' : 'var(--color-text)',
          borderRadius: isOperador ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
          border: isOperador ? undefined : '1px solid var(--color-border)',
        }}
      >
        {isOperador && msg.autorNome && (
          <p className="text-[9px] font-semibold mb-1 opacity-70">{msg.autorNome}</p>
        )}
        <p className="leading-relaxed">{msg.conteudo}</p>
        <div className={cn('flex items-center gap-1 mt-1', isOperador ? 'justify-end' : 'justify-start')}>
          <span className="text-[9px] opacity-60">{tempoRelativo(msg.criadaEm)}</span>
          {isOperador && (msg.lida
            ? <CheckCheck size={10} className="opacity-60" />
            : <Check size={10} className="opacity-60" />
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Nota interna ─────────────────────────────────────────────────────────────

function NotaInterna({ msg }: { msg: MensagemDisplay }) {
  return (
    <div className="flex justify-center">
      <div
        className="max-w-[70%] px-3.5 py-2.5 rounded-xl text-[12px]"
        style={{ backgroundColor: 'var(--color-amber-bg)', border: '1px solid var(--color-amber)' }}
      >
        <div className="flex items-center gap-1.5 mb-1.5" style={{ color: 'var(--color-amber)' }}>
          <Lock size={10} />
          <span className="text-[10px] font-semibold">Nota interna · {msg.autorNome}</span>
        </div>
        <p style={{ color: 'var(--color-text)' }}>{msg.conteudo}</p>
      </div>
    </div>
  )
}

// ─── Log de atividade ─────────────────────────────────────────────────────────

function LogAtividade({ msg }: { msg: MensagemDisplay }) {
  return (
    <div className="flex items-center gap-3 py-0.5">
      <div className="flex-1 h-px" style={{ backgroundColor: 'var(--color-border)' }} />
      <span className="text-[10px] px-2 shrink-0 italic" style={{ color: 'var(--color-text3)' }}>
        {msg.conteudo} · {tempoRelativo(msg.criadaEm)}
      </span>
      <div className="flex-1 h-px" style={{ backgroundColor: 'var(--color-border)' }} />
    </div>
  )
}

// ─── Respostas rápidas ────────────────────────────────────────────────────────

const RESPOSTAS_RAPIDAS = [
  'Olá! Como posso te ajudar? 😊',
  'Pode me dar mais detalhes?',
  'Vou verificar e já te retorno!',
  'Obrigado! Qualquer dúvida, estou aqui.',
]

// ─── Área central de mensagens ────────────────────────────────────────────────

function AreaMensagens({ chat }: { chat: Chat }) {
  const [modoNota, setModoNota] = useState(false)
  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [mostrarRespostas, setMostrarRespostas] = useState(false)
  const [mensagens, setMensagens] = useState<MensagemDisplay[]>([])
  const bottomRef = useRef<HTMLDivElement>(null)

  // Carrega mensagens ao trocar de chat
  useEffect(() => {
    setMensagens([])
    apiFetch(`/api/chats/${chat.id}/mensagens`)
      .then(r => r.json())
      .then((data: MensagemDisplay[]) => setMensagens(data))
      .catch(() => {})
  }, [chat.id])

  // Socket.io — novas mensagens em tempo real
  useEffect(() => {
    const socket = io(API_URL, { auth: { empresaId: EMPRESA_ID } })
    socket.on('nova_mensagem', ({ chatId, mensagem }: { chatId: string; mensagem: MensagemDisplay }) => {
      if (chatId === chat.id) setMensagens(prev => [...prev, mensagem])
    })
    return () => { socket.disconnect() }
  }, [chat.id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensagens])

  const enviarMensagem = async () => {
    if (!texto.trim() || enviando) return
    setEnviando(true)
    try {
      await apiFetch(`/api/chats/${chat.id}/mensagens`, {
        method: 'POST',
        body: JSON.stringify({ conteudo: texto.trim(), tipo: modoNota ? 'nota_interna' : 'texto' }),
      })
      setTexto('')
    } catch { /* erro silencioso por ora */ }
    finally { setEnviando(false) }
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Mensagens */}
      <div
        className="flex-1 overflow-y-auto px-5 py-5 space-y-3 scrollbar-thin"
        style={{ backgroundColor: 'var(--color-bg)' }}
      >
        {mensagens.map(msg => {
          if (msg.tipo === 'log_atividade') return <LogAtividade key={msg.id} msg={msg} />
          if (msg.tipo === 'nota_interna')  return <NotaInterna  key={msg.id} msg={msg} />
          return <BolhaMensagem key={msg.id} msg={msg} />
        })}
        <div ref={bottomRef} />
      </div>

      {/* Respostas rápidas */}
      {mostrarRespostas && (
        <div
          className="px-4 py-2.5 border-t flex gap-2 flex-wrap"
          style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
        >
          {RESPOSTAS_RAPIDAS.map(r => (
            <button
              key={r}
              onClick={() => { setTexto(r); setMostrarRespostas(false) }}
              className="text-[11px] font-medium px-3 py-1.5 rounded-full transition-opacity hover:opacity-80"
              style={{ backgroundColor: 'var(--color-purple-light)', color: 'var(--color-accent)' }}
            >
              {r}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div
        className="px-4 pt-2.5 pb-3 border-t shrink-0"
        style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
      >
        {/* Toggles */}
        <div className="flex items-center gap-1 mb-2.5">
          <button
            onClick={() => setModoNota(false)}
            className="text-[11px] font-medium px-2.5 py-1 rounded-md transition-colors"
            style={{
              backgroundColor: !modoNota ? 'var(--color-purple-light)' : 'transparent',
              color: !modoNota ? 'var(--color-accent)' : 'var(--color-text3)',
            }}
          >
            Mensagem
          </button>
          <button
            onClick={() => setModoNota(true)}
            className="flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-md transition-colors"
            style={{
              backgroundColor: modoNota ? 'var(--color-amber-bg)' : 'transparent',
              color: modoNota ? 'var(--color-amber)' : 'var(--color-text3)',
            }}
          >
            <Lock size={10} /> Nota interna
          </button>
          <div className="flex-1" />
          <button
            onClick={() => setMostrarRespostas(r => !r)}
            className="flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-md transition-colors"
            style={{
              backgroundColor: mostrarRespostas ? 'var(--color-purple-light)' : 'transparent',
              color: mostrarRespostas ? 'var(--color-accent)' : 'var(--color-text3)',
            }}
          >
            <Zap size={10} /> Respostas rápidas
          </button>
        </div>

        {/* Campo de texto */}
        <div
          className="flex items-end gap-2.5 px-3.5 py-2.5 rounded-xl"
          style={{
            border: `1.5px solid ${modoNota ? 'var(--color-amber)' : 'var(--color-purple-border)'}`,
            backgroundColor: modoNota ? 'var(--color-amber-bg)' : 'var(--color-bg)',
          }}
        >
          <button style={{ color: 'var(--color-text3)' }} className="pb-0.5">
            <Smile size={17} />
          </button>
          <button style={{ color: 'var(--color-text3)' }} className="pb-0.5">
            <Paperclip size={17} />
          </button>
          <textarea
            rows={1}
            value={texto}
            onChange={e => setTexto(e.target.value)}
            placeholder={modoNota ? 'Escrever nota interna (visível apenas para a equipe)...' : 'Digite uma mensagem...'}
            className="flex-1 bg-transparent text-[13px] outline-none resize-none leading-relaxed"
            style={{ color: 'var(--color-text)', maxHeight: '120px' }}
            onInput={e => {
              const el = e.currentTarget
              el.style.height = 'auto'
              el.style.height = el.scrollHeight + 'px'
            }}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviarMensagem() }
            }}
          />
          <button
            onClick={enviarMensagem}
            disabled={!texto.trim() || enviando}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white transition-opacity hover:opacity-80 disabled:opacity-40 shrink-0"
            style={{ backgroundColor: modoNota ? 'var(--color-amber)' : 'var(--color-accent)' }}
          >
            {enviando ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Painel do contato ────────────────────────────────────────────────────────

function PainelContato({ chat }: { chat: Chat }) {
  const c = chat.contato
  return (
    <div
      className="flex flex-col h-full overflow-y-auto scrollbar-thin"
      style={{ backgroundColor: 'var(--color-surface)', borderLeft: '1px solid var(--color-border)' }}
    >
      <div className="px-4 py-5 border-b text-center" style={{ borderColor: 'var(--color-border)' }}>
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center text-white text-[16px] font-semibold mx-auto mb-3"
          style={{ backgroundColor: 'var(--color-accent)' }}
        >
          {iniciais(c.nome)}
        </div>
        <p className="text-[14px] font-semibold" style={{ color: 'var(--color-text)' }}>{c.nome}</p>
        <p className="text-[12px] mt-0.5" style={{ color: 'var(--color-text3)' }}>
          {c.telefone.replace(/(\d{2})(\d{2})(\d{5})(\d{4})/, '+$1 ($2) $3-$4')}
        </p>
        <div className="flex flex-wrap justify-center gap-1.5 mt-2.5">
          {c.tags.map(tag => (
            <span
              key={tag}
              className="text-[10px] font-medium px-2 py-0.5 rounded-full"
              style={{ backgroundColor: 'var(--color-purple-light)', color: 'var(--color-accent)' }}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="px-4 py-4 space-y-5">
        <InfoSection title="Contato" icon={User}>
          <InfoRow label="E-mail" value={c.email ?? '—'} />
          <InfoRow
            label="Opt-in"
            value={c.optin ? '✓ Ativo' : '✗ Inativo'}
            valueColor={c.optin ? 'var(--color-green)' : 'var(--color-red)'}
          />
        </InfoSection>

        <InfoSection title="Atendimento" icon={Clock}>
          <InfoRow label="Operador" value={chat.operador?.nome ?? 'Na fila'} />
          <InfoRow label="Coluna" value={chat.kanbanColuna?.nome ?? '—'} />
        </InfoSection>

        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text3)' }}>
            Ações
          </p>
          <button
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] font-medium transition-opacity hover:opacity-80"
            style={{ backgroundColor: 'var(--color-purple-light)', color: 'var(--color-accent)' }}
          >
            <Tag size={12} /> Ver histórico completo
          </button>
          <button
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] font-medium transition-opacity hover:opacity-80"
            style={{ backgroundColor: 'var(--color-blue-bg)', color: 'var(--color-blue)' }}
          >
            <Star size={12} /> Marcar como VIP
          </button>
        </div>
      </div>
    </div>
  )
}

function InfoSection({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2.5">
        <Icon size={11} style={{ color: 'var(--color-text3)' }} />
        <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text3)' }}>
          {title}
        </p>
      </div>
      <div className="space-y-2 text-[12px]">{children}</div>
    </div>
  )
}

function InfoRow({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <div className="flex justify-between gap-2 items-baseline">
      <span style={{ color: 'var(--color-text2)' }}>{label}</span>
      <span className="font-medium text-right truncate" style={{ color: valueColor ?? 'var(--color-text)' }}>
        {value}
      </span>
    </div>
  )
}

// ─── Estado vazio ─────────────────────────────────────────────────────────────

function EstadoVazio() {
  return (
    <div className="flex-1 flex items-center justify-center" style={{ backgroundColor: 'var(--color-bg)' }}>
      <div className="text-center">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ backgroundColor: 'var(--color-purple-light)' }}
        >
          <MessageSquare size={28} style={{ color: 'var(--color-accent)' }} />
        </div>
        <p className="text-[14px] font-semibold" style={{ color: 'var(--color-text)' }}>Selecione uma conversa</p>
        <p className="text-[12px] mt-1" style={{ color: 'var(--color-text3)' }}>Escolha um chat na lista ao lado</p>
      </div>
    </div>
  )
}

// ─── Página ───────────────────────────────────────────────────────────────────

export default function InboxPage() {
  const { chats, carregando } = useChats()
  const [chatAtivo, setChatAtivo] = useState<Chat | null>(null)
  const [busca, setBusca] = useState('')
  const [filtro, setFiltro] = useState<Filtro>('Todos')

  const filtros: Filtro[] = ['Todos', 'Meus', 'Fila', 'VIP']
  const chatsFiltrados = filtrarChats(chats, filtro, busca)
  const totalNaoLidas = chats.reduce((s, c) => s + c.totalNaoLidas, 0)

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: 'var(--color-bg)' }}>
      <Sidebar />

      <div className="flex flex-1 ml-[220px]">
        {/* ─── Coluna esquerda: lista de conversas ─── */}
        <div
          className="w-[300px] flex flex-col h-screen border-r shrink-0"
          style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
        >
          {/* Header */}
          <div
            className="px-4 h-[58px] flex items-center gap-2 border-b shrink-0"
            style={{ borderColor: 'var(--color-border)' }}
          >
            <h1 className="text-[16px] font-semibold flex-1" style={{ color: 'var(--color-text)' }}>Inbox</h1>
            {totalNaoLidas > 0 && (
              <span
                className="text-[11px] font-semibold px-2 py-0.5 rounded-full text-white"
                style={{ backgroundColor: 'var(--color-accent)' }}
              >
                {totalNaoLidas}
              </span>
            )}
            <button style={{ color: 'var(--color-text3)' }}>
              <Filter size={14} />
            </button>
          </div>

          {/* Busca */}
          <div className="px-3 py-2.5 border-b shrink-0" style={{ borderColor: 'var(--color-border)' }}>
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
              style={{ backgroundColor: 'var(--color-bg)' }}
            >
              <Search size={13} style={{ color: 'var(--color-text3)' }} />
              <input
                type="text"
                placeholder="Buscar contato..."
                className="flex-1 bg-transparent text-[12px] outline-none"
                style={{ color: 'var(--color-text)' }}
                value={busca}
                onChange={e => setBusca(e.target.value)}
              />
            </div>
          </div>

          {/* Filtros */}
          <div
            className="flex gap-1.5 px-3 py-2 border-b shrink-0"
            style={{ borderColor: 'var(--color-border)' }}
          >
            {filtros.map(f => {
              const count = filtrarChats(chats, f, '').length
              return (
                <button
                  key={f}
                  onClick={() => setFiltro(f)}
                  className="flex items-center gap-1 text-[10px] font-medium px-2.5 py-1 rounded-full shrink-0 transition-colors"
                  style={{
                    backgroundColor: filtro === f ? 'var(--color-accent)' : 'var(--color-bg)',
                    color: filtro === f ? '#fff' : 'var(--color-text2)',
                  }}
                >
                  {f}
                  <span className="opacity-70">{count}</span>
                </button>
              )
            })}
          </div>

          {/* Lista */}
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            {carregando ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 size={20} className="animate-spin" style={{ color: 'var(--color-accent)' }} />
              </div>
            ) : chatsFiltrados.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <MessageSquare size={24} style={{ color: 'var(--color-text3)' }} className="mb-2" />
                <p className="text-[12px]" style={{ color: 'var(--color-text3)' }}>
                  {chats.length === 0 ? 'Nenhuma conversa ainda' : 'Nenhuma conversa encontrada'}
                </p>
              </div>
            ) : (
              chatsFiltrados.map(chat => (
                <ChatItem
                  key={chat.id}
                  chat={chat}
                  active={chatAtivo?.id === chat.id}
                  onClick={() => setChatAtivo(chat)}
                />
              ))
            )}
          </div>
        </div>

        {/* ─── Coluna central: área de mensagens ─── */}
        <div className="flex-1 flex flex-col h-screen min-w-0">
          {chatAtivo ? (
            <>
              <ChatTopbar chat={chatAtivo} />
              <AreaMensagens chat={chatAtivo} />
            </>
          ) : (
            <EstadoVazio />
          )}
        </div>

        {/* ─── Coluna direita: painel do contato ─── */}
        {chatAtivo && (
          <div className="w-[240px] h-screen shrink-0">
            <PainelContato chat={chatAtivo} />
          </div>
        )}
      </div>
    </div>
  )
}
