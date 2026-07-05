'use client'

import { useState, useEffect } from 'react'
import { AppLayout } from '@/components/layout/AppLayout'
import { GraficoAtendimentos } from '@/components/dashboard/GraficoAtendimentos'
import { apiFetch } from '@/lib/auth'
import {
  MessageSquare, Clock, CheckCircle2, Star,
  TrendingUp, ArrowUpRight, Zap,
} from 'lucide-react'

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface Kpis {
  totalAtendimentos: number
  emAtendimento: number
  aguardando: number
  encerradosHoje: number
  tmrMinutos: number
  notaMedia: number
}
interface Coluna { id: string; nome: string; cor: string; totalChats: number }
interface Recente {
  id: string
  status: string
  contato: { nome: string }
  ultimaMensagem: { conteudo: string } | null
}
interface GraficoDia { dia: string; total: number; encerrados: number }
interface DashboardData { kpis: Kpis; colunas: Coluna[]; recentes: Recente[]; grafico: GraficoDia[] }

// ─── Componente de KPI Card ───────────────────────────────────────────────────

function KpiCard({
  label, value, sub, icon: Icon, iconBg,
}: {
  label: string
  value: string | number
  sub?: string
  icon: React.ElementType
  iconBg: string
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
      </div>
    </div>
  )
}

// ─── Mini Kanban ──────────────────────────────────────────────────────────────

function MiniKanban({ colunas }: { colunas: Coluna[] }) {
  const total = colunas.reduce((s, c) => s + c.totalChats, 0)
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
      {colunas.length === 0 ? (
        <p className="text-[12px]" style={{ color: 'var(--color-text3)' }}>Nenhuma coluna configurada ainda.</p>
      ) : (
        <div className="space-y-2.5">
          {colunas.map((col) => {
            const pct = total ? Math.round((col.totalChats / total) * 100) : 0
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
      )}
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

function AtendimentosRecentes({ recentes }: { recentes: Recente[] }) {
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
      {recentes.length === 0 ? (
        <div className="px-5 py-8 text-center text-[12px]" style={{ color: 'var(--color-text3)' }}>
          Nenhum atendimento ainda.
        </div>
      ) : (
        <div>
          {recentes.map((chat, i) => {
            const s = statusLabel(chat.status)
            return (
              <div
                key={chat.id}
                className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors cursor-pointer"
                style={{ borderBottom: i < recentes.length - 1 ? '1px solid var(--color-border)' : undefined }}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-semibold shrink-0"
                  style={{ backgroundColor: 'var(--color-accent)' }}
                >
                  {chat.contato.nome.split(' ').map(n => n[0]).slice(0, 2).join('')}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium truncate" style={{ color: 'var(--color-text)' }}>
                    {chat.contato.nome}
                  </p>
                  <p className="text-[11px] truncate" style={{ color: 'var(--color-text3)' }}>
                    {chat.ultimaMensagem?.conteudo}
                  </p>
                </div>
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
      )}
    </div>
  )
}

// ─── Página ───────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)

  useEffect(() => {
    apiFetch('/api/dashboard')
      .then(r => r.json())
      .then(d => { if (d && d.kpis) setData(d as DashboardData) })
      .catch(() => {})
  }, [])

  const k = data?.kpis

  return (
    <AppLayout title="Dashboard" subtitle="Visão geral dos atendimentos">
      <div className="p-6 space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <KpiCard label="Total hoje"       value={k?.totalAtendimentos ?? 0} icon={MessageSquare} iconBg="var(--color-accent)" />
          <KpiCard label="Em atendimento"   value={k?.emAtendimento ?? 0}     icon={Zap}           iconBg="var(--color-blue)" />
          <KpiCard label="Aguardando"       value={k?.aguardando ?? 0}        icon={Clock}         iconBg="var(--color-amber)" />
          <KpiCard label="Encerrados hoje"  value={k?.encerradosHoje ?? 0}    icon={CheckCircle2}  iconBg="var(--color-green)" />
          <KpiCard label="TMR (min)"        value={k?.tmrMinutos ?? 0}        icon={TrendingUp}    iconBg="#8B5CF6" />
          <KpiCard label="Nota média"       value={k?.notaMedia ?? 0}         icon={Star}          iconBg="#F59E0B"  sub="de 5.0" />
        </div>

        {/* Gráfico + Mini Kanban */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="xl:col-span-2">
            <GraficoAtendimentos dados={data?.grafico} />
          </div>
          <MiniKanban colunas={data?.colunas ?? []} />
        </div>

        {/* Atendimentos recentes */}
        <AtendimentosRecentes recentes={data?.recentes ?? []} />
      </div>
    </AppLayout>
  )
}
