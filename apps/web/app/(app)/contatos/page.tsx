'use client'

import { useState, useEffect } from 'react'
import { AppLayout } from '@/components/layout/AppLayout'
import { apiFetch } from '@/lib/auth'
import { mockChats } from '@/src/mocks/chats'
import { mockAvaliacoes } from '@/src/mocks/avaliacoes'
import type { Contato, Avaliacao } from '@/src/types'
import {
  Search, Filter, X, Phone, Mail, Tag, Star,
  MessageSquare, ChevronRight, UserPlus, AlertTriangle, Globe, AtSign,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function iniciais(nome: string) {
  return nome.split(' ').map(n => n[0]).slice(0, 2).join('')
}

function formatarTelefone(t: string) {
  const d = t.replace(/\D/g, '')
  if (d.length === 13) return d.replace(/(\d{2})(\d{2})(\d{5})(\d{4})/, '+$1 ($2) $3-$4') // celular
  if (d.length === 12) return d.replace(/(\d{2})(\d{2})(\d{4})(\d{4})/, '+$1 ($2) $3-$4') // fixo
  return t
}

function tempoRelativo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  if (diff < 3600000)  return `${Math.floor(diff / 60000)}m atrás`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h atrás`
  return `${Math.floor(diff / 86400000)}d atrás`
}

// Enriquece contato com dados de chats
function enriquecerContato(c: Contato) {
  const chatsDoContato = mockChats.filter(ch => ch.contato.id === c.id)
  const avaliacoesDoContato = mockAvaliacoes.filter(av => av.contato.id === c.id)
  const notaMedia = avaliacoesDoContato.length
    ? avaliacoesDoContato.reduce((s, a) => s + a.nota, 0) / avaliacoesDoContato.length
    : undefined
  const ultimoChat = chatsDoContato.sort((a, b) =>
    new Date(b.atualizadoEm).getTime() - new Date(a.atualizadoEm).getTime()
  )[0]
  return {
    ...c,
    operadorNome: ultimoChat?.operador?.nome,
    ultimoAtendimento: ultimoChat?.atualizadoEm,
    totalAtendimentos: chatsDoContato.length,
    notaMedia,
    avaliacoes: avaliacoesDoContato,
  }
}

// ─── Estrelas de avaliação ────────────────────────────────────────────────────

function Estrelas({ nota, size = 12 }: { nota: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          size={size}
          style={{ color: i <= nota ? 'var(--color-amber)' : 'var(--color-border)' }}
          fill={i <= nota ? 'var(--color-amber)' : 'none'}
        />
      ))}
    </div>
  )
}

// ─── Linha da tabela ──────────────────────────────────────────────────────────

function ContatoRow({
  contato, selected, onClick,
}: {
  contato: ReturnType<typeof enriquecerContato>
  selected: boolean
  onClick: () => void
}) {
  return (
    <tr
      onClick={onClick}
      className={cn('cursor-pointer transition-colors', selected ? 'bg-[var(--color-purple-light)]' : 'hover:bg-gray-50')}
      style={{ borderBottom: '1px solid var(--color-border)' }}
    >
      {/* Avatar + Nome */}
      <td className="px-5 py-3">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-semibold shrink-0"
            style={{ backgroundColor: selected ? 'var(--color-accent)' : '#CBD5E1' }}
          >
            {iniciais(contato.nome)}
          </div>
          <div>
            <p className="text-[13px] font-medium" style={{ color: 'var(--color-text)' }}>{contato.nome}</p>
            <p className="text-[11px] truncate max-w-[460px]" style={{ color: 'var(--color-text3)' }}>
              {[contato.categoria, contato.endereco].filter(Boolean).join(' · ') || contato.email || contato.notas || '—'}
            </p>
          </div>
        </div>
      </td>

      {/* Telefone */}
      <td className="px-4 py-3">
        <span className="text-[12px]" style={{ color: 'var(--color-text2)' }}>
          {formatarTelefone(contato.telefone)}
        </span>
      </td>

      {/* Tags */}
      <td className="px-4 py-3">
        <div className="flex flex-wrap gap-1">
          {contato.tags.map(tag => (
            <span
              key={tag}
              className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
              style={{ backgroundColor: 'var(--color-purple-light)', color: 'var(--color-accent)' }}
            >
              {tag}
            </span>
          ))}
          {contato.tags.length === 0 && <span className="text-[11px]" style={{ color: 'var(--color-text3)' }}>—</span>}
        </div>
      </td>

      {/* Operador */}
      <td className="px-4 py-3">
        <span className="text-[12px]" style={{ color: 'var(--color-text2)' }}>
          {contato.operadorNome ?? '—'}
        </span>
      </td>

      {/* Opt-in */}
      <td className="px-4 py-3">
        <span
          className="text-[11px] font-medium px-2 py-0.5 rounded-full"
          style={{
            backgroundColor: contato.optin ? 'var(--color-green-bg)' : 'var(--color-red-bg)',
            color: contato.optin ? 'var(--color-green)' : 'var(--color-red)',
          }}
        >
          {contato.optin ? '✓ Ativo' : '✗ Inativo'}
        </span>
      </td>

      {/* Nota média */}
      <td className="px-4 py-3">
        {contato.notaMedia !== undefined ? (
          <div className="flex items-center gap-1.5">
            <Estrelas nota={Math.round(contato.notaMedia)} size={11} />
            <span className="text-[11px]" style={{ color: 'var(--color-text3)' }}>
              {contato.notaMedia.toFixed(1)}
            </span>
          </div>
        ) : contato.googleNota != null ? (
          <div className="flex items-center gap-1.5" title="Nota no Google">
            <Estrelas nota={Math.round(contato.googleNota)} size={11} />
            <span className="text-[11px]" style={{ color: 'var(--color-text3)' }}>
              {contato.googleNota.toFixed(1)}
            </span>
          </div>
        ) : (
          <span className="text-[11px]" style={{ color: 'var(--color-text3)' }}>—</span>
        )}
      </td>

      {/* Último contato */}
      <td className="px-4 py-3">
        <span className="text-[12px]" style={{ color: 'var(--color-text3)' }}>
          {contato.ultimoAtendimento ? tempoRelativo(contato.ultimoAtendimento) : '—'}
        </span>
      </td>

      <td className="px-4 py-3">
        <ChevronRight size={14} style={{ color: 'var(--color-text3)' }} />
      </td>
    </tr>
  )
}

// ─── Drawer de detalhes do contato ────────────────────────────────────────────

function DrawerContato({
  contato, onClose,
}: {
  contato: ReturnType<typeof enriquecerContato>
  onClose: () => void
}) {
  return (
    <div
      className="fixed right-0 top-0 h-screen w-[380px] z-50 flex flex-col shadow-2xl overflow-y-auto scrollbar-thin"
      style={{ backgroundColor: 'var(--color-surface)', borderLeft: '1px solid var(--color-border)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b shrink-0" style={{ borderColor: 'var(--color-border)' }}>
        <p className="text-[14px] font-semibold" style={{ color: 'var(--color-text)' }}>Perfil do contato</p>
        <button onClick={onClose} style={{ color: 'var(--color-text3)' }}>
          <X size={18} />
        </button>
      </div>

      {/* Avatar + info */}
      <div className="px-5 py-5 text-center border-b" style={{ borderColor: 'var(--color-border)' }}>
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center text-white text-[18px] font-semibold mx-auto mb-3"
          style={{ backgroundColor: 'var(--color-accent)' }}
        >
          {iniciais(contato.nome)}
        </div>
        <p className="text-[16px] font-semibold" style={{ color: 'var(--color-text)' }}>{contato.nome}</p>
        <p className="text-[12px] mt-1" style={{ color: 'var(--color-text3)' }}>{formatarTelefone(contato.telefone)}</p>
        <div className="flex flex-wrap justify-center gap-1.5 mt-2.5">
          {contato.tags.map(tag => (
            <span key={tag} className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: 'var(--color-purple-light)', color: 'var(--color-accent)' }}>
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Dados */}
      <div className="px-5 py-4 border-b space-y-2.5" style={{ borderColor: 'var(--color-border)' }}>
        <p className="text-[11px] font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--color-text3)' }}>Informações</p>
        <DrawerRow icon={Mail} label="E-mail" value={contato.email ?? '—'} />
        <DrawerRow icon={Phone} label="Telefone" value={formatarTelefone(contato.telefone)} />
        <DrawerRow icon={Tag} label="Opt-in" value={contato.optin ? '✓ Ativo' : '✗ Inativo'} valueColor={contato.optin ? 'var(--color-green)' : 'var(--color-red)'} />
        <DrawerRow icon={MessageSquare} label="Atendimentos" value={String(contato.totalAtendimentos)} />
        {contato.notaMedia !== undefined && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2" style={{ color: 'var(--color-text2)' }}>
              <Star size={13} />
              <span className="text-[12px]">Nota média</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Estrelas nota={Math.round(contato.notaMedia)} size={12} />
              <span className="text-[12px] font-medium" style={{ color: 'var(--color-text)' }}>
                {contato.notaMedia.toFixed(1)}
              </span>
            </div>
          </div>
        )}
        {(contato.categoria || contato.endereco || contato.site || contato.instagram || contato.googleNota != null || contato.notas) && (
          <div className="pt-2 space-y-2.5">
            <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text3)' }}>Prospecção (Google Maps)</p>
            {contato.categoria && <DrawerRow icon={Tag} label="Categoria" value={contato.categoria} />}
            {contato.endereco && <DrawerRow icon={Tag} label="Endereço" value={contato.endereco} />}
            {contato.googleNota != null && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2" style={{ color: 'var(--color-text2)' }}>
                  <Star size={13} /><span className="text-[12px]">Nota Google</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Estrelas nota={Math.round(contato.googleNota)} size={12} />
                  <span className="text-[12px] font-medium" style={{ color: 'var(--color-text)' }}>
                    {contato.googleNota.toFixed(1)}{contato.googleAvaliacoes ? ` (${contato.googleAvaliacoes})` : ''}
                  </span>
                </div>
              </div>
            )}
            {contato.site && (
              <a href={contato.site.startsWith('http') ? contato.site : `https://${contato.site}`} target="_blank" rel="noopener noreferrer"
                 className="flex items-center gap-2 text-[12px] hover:underline" style={{ color: 'var(--color-accent)' }}>
                <Globe size={13} className="shrink-0" /> <span className="truncate">{contato.site.replace(/^https?:\/\//, '')}</span>
              </a>
            )}
            {contato.instagram && (
              <a href={contato.instagram.startsWith('http') ? contato.instagram : `https://instagram.com/${contato.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer"
                 className="flex items-center gap-2 text-[12px] hover:underline" style={{ color: 'var(--color-accent)' }}>
                <AtSign size={13} className="shrink-0" /> <span className="truncate">{contato.instagram.replace(/^https?:\/\/(www\.)?instagram\.com\//, '@')}</span>
              </a>
            )}
            {!contato.categoria && contato.notas && (
              <p className="text-[12px] break-words" style={{ color: 'var(--color-text)' }}>{contato.notas}</p>
            )}
          </div>
        )}
      </div>

      {/* Avaliações */}
      <div className="px-5 py-4">
        <p className="text-[11px] font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--color-text3)' }}>
          Últimas avaliações
        </p>
        {contato.avaliacoes.length === 0 ? (
          <p className="text-[12px]" style={{ color: 'var(--color-text3)' }}>Nenhuma avaliação ainda.</p>
        ) : (
          <div className="space-y-3">
            {contato.avaliacoes.map(av => (
              <AvaliacaoCard key={av.id} av={av} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function DrawerRow({ icon: Icon, label, value, valueColor }: { icon: React.ElementType; label: string; value: string; valueColor?: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2" style={{ color: 'var(--color-text2)' }}>
        <Icon size={13} />
        <span className="text-[12px]">{label}</span>
      </div>
      <span className="text-[12px] font-medium" style={{ color: valueColor ?? 'var(--color-text)' }}>{value}</span>
    </div>
  )
}

function AvaliacaoCard({ av }: { av: Avaliacao }) {
  const ruim = av.nota <= 2
  return (
    <div
      className="rounded-lg p-3"
      style={{
        backgroundColor: ruim ? 'var(--color-red-bg)' : 'var(--color-bg)',
        border: `1px solid ${ruim ? 'var(--color-red)' : 'var(--color-border)'}`,
      }}
    >
      {ruim && (
        <div className="flex items-center gap-1.5 mb-2" style={{ color: 'var(--color-red)' }}>
          <AlertTriangle size={11} />
          <span className="text-[10px] font-semibold">Nota baixa — supervisor alertado</span>
        </div>
      )}
      <div className="flex items-center justify-between mb-1.5">
        <Estrelas nota={av.nota} size={12} />
        <span className="text-[10px]" style={{ color: 'var(--color-text3)' }}>
          {av.operador.nome.split(' ')[0]} · {tempoRelativo(av.criadaEm)}
        </span>
      </div>
      {av.comentario && (
        <p className="text-[12px]" style={{ color: 'var(--color-text)' }}>"{av.comentario}"</p>
      )}
    </div>
  )
}

// ─── Modal: novo contato ──────────────────────────────────────────────────────

function ModalNovoContato({ onClose, onSalvo }: { onClose: () => void; onSalvo: () => void }) {
  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [email, setEmail] = useState('')
  const [optin, setOptin] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)

  async function salvar() {
    setErro(null)
    if (!nome || !telefone) { setErro('Informe nome e telefone'); return }
    setSalvando(true)
    try {
      const res = await apiFetch('/api/contatos', {
        method: 'POST',
        body: JSON.stringify({ nome, telefone, email: email || undefined, optin }),
      })
      const data = await res.json()
      if (!res.ok) { setErro(data?.error ?? 'Erro ao salvar'); return }
      onSalvo()
    } catch { setErro('Falha de conexão') } finally { setSalvando(false) }
  }

  const inputCls = 'w-full text-[13px] px-3 py-2.5 rounded-lg outline-none'
  const inputStyle = { border: '1.5px solid var(--color-purple-border)', backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' } as const

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-xl shadow-2xl" style={{ backgroundColor: 'var(--color-surface)' }}>
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
          <p className="text-[15px] font-semibold" style={{ color: 'var(--color-text)' }}>Novo contato</p>
          <button onClick={onClose} style={{ color: 'var(--color-text3)' }}><X size={18} /></button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="text-[12px] font-medium block mb-1.5" style={{ color: 'var(--color-text2)' }}>Nome *</label>
            <input value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Maria Souza" className={inputCls} style={inputStyle} />
          </div>
          <div>
            <label className="text-[12px] font-medium block mb-1.5" style={{ color: 'var(--color-text2)' }}>Telefone (com DDI) *</label>
            <input value={telefone} onChange={e => setTelefone(e.target.value)} placeholder="5547999998888" className={inputCls} style={inputStyle} />
          </div>
          <div>
            <label className="text-[12px] font-medium block mb-1.5" style={{ color: 'var(--color-text2)' }}>E-mail</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="opcional" className={inputCls} style={inputStyle} />
          </div>
          <label className="flex items-center gap-2 text-[12px]" style={{ color: 'var(--color-text2)' }}>
            <input type="checkbox" checked={optin} onChange={e => setOptin(e.target.checked)} className="accent-[var(--color-accent)]" />
            Aceitou receber mensagens de marketing (optin)
          </label>
          {erro && <p className="text-[12px]" style={{ color: 'var(--color-red)' }}>{erro}</p>}
        </div>

        <div className="flex gap-3 px-6 py-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
          <button onClick={onClose} className="flex-1 py-2.5 rounded-lg text-[13px] font-medium" style={{ border: '1px solid var(--color-border)', color: 'var(--color-text2)' }}>
            Cancelar
          </button>
          <button onClick={salvar} disabled={salvando} className="flex-1 py-2.5 rounded-lg text-[13px] font-medium text-white disabled:opacity-50" style={{ backgroundColor: 'var(--color-accent)' }}>
            {salvando ? 'Salvando…' : 'Criar contato'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Página ───────────────────────────────────────────────────────────────────

export default function ContatosPage() {
  const [busca, setBusca] = useState('')
  const [filtroOptin, setFiltroOptin] = useState<'todos' | 'ativo' | 'inativo'>('todos')
  const [filtroTag, setFiltroTag] = useState('')
  const [contatoSelecionado, setContatoSelecionado] = useState<ReturnType<typeof enriquecerContato> | null>(null)
  const [contatosReais, setContatosReais] = useState<ReturnType<typeof enriquecerContato>[]>([])
  const [modalNovo, setModalNovo] = useState(false)

  function carregarContatos() {
    apiFetch('/api/contatos')
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setContatosReais(d as ReturnType<typeof enriquecerContato>[]) })
      .catch(() => {})
  }
  useEffect(() => { carregarContatos() }, [])

  const contatos = contatosReais
    .filter(c => {
      if (busca && !c.nome.toLowerCase().includes(busca.toLowerCase())) return false
      if (filtroOptin === 'ativo' && !c.optin) return false
      if (filtroOptin === 'inativo' && c.optin) return false
      if (filtroTag && !c.tags.includes(filtroTag)) return false
      return true
    })

  const todasTags = Array.from(new Set(contatosReais.flatMap(c => c.tags)))

  return (
    <AppLayout title="Contatos" subtitle="CRM de contatos e clientes">
      <div className="p-6">
        {/* Barra de ações */}
        <div className="flex items-center gap-3 mb-5">
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-lg flex-1 max-w-xs"
            style={{ border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)' }}
          >
            <Search size={14} style={{ color: 'var(--color-text3)' }} />
            <input
              type="text"
              placeholder="Buscar contato..."
              className="flex-1 text-[13px] outline-none bg-transparent"
              style={{ color: 'var(--color-text)' }}
              value={busca}
              onChange={e => setBusca(e.target.value)}
            />
          </div>

          <select
            className="text-[12px] px-3 py-2 rounded-lg outline-none"
            style={{ border: '1px solid var(--color-border)', color: 'var(--color-text2)', backgroundColor: 'var(--color-surface)' }}
            value={filtroOptin}
            onChange={e => setFiltroOptin(e.target.value as typeof filtroOptin)}
          >
            <option value="todos">Opt-in: Todos</option>
            <option value="ativo">Opt-in: Ativo</option>
            <option value="inativo">Opt-in: Inativo</option>
          </select>

          <select
            className="text-[12px] px-3 py-2 rounded-lg outline-none"
            style={{ border: '1px solid var(--color-border)', color: 'var(--color-text2)', backgroundColor: 'var(--color-surface)' }}
            value={filtroTag}
            onChange={e => setFiltroTag(e.target.value)}
          >
            <option value="">Tag: Todas</option>
            {todasTags.map(t => <option key={t}>{t}</option>)}
          </select>

          <div className="flex-1" />

          <button
            onClick={() => setModalNovo(true)}
            className="flex items-center gap-1.5 text-[12px] font-medium px-4 py-2 rounded-lg text-white transition-opacity hover:opacity-80"
            style={{ backgroundColor: 'var(--color-accent)' }}
          >
            <UserPlus size={14} /> Novo contato
          </button>

          {modalNovo && (
            <ModalNovoContato
              onClose={() => setModalNovo(false)}
              onSalvo={() => { setModalNovo(false); carregarContatos() }}
            />
          )}
        </div>

        {/* Tabela */}
        <div
          className="rounded-lg overflow-hidden"
          style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
        >
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)' }}>
                {['Nome', 'Telefone', 'Tags', 'Operador', 'Opt-in', 'Nota', 'Último contato', ''].map(h => (
                  <th
                    key={h}
                    className="px-5 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide"
                    style={{ color: 'var(--color-text3)' }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {contatos.map(c => (
                <ContatoRow
                  key={c.id}
                  contato={c}
                  selected={contatoSelecionado?.id === c.id}
                  onClick={() => setContatoSelecionado(prev => prev?.id === c.id ? null : c)}
                />
              ))}
            </tbody>
          </table>

          {contatos.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16">
              <Filter size={24} className="mb-2" style={{ color: 'var(--color-text3)' }} />
              <p className="text-[13px]" style={{ color: 'var(--color-text3)' }}>Nenhum contato encontrado</p>
            </div>
          )}
        </div>
      </div>

      {/* Drawer lateral */}
      {contatoSelecionado && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/20"
            onClick={() => setContatoSelecionado(null)}
          />
          <DrawerContato
            contato={contatoSelecionado}
            onClose={() => setContatoSelecionado(null)}
          />
        </>
      )}
    </AppLayout>
  )
}
