'use client'

import { useState } from 'react'
import { mockGraficoSemana } from '@/src/mocks/dashboard'

type TipoGrafico = 'linha' | 'area' | 'barras'

// ─── Dimensões do SVG ─────────────────────────────────────────────────────────

const W     = 580
const H     = 140
const PAD_L = 32
const PAD_R = 12
const PAD_T = 12
const PAD_B = 26
const CW    = W - PAD_L - PAD_R
const CH    = H - PAD_T - PAD_B

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toPoints(data: typeof mockGraficoSemana, key: 'total' | 'encerrados', max: number) {
  return data.map((d, i) => ({
    x: PAD_L + (i / (data.length - 1)) * CW,
    y: PAD_T + (1 - d[key] / max) * CH,
    v: d[key],
    dia: d.dia,
  }))
}

function smoothPath(pts: { x: number; y: number }[]) {
  if (pts.length < 2) return ''
  let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`
  for (let i = 1; i < pts.length; i++) {
    const cx = ((pts[i - 1].x + pts[i].x) / 2).toFixed(1)
    d += ` C ${cx} ${pts[i - 1].y.toFixed(1)}, ${cx} ${pts[i].y.toFixed(1)}, ${pts[i].x.toFixed(1)} ${pts[i].y.toFixed(1)}`
  }
  return d
}

function areaPath(pts: { x: number; y: number }[]) {
  const bottom = (PAD_T + CH).toFixed(1)
  return `${smoothPath(pts)} L ${pts[pts.length - 1].x.toFixed(1)} ${bottom} L ${pts[0].x.toFixed(1)} ${bottom} Z`
}

// Gera um comentário automático baseado nos dados do dia
function gerarComentario(d: typeof mockGraficoSemana[0], data: typeof mockGraficoSemana) {
  const maxTotal = Math.max(...data.map(x => x.total))
  const minTotal = Math.min(...data.map(x => x.total))
  const avg      = data.reduce((s, x) => s + x.total, 0) / data.length
  const taxa     = Math.round((d.encerrados / d.total) * 100)

  if (d.total === maxTotal)  return { texto: 'Pico da semana', emoji: '🔥' }
  if (d.total === minTotal)  return { texto: 'Dia mais tranquilo', emoji: '😴' }
  if (taxa === 100)          return { texto: 'Todos encerrados!', emoji: '✅' }
  if (taxa >= 95)            return { texto: 'Taxa de resolução excelente', emoji: '📈' }
  if (d.total > avg * 1.1)  return { texto: 'Acima da média', emoji: '↑' }
  if (d.total < avg * 0.9)  return { texto: 'Abaixo da média', emoji: '↓' }
  return { texto: 'Dentro da média', emoji: '—' }
}

// ─── Tooltip ──────────────────────────────────────────────────────────────────

function Tooltip({ idx, data }: { idx: number; data: typeof mockGraficoSemana }) {
  const d    = data[idx]
  const taxa = Math.round((d.encerrados / d.total) * 100)
  const com  = gerarComentario(d, data)

  // Posição horizontal: % do total de dias (0..1) mapeada para a área do gráfico
  const pct     = idx / (data.length - 1)               // 0 → 1
  const leftPct = PAD_L / W * 100 + pct * (CW / W * 100) // % da largura do container
  const anchor  = pct < 0.15 ? '0%' : pct > 0.85 ? '-100%' : '-50%'

  return (
    <div
      className="absolute z-20 pointer-events-none"
      style={{ bottom: '36px', left: `${leftPct}%`, transform: `translateX(${anchor})` }}
    >
      <div
        className="rounded-xl px-3.5 py-3 text-left min-w-[148px]"
        style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.13)',
        }}
      >
        <p className="text-[12px] font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
          {d.dia}
        </p>
        <div className="space-y-1.5">
          <TooltipRow cor="var(--color-accent)" label="Total" valor={String(d.total)} />
          <TooltipRow cor="var(--color-green)"  label="Encerrados" valor={String(d.encerrados)} valorCor="var(--color-green)" />
          <div className="flex items-center justify-between gap-4">
            <span className="text-[11px]" style={{ color: 'var(--color-text2)' }}>Resolução</span>
            <span className="text-[11px] font-semibold"
              style={{ color: taxa >= 90 ? 'var(--color-green)' : taxa >= 75 ? 'var(--color-amber)' : 'var(--color-red)' }}>
              {taxa}%
            </span>
          </div>
        </div>
        <div className="mt-2.5 pt-2.5 flex items-center gap-1.5 text-[11px]"
          style={{ borderTop: '1px solid var(--color-border)', color: 'var(--color-text3)' }}>
          <span>{com.emoji}</span>
          <span>{com.texto}</span>
        </div>
        {/* Seta */}
        <div className="absolute bottom-[-6px] w-3 h-3 rotate-45"
          style={{
            backgroundColor: 'var(--color-surface)',
            borderRight: '1px solid var(--color-border)',
            borderBottom: '1px solid var(--color-border)',
            left: anchor === '0%' ? '12px' : anchor === '-100%' ? 'calc(100% - 20px)' : 'calc(50% - 6px)',
          }}
        />
      </div>
    </div>
  )
}

function TooltipRow({ cor, label, valor, valorCor }: { cor: string; label: string; valor: string; valorCor?: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cor }} />
        <span className="text-[11px]" style={{ color: 'var(--color-text2)' }}>{label}</span>
      </div>
      <span className="text-[12px] font-semibold" style={{ color: valorCor ?? 'var(--color-text)' }}>{valor}</span>
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function GraficoAtendimentos() {
  const [tipo, setTipo] = useState<TipoGrafico>('linha')
  const [hovIdx, setHovIdx] = useState<number | null>(null)

  const data   = mockGraficoSemana
  const maxVal = Math.max(...data.map(d => d.total))
  const pTotal = toPoints(data, 'total', maxVal)
  const pEnc   = toPoints(data, 'encerrados', maxVal)

  const ySteps = 4
  const grid   = Array.from({ length: ySteps + 1 }, (_, i) => ({
    v: Math.round((maxVal / ySteps) * i),
    y: PAD_T + CH - (i / ySteps) * CH,
  }))

  const barW = (CW / data.length) * 0.3

  return (
    <div
      className="rounded-lg p-5"
      style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h2 className="text-[14px] font-semibold" style={{ color: 'var(--color-text)' }}>
          Atendimentos — últimos 7 dias
        </h2>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 text-[11px]" style={{ color: 'var(--color-text2)' }}>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-5 h-[2px] rounded" style={{ backgroundColor: 'var(--color-accent)' }} />
              Total
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-5 h-[2px] rounded" style={{ backgroundColor: 'var(--color-green)' }} />
              Encerrados
            </span>
          </div>

          <div className="flex items-center p-0.5 rounded-lg gap-0.5" style={{ backgroundColor: 'var(--color-bg)' }}>
            {(['linha', 'area', 'barras'] as TipoGrafico[]).map(t => (
              <button
                key={t}
                onClick={() => setTipo(t)}
                className="px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors"
                style={{
                  backgroundColor: tipo === t ? 'var(--color-surface)' : 'transparent',
                  color: tipo === t ? 'var(--color-accent)' : 'var(--color-text3)',
                  boxShadow: tipo === t ? '0 1px 3px rgba(0,0,0,0.08)' : undefined,
                }}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Wrapper relativo para o tooltip HTML */}
      <div className="relative" onMouseLeave={() => setHovIdx(null)}>
        {/* Tooltip */}
        {hovIdx !== null && (
          <Tooltip idx={hovIdx} data={data} />
        )}

        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full"
          style={{ height: 160, overflow: 'visible' }}
        >
          <defs>
            <linearGradient id="grad-total" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7C3AED" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#7C3AED" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="grad-enc" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10B981" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Grid horizontal */}
          {grid.map(({ y, v }, i) => (
            <g key={i}>
              <line
                x1={PAD_L} y1={y} x2={W - PAD_R} y2={y}
                strokeWidth={0.5}
                strokeDasharray={i === 0 ? undefined : '4 4'}
                style={{ stroke: 'var(--color-border)' }}
              />
              <text x={PAD_L - 6} y={y + 3.5} textAnchor="end" fontSize={9} style={{ fill: 'var(--color-text3)' }}>
                {v}
              </text>
            </g>
          ))}

          {/* Labels X */}
          {pTotal.map((p, i) => (
            <text
              key={p.dia}
              x={p.x} y={H - 4}
              textAnchor="middle"
              fontSize={10}
              style={{ fill: hovIdx === i ? 'var(--color-accent)' : 'var(--color-text3)', fontWeight: hovIdx === i ? 600 : 400 }}
            >
              {p.dia}
            </text>
          ))}

          {/* ── Barras ── */}
          {tipo === 'barras' && data.map((d, i) => {
            const x    = PAD_L + (i / (data.length - 1)) * CW
            const htot = (d.total / maxVal) * CH
            const henc = (d.encerrados / maxVal) * CH
            const hov  = hovIdx === i
            return (
              <g key={d.dia}>
                <rect x={x - barW - 1.5} y={PAD_T + CH - htot} width={barW} height={htot} rx={3}
                  fill="#7C3AED" fillOpacity={hov ? 1 : 0.75} />
                <rect x={x + 1.5} y={PAD_T + CH - henc} width={barW} height={henc} rx={3}
                  fill="#10B981" fillOpacity={hov ? 1 : 0.75} />
                {/* Hit area invisível */}
                <rect
                  x={x - CW / data.length / 2} y={PAD_T}
                  width={CW / data.length} height={CH}
                  fill="transparent"
                  style={{ cursor: 'crosshair' }}
                  onMouseEnter={() => setHovIdx(i)}
                />
              </g>
            )
          })}

          {/* ── Linha / Área ── */}
          {(tipo === 'linha' || tipo === 'area') && (
            <>
              {tipo === 'area' && (
                <>
                  <path d={areaPath(pTotal)} fill="url(#grad-total)" />
                  <path d={areaPath(pEnc)}   fill="url(#grad-enc)" />
                </>
              )}

              <path d={smoothPath(pTotal)} fill="none" strokeWidth={2} strokeLinecap="round"
                style={{ stroke: 'var(--color-accent)' }} />
              <path d={smoothPath(pEnc)} fill="none" strokeWidth={2} strokeLinecap="round"
                style={{ stroke: 'var(--color-green)' }} />

              {/* Pontos com hover */}
              {pTotal.map((p, i) => {
                const hov = hovIdx === i
                return (
                  <circle key={`t-${p.dia}`} cx={p.x} cy={p.y}
                    r={hov ? 5 : 3.5} strokeWidth={2}
                    style={{
                      fill: hov ? 'var(--color-accent)' : 'var(--color-surface)',
                      stroke: 'var(--color-accent)',
                      transition: 'r 0.15s ease',
                    }}
                  />
                )
              })}
              {pEnc.map((p, i) => {
                const hov = hovIdx === i
                return (
                  <circle key={`e-${p.dia}`} cx={p.x} cy={p.y}
                    r={hov ? 5 : 3.5} strokeWidth={2}
                    style={{
                      fill: hov ? 'var(--color-green)' : 'var(--color-surface)',
                      stroke: 'var(--color-green)',
                      transition: 'r 0.15s ease',
                    }}
                  />
                )
              })}

              {/* Áreas de hover invisíveis (mais fáceis de ativar) */}
              {pTotal.map((p, i) => (
                <circle
                  key={`hov-${i}`}
                  cx={p.x} cy={p.y} r={18}
                  fill="transparent"
                  style={{ cursor: 'crosshair' }}
                  onMouseEnter={() => setHovIdx(i)}
                />
              ))}
            </>
          )}
        </svg>
      </div>
    </div>
  )
}
