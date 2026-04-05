import { AppLayout } from '@/components/layout/AppLayout'
import { GraficoAtendimentos } from '@/components/dashboard/GraficoAtendimentos'
import { mockKpis } from '@/src/mocks/dashboard'
import { mockChats } from '@/src/mocks/chats'
import { mockColunasAtendimento } from '@/src/mocks/kanban'
import {
  MessageSquare, Clock, CheckCircle2, Star,
  TrendingUp, ArrowUpRight, Zap,
} from 'lucide-react'

// ─── Componente de KPI Card ───────────────────────────────────────────────────

function KpiCard({
  label, value, sub, icon: Icon, iconBg, trend,
}: {
  label: string
  value: string | number
  sub?: string
  icon: React.ElementType
  iconBg: string
  trend?: { value: string; positive: boolean }
}) {
  return (
    <div
      className="rounded-lg p-5 flex items-start gap-4"
      style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
    >
      <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: iconBg }}>
        <Icon size={18} className="text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[12px]" style={{ color: 'var(--color-text2)' }}>{label}</p>
        <p className="text-[22px] font-semibold mt-0.5" style={{ color: 'var(--color-text)' }}>{value}</p>
        {sub && <p className="text-[11px] mt-0.5" style={{ color: 'var(--color-text3)' }}>{sub}</p>}
        {trend && (
          <p
            className="text-[11px] mt-1 flex items-center gap-1"
            style={{ color: trend.positive ? 'var(--color-green)' : 'var(--color-red)' }}
          >
            <ArrowUpRight size={12} className={trend.positive ? '' : 'rotate-180'} />
            {trend.value} vs ontem
          </p>
        )}
      </div>
    </div>
  )
}

// ─── Mini Kanban ──────────────────────────────────────────────────────────────

function MiniKanban() {
  return (
    <div
      className="rounded-lg p-5"
      style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[14px] font-semibold" style={{ color: 'var(--color-text)' }}>Kanban</h2>
        <a href="/kanban" className="text-[11px] flex items-center gap-1" style={{ color: 'var(--color-accent)' }}>
          Ver tudo <ArrowUpRight size={10} />
        </a>
      </div>
      <div className="space-y-2.5">
        {mockColunasAtendimento.map((col) => {
          const total = mockColunasAtendimento.reduce((s, c) => s + (c.totalChats || 0), 0)
          const pct = Math.round(((col.totalChats || 0) / total) * 100)
          return (
            <div key={col.id}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: col.cor }} />
                  <span className="text-[12px]" style={{ color: 'var(--color-text)' }}>{col.nome}</span>
                </div>
                <span className="text-[12px] font-medium" style={{ color: 'var(--color-text2)' }}>
                  {col.totalChats}
                </span>
              </div>
              <div className="h-1.5 rounded-full" style={{ backgroundColor: 'var(--color-bg)' }}>
                <div
                  className="h-1.5 rounded-full transition-all"
                  style={{ width: `${pct}%`, backgroundColor: col.cor }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Atendimentos Recentes ────────────────────────────────────────────────────

function statusLabel(status: string) {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    AGUARDANDO:          { label: 'Aguardando',         color: 'var(--color-blue)',  bg: 'var(--color-blue-bg)' },
    EM_ATENDIMENTO:      { label: 'Em Atendimento',     color: 'var(--color-accent)', bg: 'var(--color-purple-light)' },
    AGUARDANDO_CLIENTE:  { label: 'Ag. Cliente',        color: 'var(--color-amber)', bg: 'var(--color-amber-bg)' },
    ENCERRADO:           { label: 'Encerrado',          color: 'var(--color-green)', bg: 'var(--color-green-bg)' },
  }
  return map[status] ?? { label: status, color: '#888', bg: '#eee' }
}

function AtendimentosRecentes() {
  const recentes = mockChats.slice(0, 5)
  return (
    <div
      className="rounded-lg"
      style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
    >
      <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
        <h2 className="text-[14px] font-semibold" style={{ color: 'var(--color-text)' }}>Atendimentos Recentes</h2>
        <a href="/inbox" className="text-[11px] flex items-center gap-1" style={{ color: 'var(--color-accent)' }}>
          Ver todos <ArrowUpRight size={10} />
        </a>
      </div>
      <div>
        {recentes.map((chat, i) => {
          const s = statusLabel(chat.status)
          return (
            <div
              key={chat.id}
              className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors cursor-pointer"
              style={{ borderBottom: i < recentes.length - 1 ? '1px solid var(--color-border)' : undefined }}
            >
              {/* Avatar */}
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-semibold shrink-0"
                style={{ backgroundColor: 'var(--color-accent)' }}
              >
                {chat.contato.nome.split(' ').map(n => n[0]).slice(0, 2).join('')}
              </div>
              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium truncate" style={{ color: 'var(--color-text)' }}>
                  {chat.contato.nome}
                </p>
                <p className="text-[11px] truncate" style={{ color: 'var(--color-text3)' }}>
                  {chat.ultimaMensagem?.conteudo}
                </p>
              </div>
              {/* Status badge */}
              <span
                className="text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0"
                style={{ color: s.color, backgroundColor: s.bg }}
              >
                {s.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Página ───────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { totalAtendimentos, emAtendimento, aguardando, encerradosHoje, tmrMinutos, notaMedia } = mockKpis

  return (
    <AppLayout title="Dashboard" subtitle="Visão geral dos atendimentos">
      <div className="p-6 space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <KpiCard label="Total hoje"       value={totalAtendimentos} icon={MessageSquare} iconBg="var(--color-accent)"  trend={{ value: '+12%', positive: true }} />
          <KpiCard label="Em atendimento"   value={emAtendimento}     icon={Zap}           iconBg="var(--color-blue)" />
          <KpiCard label="Aguardando"       value={aguardando}        icon={Clock}         iconBg="var(--color-amber)" />
          <KpiCard label="Encerrados hoje"  value={encerradosHoje}    icon={CheckCircle2}  iconBg="var(--color-green)" />
          <KpiCard label="TMR (min)"        value={tmrMinutos}        icon={TrendingUp}    iconBg="#8B5CF6"  trend={{ value: '-0.8min', positive: true }} />
          <KpiCard label="Nota média"       value={notaMedia}         icon={Star}          iconBg="#F59E0B"  sub="de 5.0" />
        </div>

        {/* Gráfico + Mini Kanban */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="xl:col-span-2">
            <GraficoAtendimentos />
          </div>
          <MiniKanban />
        </div>

        {/* Atendimentos recentes */}
        <AtendimentosRecentes />
      </div>
    </AppLayout>
  )
}
