'use client'

import { useState } from 'react'
import { AppLayout } from '@/components/layout/AppLayout'
import {
  UserPlus, Clock, Calendar, ArrowRight, MessageSquare,
  Tag, Plus, Zap, X, Check,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Tipos ────────────────────────────────────────────────────────────────────

type TipoGatilho = 'EVENTO' | 'AGENDADO' | 'CONDIÇÃO'
type TipoAção    = 'MENSAGEM' | 'MOVER_COLUNA' | 'ATRIBUIR' | 'TAG' | 'ALERTA'

interface ConfigInatividade {
  tempoAlertaMin: number      // minutos para disparar o alerta ao operador
  tempoTrocaMin:  number | null // minutos para trocar operador automaticamente (null = não troca)
}

interface Automacao {
  id: string
  nome: string
  descricao: string
  ativa: boolean
  gatilho: TipoGatilho
  icone: React.ElementType
  acoes: TipoAção[]
  execucoes: number
  inatividade?: ConfigInatividade
}

// ─── Mock de automações ───────────────────────────────────────────────────────

const mockAutomacoes: Automacao[] = [
  {
    id: 'a1',
    nome: 'Novo Lead',
    descricao: 'Quando um novo lead entrar, atribuir ao operador disponível via Round Robin.',
    ativa: true,
    gatilho: 'EVENTO',
    icone: UserPlus,
    acoes: ['ATRIBUIR', 'MENSAGEM'],
    execucoes: 142,
  },
  {
    id: 'a2',
    nome: 'Alerta de Inatividade',
    descricao: 'Se ficar sem resposta, alertar o operador e opcionalmente trocar o responsável.',
    ativa: true,
    gatilho: 'AGENDADO',
    icone: Clock,
    acoes: ['ALERTA', 'ATRIBUIR'],
    execucoes: 38,
    inatividade: { tempoAlertaMin: 30, tempoTrocaMin: 60 },
  },
  {
    id: 'a3',
    nome: 'Follow-up de Proposta',
    descricao: 'Quando proposta for enviada, agendar follow-up automático em 24h.',
    ativa: true,
    gatilho: 'EVENTO',
    icone: Calendar,
    acoes: ['MENSAGEM'],
    execucoes: 21,
  },
  {
    id: 'a4',
    nome: 'Reativação de Leads',
    descricao: 'Lead parado por 3 dias no pipeline, mover para coluna de reativação.',
    ativa: false,
    gatilho: 'AGENDADO',
    icone: ArrowRight,
    acoes: ['MOVER_COLUNA', 'ALERTA'],
    execucoes: 0,
  },
  {
    id: 'a5',
    nome: 'Boas-vindas Automático',
    descricao: 'Enviar mensagem de boas-vindas assim que o lead entrar em contato pela primeira vez.',
    ativa: true,
    gatilho: 'EVENTO',
    icone: MessageSquare,
    acoes: ['MENSAGEM'],
    execucoes: 89,
  },
  {
    id: 'a6',
    nome: 'Tag de Fechamento',
    descricao: 'Quando venda for fechada no pipeline, marcar o contato com a tag "cliente".',
    ativa: true,
    gatilho: 'EVENTO',
    icone: Tag,
    acoes: ['TAG'],
    execucoes: 54,
  },
  {
    id: 'a7',
    nome: 'NPS Pós-Atendimento',
    descricao: 'Após encerrar um chat, aguardar 2 minutos e enviar pesquisa de satisfação.',
    ativa: true,
    gatilho: 'EVENTO',
    icone: Zap,
    acoes: ['MENSAGEM'],
    execucoes: 203,
  },
  {
    id: 'a8',
    nome: 'Lembrete de Boleto',
    descricao: 'Enviar lembrete 1 dia antes do vencimento para clientes com cobrança pendente.',
    ativa: false,
    gatilho: 'AGENDADO',
    icone: Clock,
    acoes: ['MENSAGEM'],
    execucoes: 0,
  },
  {
    id: 'a9',
    nome: 'Brinde por Nota 5',
    descricao: 'Quando cliente der nota 5 na pesquisa de satisfação, enviar automaticamente um brinde/desconto por WhatsApp.',
    ativa: true,
    gatilho: 'EVENTO',
    icone: Zap,
    acoes: ['MENSAGEM'],
    execucoes: 27,
  },
]

// ─── Labels e cores ───────────────────────────────────────────────────────────

const gatilhoLabel: Record<TipoGatilho, string> = {
  EVENTO:   'Gatilho: Evento',
  AGENDADO: 'Gatilho: Agendado',
  'CONDIÇÃO': 'Gatilho: Condição',
}

const acaoLabel: Record<TipoAção, string> = {
  MENSAGEM:     'Enviar mensagem',
  MOVER_COLUNA: 'Mover coluna',
  ATRIBUIR:     'Atribuir operador',
  TAG:          'Aplicar tag',
  ALERTA:       'Enviar alerta',
}

// ─── Toggle switch ────────────────────────────────────────────────────────────

function Toggle({ ativa, onChange }: { ativa: boolean; onChange: () => void }) {
  return (
    <button
      onClick={e => { e.stopPropagation(); onChange() }}
      className="relative w-11 h-6 rounded-full transition-colors shrink-0"
      style={{ backgroundColor: ativa ? 'var(--color-green)' : 'var(--color-border)' }}
    >
      <span
        className="absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all duration-200"
        style={{ left: ativa ? '23px' : '4px' }}
      />
    </button>
  )
}

// ─── Card de automação ────────────────────────────────────────────────────────

function AutomacaoCard({
  automacao,
  onToggle,
  onEditar,
}: {
  automacao: Automacao
  onToggle: () => void
  onEditar: () => void
}) {
  const Icon = automacao.icone
  return (
    <div
      className={cn(
        'rounded-xl p-5 flex flex-col gap-4 transition-shadow hover:shadow-md',
        !automacao.ativa && 'opacity-60'
      )}
      style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
    >
      {/* Topo: ícone + toggle */}
      <div className="flex items-start justify-between">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{
            backgroundColor: automacao.ativa ? 'var(--color-purple-light)' : 'var(--color-bg)',
          }}
        >
          <Icon
            size={20}
            style={{ color: automacao.ativa ? 'var(--color-accent)' : 'var(--color-text3)' }}
          />
        </div>
        <Toggle ativa={automacao.ativa} onChange={onToggle} />
      </div>

      {/* Nome + descrição */}
      <div className="flex-1">
        <p className="text-[15px] font-semibold mb-1.5" style={{ color: 'var(--color-text)' }}>
          {automacao.nome}
        </p>
        <p className="text-[13px] leading-relaxed" style={{ color: 'var(--color-text2)' }}>
          {automacao.descricao}
        </p>
        {automacao.inatividade && (
          <div className="mt-2.5 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-lg"
              style={{ backgroundColor: 'var(--color-amber-bg)', color: 'var(--color-amber)' }}>
              <Clock size={10} /> Alerta após {automacao.inatividade.tempoAlertaMin} min
            </span>
            {automacao.inatividade.tempoTrocaMin !== null && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-lg"
                style={{ backgroundColor: 'var(--color-red-bg)', color: 'var(--color-red)' }}>
                <ArrowRight size={10} /> Troca operador após {automacao.inatividade.tempoTrocaMin} min
              </span>
            )}
          </div>
        )}
      </div>

      {/* Ações (chips) */}
      <div className="flex flex-wrap gap-1.5">
        {automacao.acoes.map(a => (
          <span
            key={a}
            className="text-[10px] font-medium px-2 py-0.5 rounded-full"
            style={{ backgroundColor: 'var(--color-blue-bg)', color: 'var(--color-blue)' }}
          >
            {acaoLabel[a]}
          </span>
        ))}
      </div>

      {/* Rodapé */}
      <div
        className="flex items-center justify-between pt-3"
        style={{ borderTop: '1px solid var(--color-border)' }}
      >
        <div className="flex items-center gap-1.5">
          <span
            className="text-[10px] font-semibold uppercase tracking-wide"
            style={{ color: 'var(--color-text3)' }}
          >
            {gatilhoLabel[automacao.gatilho]}
          </span>
          {automacao.execucoes > 0 && (
            <>
              <span style={{ color: 'var(--color-border)' }}>·</span>
              <span className="text-[10px]" style={{ color: 'var(--color-text3)' }}>
                {automacao.execucoes} execuções
              </span>
            </>
          )}
        </div>
        <button
          onClick={onEditar}
          className="text-[12px] font-semibold transition-opacity hover:opacity-70"
          style={{ color: 'var(--color-accent)' }}
        >
          Editar regra
        </button>
      </div>
    </div>
  )
}

// ─── Modal de edição ──────────────────────────────────────────────────────────

const OPCOES_TEMPO = [5, 10, 15, 20, 30, 45, 60, 90, 120]

function ModalEdicao({ automacao, onClose }: { automacao: Automacao; onClose: () => void }) {
  const [nome, setNome]               = useState(automacao.nome)
  const [descricao, setDescricao]     = useState(automacao.descricao)
  const [tempoAlerta, setTempoAlerta] = useState(automacao.inatividade?.tempoAlertaMin ?? 30)
  const [tempoTroca, setTempoTroca]   = useState(automacao.inatividade?.tempoTrocaMin ?? null)
  const [trocaAtiva, setTrocaAtiva]   = useState(automacao.inatividade?.tempoTrocaMin !== null)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div
        className="w-full max-w-lg rounded-xl shadow-2xl"
        style={{ backgroundColor: 'var(--color-surface)' }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
          <div className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: 'var(--color-purple-light)' }}
            >
              <automacao.icone size={14} style={{ color: 'var(--color-accent)' }} />
            </div>
            <p className="text-[15px] font-semibold" style={{ color: 'var(--color-text)' }}>
              Editar automação
            </p>
          </div>
          <button onClick={onClose} style={{ color: 'var(--color-text3)' }}>
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-[12px] font-medium mb-1.5" style={{ color: 'var(--color-text2)' }}>
              Nome da automação
            </label>
            <input
              type="text"
              value={nome}
              onChange={e => setNome(e.target.value)}
              className="w-full text-[13px] px-3 py-2.5 rounded-lg outline-none"
              style={{ border: '1.5px solid var(--color-purple-border)', backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}
            />
          </div>

          <div>
            <label className="block text-[12px] font-medium mb-1.5" style={{ color: 'var(--color-text2)' }}>
              Descrição / condição
            </label>
            <textarea
              rows={3}
              value={descricao}
              onChange={e => setDescricao(e.target.value)}
              className="w-full text-[13px] px-3 py-2.5 rounded-lg outline-none resize-none"
              style={{ border: '1.5px solid var(--color-purple-border)', backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}
            />
          </div>

          <div>
            <label className="block text-[12px] font-medium mb-1.5" style={{ color: 'var(--color-text2)' }}>
              Tipo de gatilho
            </label>
            <div className="flex items-center gap-2">
              {(['EVENTO', 'AGENDADO', 'CONDIÇÃO'] as TipoGatilho[]).map(g => (
                <button
                  key={g}
                  className="flex-1 py-2 rounded-lg text-[12px] font-medium transition-all"
                  style={{
                    border: `2px solid ${automacao.gatilho === g ? 'var(--color-accent)' : 'var(--color-border)'}`,
                    backgroundColor: automacao.gatilho === g ? 'var(--color-purple-light)' : 'transparent',
                    color: automacao.gatilho === g ? 'var(--color-accent)' : 'var(--color-text2)',
                  }}
                >
                  {g.charAt(0) + g.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-medium mb-2" style={{ color: 'var(--color-text2)' }}>
              Ações executadas
            </label>
            <div className="flex flex-wrap gap-2">
              {automacao.acoes.map(a => (
                <div
                  key={a}
                  className="flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1.5 rounded-lg"
                  style={{ backgroundColor: 'var(--color-blue-bg)', color: 'var(--color-blue)', border: '1px solid var(--color-blue)' }}
                >
                  <Check size={10} /> {acaoLabel[a]}
                </div>
              ))}
            </div>
          </div>

          {/* Config de inatividade — só exibe para automações de inatividade */}
          {automacao.inatividade !== undefined && (
            <div
              className="rounded-xl p-4 space-y-4"
              style={{ backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)' }}
            >
              <p className="text-[12px] font-semibold flex items-center gap-1.5" style={{ color: 'var(--color-text)' }}>
                <Clock size={13} style={{ color: 'var(--color-amber)' }} />
                Configuração de tempo
              </p>

              {/* Tempo de alerta */}
              <div>
                <label className="block text-[11px] font-medium mb-2" style={{ color: 'var(--color-text2)' }}>
                  Alertar operador após quantos minutos sem resposta?
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {OPCOES_TEMPO.map(t => (
                    <button
                      key={t}
                      onClick={() => setTempoAlerta(t)}
                      className="px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all"
                      style={{
                        border: `2px solid ${tempoAlerta === t ? 'var(--color-amber)' : 'var(--color-border)'}`,
                        backgroundColor: tempoAlerta === t ? 'var(--color-amber-bg)' : 'transparent',
                        color: tempoAlerta === t ? 'var(--color-amber)' : 'var(--color-text2)',
                      }}
                    >
                      {t >= 60 ? `${t / 60}h` : `${t}min`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Troca automática de operador */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[11px] font-medium" style={{ color: 'var(--color-text2)' }}>
                    Trocar operador automaticamente?
                  </label>
                  <button
                    onClick={() => setTrocaAtiva(v => !v)}
                    className="relative w-9 h-5 rounded-full transition-colors"
                    style={{ backgroundColor: trocaAtiva ? 'var(--color-red)' : 'var(--color-border)' }}
                  >
                    <span
                      className="absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white shadow transition-all duration-200"
                      style={{ left: trocaAtiva ? '18px' : '3px' }}
                    />
                  </button>
                </div>
                {trocaAtiva && (
                  <>
                    <p className="text-[10px] mb-2" style={{ color: 'var(--color-text3)' }}>
                      Reatribuir via Round Robin após quantos minutos sem resposta?
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {OPCOES_TEMPO.filter(t => t >= tempoAlerta).map(t => (
                        <button
                          key={t}
                          onClick={() => setTempoTroca(t)}
                          className="px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all"
                          style={{
                            border: `2px solid ${tempoTroca === t ? 'var(--color-red)' : 'var(--color-border)'}`,
                            backgroundColor: tempoTroca === t ? 'var(--color-red-bg)' : 'transparent',
                            color: tempoTroca === t ? 'var(--color-red)' : 'var(--color-text2)',
                          }}
                        >
                          {t >= 60 ? `${t / 60}h` : `${t}min`}
                        </button>
                      ))}
                    </div>
                    <p className="text-[10px] mt-1.5" style={{ color: 'var(--color-text3)' }}>
                      Apenas opções ≥ {tempoAlerta >= 60 ? `${tempoAlerta / 60}h` : `${tempoAlerta}min`} (tempo de alerta)
                    </p>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 px-6 py-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg text-[13px] font-medium"
            style={{ border: '1px solid var(--color-border)', color: 'var(--color-text2)' }}
          >
            Cancelar
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg text-[13px] font-medium text-white"
            style={{ backgroundColor: 'var(--color-accent)' }}
          >
            Salvar alterações
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Página ───────────────────────────────────────────────────────────────────

export default function AutomacaoPage() {
  const [automacoes, setAutomacoes] = useState(mockAutomacoes)
  const [editando, setEditando] = useState<Automacao | null>(null)
  const [filtro, setFiltro] = useState<'todas' | 'ativas' | 'inativas'>('todas')

  function toggleAtiva(id: string) {
    setAutomacoes(prev =>
      prev.map(a => a.id === id ? { ...a, ativa: !a.ativa } : a)
    )
  }

  const ativas   = automacoes.filter(a => a.ativa).length
  const inativas = automacoes.filter(a => !a.ativa).length

  const filtradas = automacoes.filter(a => {
    if (filtro === 'ativas')   return a.ativa
    if (filtro === 'inativas') return !a.ativa
    return true
  })

  return (
    <AppLayout title="Automação" subtitle="Regras automáticas de atendimento e pipeline">
      <div className="p-6 space-y-5">
        {/* Barra de ações */}
        <div className="flex items-center gap-3">
          {/* Resumo */}
          <div className="flex items-center gap-4 mr-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--color-green)' }} />
              <span className="text-[13px]" style={{ color: 'var(--color-text2)' }}>
                <strong style={{ color: 'var(--color-text)' }}>{ativas}</strong> ativas
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--color-border)' }} />
              <span className="text-[13px]" style={{ color: 'var(--color-text2)' }}>
                <strong style={{ color: 'var(--color-text)' }}>{inativas}</strong> inativas
              </span>
            </div>
          </div>

          {/* Filtros */}
          <div className="flex items-center gap-1 p-0.5 rounded-lg" style={{ backgroundColor: 'var(--color-bg)' }}>
            {([
              { key: 'todas',    label: 'Todas' },
              { key: 'ativas',   label: 'Ativas' },
              { key: 'inativas', label: 'Inativas' },
            ] as const).map(f => (
              <button
                key={f.key}
                onClick={() => setFiltro(f.key)}
                className="px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors"
                style={{
                  backgroundColor: filtro === f.key ? 'var(--color-surface)' : 'transparent',
                  color: filtro === f.key ? 'var(--color-accent)' : 'var(--color-text2)',
                  boxShadow: filtro === f.key ? '0 1px 3px rgba(0,0,0,0.08)' : undefined,
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="flex-1" />

          <button
            className="flex items-center gap-1.5 text-[13px] font-medium px-4 py-2 rounded-lg text-white"
            style={{ backgroundColor: 'var(--color-accent)' }}
          >
            <Plus size={14} /> Nova automação
          </button>
        </div>

        {/* Grid de cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtradas.map(a => (
            <AutomacaoCard
              key={a.id}
              automacao={a}
              onToggle={() => toggleAtiva(a.id)}
              onEditar={() => setEditando(a)}
            />
          ))}
        </div>

        {filtradas.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20">
            <Zap size={32} className="mb-3" style={{ color: 'var(--color-text3)' }} />
            <p className="text-[14px] font-medium" style={{ color: 'var(--color-text)' }}>Nenhuma automação encontrada</p>
          </div>
        )}
      </div>

      {editando && (
        <div className="fixed inset-0 z-40 bg-black/20" onClick={() => setEditando(null)} />
      )}
      {editando && (
        <ModalEdicao automacao={editando} onClose={() => setEditando(null)} />
      )}
    </AppLayout>
  )
}
