'use client'

import { useState } from 'react'
import { AppLayout } from '@/components/layout/AppLayout'
import { mockCampanhas } from '@/src/mocks/campanhas'
import { mockContatos } from '@/src/mocks/contatos'
import type { Campanha } from '@/src/types'
import {
  Plus, X, ChevronRight, ChevronLeft, Send, Users,
  MessageSquare, Calendar, Clock, Check, Megaphone,
  Eye, AlertCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function taxaLeitura(c: Campanha) {
  return c.enviados > 0 ? Math.round((c.lidas / c.enviados) * 100) : 0
}

function formatarData(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function statusConfig(s: Campanha['status']) {
  const map = {
    ATIVA:      { label: 'Ativa',      bg: 'var(--color-green-bg)',  color: 'var(--color-green)' },
    AGENDADA:   { label: 'Agendada',   bg: 'var(--color-blue-bg)',   color: 'var(--color-blue)' },
    ENCERRADA:  { label: 'Encerrada',  bg: 'var(--color-bg)',        color: 'var(--color-text3)' },
    RASCUNHO:   { label: 'Rascunho',   bg: 'var(--color-amber-bg)',  color: 'var(--color-amber)' },
  }
  return map[s]
}

// ─── Card de campanha ─────────────────────────────────────────────────────────

function CampanhaCard({ c }: { c: Campanha }) {
  const st = statusConfig(c.status)
  const taxa = taxaLeitura(c)
  return (
    <div
      className="rounded-lg p-5"
      style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <p className="text-[14px] font-semibold" style={{ color: 'var(--color-text)' }}>{c.nome}</p>
          <p className="text-[11px] mt-0.5" style={{ color: 'var(--color-text3)' }}>{c.segmento}</p>
        </div>
        <span className="text-[11px] font-medium px-2.5 py-1 rounded-full shrink-0" style={{ backgroundColor: st.bg, color: st.color }}>
          {st.label}
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-3">
        <Stat label="Enviados" value={c.enviados.toLocaleString('pt-BR')} icon={Send} color="var(--color-accent)" />
        <Stat label="Lidas" value={c.lidas.toLocaleString('pt-BR')} icon={Eye} color="var(--color-blue)" />
        <Stat label="Taxa leitura" value={`${taxa}%`} icon={MessageSquare} color={taxa >= 60 ? 'var(--color-green)' : 'var(--color-amber)'} />
      </div>

      {/* Barra de progresso */}
      {c.enviados > 0 && (
        <div className="mb-3">
          <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-bg)' }}>
            <div
              className="h-1.5 rounded-full transition-all"
              style={{
                width: `${(c.enviados / c.totalDestinatarios) * 100}%`,
                backgroundColor: 'var(--color-accent)',
              }}
            />
          </div>
          <p className="text-[10px] mt-1" style={{ color: 'var(--color-text3)' }}>
            {c.enviados} de {c.totalDestinatarios} destinatários
          </p>
        </div>
      )}

      <div className="flex items-center justify-between pt-3" style={{ borderTop: '1px solid var(--color-border)' }}>
        <div className="flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--color-text3)' }}>
          <Calendar size={11} />
          {c.agendadaPara ? `Agendada: ${formatarData(c.agendadaPara)}` : formatarData(c.criadaEm)}
        </div>
        <button className="text-[11px] font-medium" style={{ color: 'var(--color-accent)' }}>
          Ver detalhes →
        </button>
      </div>
    </div>
  )
}

function Stat({ label, value, icon: Icon, color }: { label: string; value: string; icon: React.ElementType; color: string }) {
  return (
    <div className="text-center">
      <Icon size={13} className="mx-auto mb-1" style={{ color }} />
      <p className="text-[14px] font-semibold" style={{ color: 'var(--color-text)' }}>{value}</p>
      <p className="text-[10px]" style={{ color: 'var(--color-text3)' }}>{label}</p>
    </div>
  )
}

// ─── Modal de nova campanha ────────────────────────────────────────────────────

const SEGMENTOS = [
  { id: 'todos',      label: 'Todos os contatos',           desc: 'Com opt-in ativo',                icon: Users },
  { id: 'tag',        label: 'Por tag',                     desc: 'Ex: cliente, vip, lead',          icon: MessageSquare },
  { id: 'recorrente', label: 'Clientes recorrentes',        desc: 'Compraram +2 vezes',              icon: Check },
  { id: 'inativos',   label: 'Reengajamento',               desc: 'Sem interação há +30 dias',       icon: Clock },
]

type Agendamento = 'agora' | 'data' | 'recorrente'

function ModalNovaCampanha({ onClose }: { onClose: () => void }) {
  const [passo, setPasso] = useState<1 | 2 | 3>(1)
  const [segmento, setSegmento] = useState('')
  const [mensagem, setMensagem] = useState('')
  const [agendamento, setAgendamento] = useState<Agendamento>('agora')

  const totalOpt = mockContatos.filter(c => c.optin).length
  const preview = mensagem
    .replace('{{nome}}', 'Maria Silva')
    .replace('{{ultimo_produto}}', 'Produto XYZ')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div
        className="w-full max-w-2xl rounded-xl shadow-2xl flex flex-col"
        style={{ backgroundColor: 'var(--color-surface)', maxHeight: '90vh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
          <div>
            <p className="text-[15px] font-semibold" style={{ color: 'var(--color-text)' }}>Nova campanha</p>
            <p className="text-[11px]" style={{ color: 'var(--color-text3)' }}>Passo {passo} de 3</p>
          </div>
          <button onClick={onClose} style={{ color: 'var(--color-text3)' }}>
            <X size={18} />
          </button>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center px-6 py-3 gap-2 border-b" style={{ borderColor: 'var(--color-border)' }}>
          {(['Público', 'Mensagem', 'Agendamento'] as const).map((label, i) => {
            const num = i + 1
            const done = passo > num
            const active = passo === num
            return (
              <div key={label} className="flex items-center gap-2 flex-1">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0"
                  style={{
                    backgroundColor: done || active ? 'var(--color-accent)' : 'var(--color-bg)',
                    color: done || active ? '#fff' : 'var(--color-text3)',
                  }}
                >
                  {done ? <Check size={11} /> : num}
                </div>
                <span
                  className="text-[12px] font-medium"
                  style={{ color: active ? 'var(--color-text)' : 'var(--color-text3)' }}
                >
                  {label}
                </span>
                {i < 2 && <div className="flex-1 h-px ml-1" style={{ backgroundColor: 'var(--color-border)' }} />}
              </div>
            )
          })}
        </div>

        {/* Conteúdo */}
        <div className="flex-1 overflow-y-auto px-6 py-5 scrollbar-thin">
          {passo === 1 && (
            <Passo1 segmento={segmento} setSegmento={setSegmento} totalOpt={totalOpt} />
          )}
          {passo === 2 && (
            <Passo2 mensagem={mensagem} setMensagem={setMensagem} preview={preview} />
          )}
          {passo === 3 && (
            <Passo3 agendamento={agendamento} setAgendamento={setAgendamento} />
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
          <button
            onClick={() => passo > 1 && setPasso(p => (p - 1) as 1 | 2 | 3)}
            disabled={passo === 1}
            className="flex items-center gap-1.5 text-[13px] px-4 py-2 rounded-lg transition-colors disabled:opacity-40"
            style={{ border: '1px solid var(--color-border)', color: 'var(--color-text2)' }}
          >
            <ChevronLeft size={14} /> Voltar
          </button>
          {passo < 3 ? (
            <button
              onClick={() => setPasso(p => (p + 1) as 2 | 3)}
              className="flex items-center gap-1.5 text-[13px] font-medium px-5 py-2 rounded-lg text-white"
              style={{ backgroundColor: 'var(--color-accent)' }}
            >
              Continuar <ChevronRight size={14} />
            </button>
          ) : (
            <button
              onClick={onClose}
              className="flex items-center gap-1.5 text-[13px] font-medium px-5 py-2 rounded-lg text-white"
              style={{ backgroundColor: 'var(--color-green)' }}
            >
              <Send size={14} /> Criar campanha
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function Passo1({ segmento, setSegmento, totalOpt }: { segmento: string; setSegmento: (s: string) => void; totalOpt: number }) {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-[14px] font-semibold mb-1" style={{ color: 'var(--color-text)' }}>Selecione o público</p>
        <p className="text-[12px] mb-4" style={{ color: 'var(--color-text3)' }}>
          Mensagens só serão enviadas para contatos com opt-in ativo.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {SEGMENTOS.map(s => (
          <button
            key={s.id}
            onClick={() => setSegmento(s.id)}
            className="flex items-start gap-3 p-4 rounded-lg text-left transition-all"
            style={{
              border: `2px solid ${segmento === s.id ? 'var(--color-accent)' : 'var(--color-border)'}`,
              backgroundColor: segmento === s.id ? 'var(--color-purple-light)' : 'var(--color-bg)',
            }}
          >
            <s.icon size={18} style={{ color: segmento === s.id ? 'var(--color-accent)' : 'var(--color-text3)', marginTop: 2 }} />
            <div>
              <p className="text-[13px] font-medium" style={{ color: 'var(--color-text)' }}>{s.label}</p>
              <p className="text-[11px] mt-0.5" style={{ color: 'var(--color-text3)' }}>{s.desc}</p>
            </div>
          </button>
        ))}
      </div>
      {segmento && (
        <div
          className="flex items-center gap-2 px-4 py-3 rounded-lg mt-2"
          style={{ backgroundColor: 'var(--color-green-bg)', border: '1px solid var(--color-green)' }}
        >
          <Users size={14} style={{ color: 'var(--color-green)' }} />
          <p className="text-[12px]" style={{ color: 'var(--color-text)' }}>
            <strong>{totalOpt} contatos</strong> receberão esta campanha.
          </p>
        </div>
      )}
    </div>
  )
}

function Passo2({ mensagem, setMensagem, preview }: { mensagem: string; setMensagem: (m: string) => void; preview: string }) {
  const variaveis = ['{{nome}}', '{{ultimo_produto}}']
  return (
    <div className="space-y-4">
      <div>
        <p className="text-[14px] font-semibold mb-1" style={{ color: 'var(--color-text)' }}>Escreva a mensagem</p>
        <p className="text-[12px] mb-1" style={{ color: 'var(--color-text3)' }}>Use variáveis para personalizar:</p>
        <div className="flex gap-2 mb-4">
          {variaveis.map(v => (
            <button
              key={v}
              onClick={() => setMensagem(m => m + v)}
              className="text-[11px] font-mono px-2 py-1 rounded-md"
              style={{ backgroundColor: 'var(--color-purple-light)', color: 'var(--color-accent)' }}
            >
              {v}
            </button>
          ))}
        </div>
      </div>
      <textarea
        rows={5}
        value={mensagem}
        onChange={e => setMensagem(e.target.value)}
        placeholder="Oi {{nome}}! Temos uma oferta especial para você..."
        className="w-full text-[13px] p-3 rounded-lg outline-none resize-none"
        style={{ border: '1.5px solid var(--color-purple-border)', backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}
      />

      {/* Preview WhatsApp */}
      {mensagem && (
        <div>
          <p className="text-[12px] font-medium mb-2" style={{ color: 'var(--color-text2)' }}>Preview WhatsApp</p>
          <div
            className="rounded-xl p-4"
            style={{ backgroundColor: '#e5ddd5', backgroundImage: 'url("/whatsapp-bg.png")' }}
          >
            <div
              className="max-w-[80%] px-3.5 py-2.5 rounded-2xl text-[13px] shadow-sm"
              style={{ backgroundColor: 'var(--color-surface)', borderRadius: '18px 18px 18px 4px' }}
            >
              <p style={{ color: 'var(--color-text)' }}>{preview || mensagem}</p>
              <p className="text-[10px] text-right mt-1" style={{ color: 'var(--color-text3)' }}>agora ✓✓</p>
            </div>
          </div>
        </div>
      )}

      <div
        className="flex items-start gap-2 px-3 py-2.5 rounded-lg"
        style={{ backgroundColor: 'var(--color-amber-bg)', border: '1px solid var(--color-amber)' }}
      >
        <AlertCircle size={13} className="shrink-0 mt-0.5" style={{ color: 'var(--color-amber)' }} />
        <p className="text-[11px]" style={{ color: 'var(--color-text)' }}>
          Envios só ocorrem entre <strong>08:00–20:00</strong> (Brasília). Máximo 1 mensagem por contato por dia.
        </p>
      </div>
    </div>
  )
}

function Passo3({ agendamento, setAgendamento }: { agendamento: Agendamento; setAgendamento: (a: Agendamento) => void }) {
  const opcoes: { id: Agendamento; label: string; desc: string; icon: React.ElementType }[] = [
    { id: 'agora',      label: 'Enviar agora',       desc: 'O disparo inicia imediatamente',         icon: Send },
    { id: 'data',       label: 'Data específica',     desc: 'Escolha data e hora do disparo',        icon: Calendar },
    { id: 'recorrente', label: 'Recorrente',           desc: 'Repete semanalmente ou mensalmente',    icon: Clock },
  ]
  return (
    <div className="space-y-4">
      <p className="text-[14px] font-semibold" style={{ color: 'var(--color-text)' }}>Quando enviar?</p>
      <div className="space-y-3">
        {opcoes.map(o => (
          <button
            key={o.id}
            onClick={() => setAgendamento(o.id)}
            className="w-full flex items-center gap-4 p-4 rounded-lg text-left transition-all"
            style={{
              border: `2px solid ${agendamento === o.id ? 'var(--color-accent)' : 'var(--color-border)'}`,
              backgroundColor: agendamento === o.id ? 'var(--color-purple-light)' : 'var(--color-bg)',
            }}
          >
            <o.icon size={18} style={{ color: agendamento === o.id ? 'var(--color-accent)' : 'var(--color-text3)' }} />
            <div>
              <p className="text-[13px] font-medium" style={{ color: 'var(--color-text)' }}>{o.label}</p>
              <p className="text-[11px]" style={{ color: 'var(--color-text3)' }}>{o.desc}</p>
            </div>
            {agendamento === o.id && <Check size={16} className="ml-auto" style={{ color: 'var(--color-accent)' }} />}
          </button>
        ))}
      </div>
      {agendamento === 'data' && (
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--color-text2)' }}>Data</label>
            <input type="date" className="w-full text-[13px] px-3 py-2 rounded-lg outline-none"
              style={{ border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
            />
          </div>
          <div className="flex-1">
            <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--color-text2)' }}>Hora</label>
            <input type="time" className="w-full text-[13px] px-3 py-2 rounded-lg outline-none"
              style={{ border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Página ───────────────────────────────────────────────────────────────────

export default function CampanhasPage() {
  const [modalAberto, setModalAberto] = useState(false)
  const [filtroStatus, setFiltroStatus] = useState<Campanha['status'] | 'TODAS'>('TODAS')

  const campanhasFiltradas = filtroStatus === 'TODAS'
    ? mockCampanhas
    : mockCampanhas.filter(c => c.status === filtroStatus)

  const filtros: (Campanha['status'] | 'TODAS')[] = ['TODAS', 'ATIVA', 'AGENDADA', 'ENCERRADA']

  return (
    <AppLayout title="Campanhas" subtitle="Gestão de campanhas de mensagens em massa">
      <div className="p-6 space-y-5">
        {/* Barra de ações */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 p-0.5 rounded-lg" style={{ backgroundColor: 'var(--color-bg)' }}>
            {filtros.map(f => (
              <button
                key={f}
                onClick={() => setFiltroStatus(f)}
                className="px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors"
                style={{
                  backgroundColor: filtroStatus === f ? 'var(--color-surface)' : 'transparent',
                  color: filtroStatus === f ? 'var(--color-accent)' : 'var(--color-text2)',
                  boxShadow: filtroStatus === f ? '0 1px 3px rgba(0,0,0,0.08)' : undefined,
                }}
              >
                {f === 'TODAS' ? 'Todas' : statusConfig(f).label}
              </button>
            ))}
          </div>
          <div className="flex-1" />
          <button
            onClick={() => setModalAberto(true)}
            className="flex items-center gap-1.5 text-[13px] font-medium px-4 py-2 rounded-lg text-white"
            style={{ backgroundColor: 'var(--color-accent)' }}
          >
            <Plus size={14} /> Nova campanha
          </button>
        </div>

        {/* Grid de campanhas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {campanhasFiltradas.map(c => (
            <CampanhaCard key={c.id} c={c} />
          ))}
        </div>

        {campanhasFiltradas.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20">
            <Megaphone size={32} className="mb-3" style={{ color: 'var(--color-text3)' }} />
            <p className="text-[14px] font-medium" style={{ color: 'var(--color-text)' }}>Nenhuma campanha encontrada</p>
            <p className="text-[12px] mt-1" style={{ color: 'var(--color-text3)' }}>Crie sua primeira campanha clicando no botão acima</p>
          </div>
        )}
      </div>

      {modalAberto && <ModalNovaCampanha onClose={() => setModalAberto(false)} />}
    </AppLayout>
  )
}
