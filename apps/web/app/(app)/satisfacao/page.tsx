'use client'

import { useState } from 'react'
import { AppLayout } from '@/components/layout/AppLayout'
import { mockAvaliacoes } from '@/src/mocks/avaliacoes'
import { Star, AlertTriangle, MessageSquare, ThumbsUp, ExternalLink, Edit2, Check, X, Gift, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function tempoRelativo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  if (diff < 3600000)  return `${Math.floor(diff / 60000)}m atrás`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h atrás`
  return `${Math.floor(diff / 86400000)}d atrás`
}

function iniciais(nome: string) {
  return nome.split(' ').map(n => n[0]).slice(0, 2).join('')
}

// ─── Estrelas ─────────────────────────────────────────────────────────────────

function Estrelas({ nota, size = 14 }: { nota: number; size?: number }) {
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

// ─── Distribuição de notas ────────────────────────────────────────────────────

function DistribuicaoNotas() {
  const total = mockAvaliacoes.length
  const distribuicao = [5, 4, 3, 2, 1].map(nota => ({
    nota,
    count: mockAvaliacoes.filter(a => a.nota === nota).length,
  }))

  return (
    <div className="space-y-2">
      {distribuicao.map(({ nota, count }) => {
        const pct = total > 0 ? (count / total) * 100 : 0
        return (
          <div key={nota} className="flex items-center gap-3">
            <div className="flex items-center gap-0.5 shrink-0 w-[60px] justify-end">
              <span className="text-[12px]" style={{ color: 'var(--color-text2)' }}>{nota}</span>
              <Star size={11} fill="var(--color-amber)" style={{ color: 'var(--color-amber)' }} />
            </div>
            <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-bg)' }}>
              <div
                className="h-2 rounded-full transition-all"
                style={{ width: `${pct}%`, backgroundColor: nota >= 4 ? 'var(--color-green)' : nota === 3 ? 'var(--color-amber)' : 'var(--color-red)' }}
              />
            </div>
            <span className="text-[12px] w-6 shrink-0" style={{ color: 'var(--color-text3)' }}>{count}</span>
          </div>
        )
      })}
    </div>
  )
}

// ─── Card de avaliação ────────────────────────────────────────────────────────

function AvaliacaoCard({ av }: { av: typeof mockAvaliacoes[0] }) {
  const ruim = av.nota <= 2
  return (
    <div
      className="rounded-lg p-4"
      style={{
        backgroundColor: 'var(--color-surface)',
        border: `1px solid ${ruim ? 'var(--color-red)' : 'var(--color-border)'}`,
      }}
    >
      {ruim && (
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-md mb-3"
          style={{ backgroundColor: 'var(--color-red-bg)' }}
        >
          <AlertTriangle size={13} style={{ color: 'var(--color-red)' }} />
          <p className="text-[11px] font-semibold" style={{ color: 'var(--color-red)' }}>
            Nota baixa — supervisor notificado via alerta_satisfacao
          </p>
        </div>
      )}

      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-white text-[11px] font-semibold shrink-0"
            style={{ backgroundColor: ruim ? 'var(--color-red)' : 'var(--color-accent)' }}
          >
            {iniciais(av.contato.nome)}
          </div>
          <div>
            <p className="text-[13px] font-semibold" style={{ color: 'var(--color-text)' }}>{av.contato.nome}</p>
            <p className="text-[11px]" style={{ color: 'var(--color-text3)' }}>
              Atendido por {av.operador.nome.split(' ')[0]} · {tempoRelativo(av.criadaEm)}
            </p>
          </div>
        </div>
        <Estrelas nota={av.nota} size={15} />
      </div>

      {av.comentario && (
        <p
          className="mt-3 text-[12px] px-3 py-2.5 rounded-lg italic"
          style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text2)' }}
        >
          "{av.comentario}"
        </p>
      )}

      <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop: '1px solid var(--color-border)' }}>
        <a
          href="/inbox"
          className="text-[11px] font-medium flex items-center gap-1"
          style={{ color: 'var(--color-accent)' }}
        >
          <MessageSquare size={11} /> Ver conversa
        </a>
        <span
          className="text-[10px] font-medium px-2 py-0.5 rounded-full"
          style={{
            backgroundColor: av.nota >= 4 ? 'var(--color-green-bg)' : av.nota === 3 ? 'var(--color-amber-bg)' : 'var(--color-red-bg)',
            color: av.nota >= 4 ? 'var(--color-green)' : av.nota === 3 ? 'var(--color-amber)' : 'var(--color-red)',
          }}
        >
          {av.nota >= 4 ? 'Positiva' : av.nota === 3 ? 'Neutra' : 'Negativa'}
        </span>
      </div>
    </div>
  )
}

// ─── Google Meu Negócio ───────────────────────────────────────────────────────

const NOTA_MINIMA_OPCOES = [3, 4, 5]

// SVG do ícone Google (colorido)
function GoogleIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )
}

function CardGoogleMeuNegocio() {
  const [ativo, setAtivo]           = useState(true)
  const [notaMinima, setNotaMinima] = useState(4)
  const [link, setLink]             = useState('https://g.page/r/COLOQUE-SEU-LINK/review')
  const [editandoLink, setEditandoLink] = useState(false)
  const [linkTemp, setLinkTemp]     = useState(link)

  const convidados   = 47
  const avaliaram    = 31
  const conversao    = Math.round((avaliaram / convidados) * 100)
  const notaGoogle   = 4.8
  const totalGoogle  = 124

  const msgPreview = `Olá {{nome}}! 😊 Ficamos felizes que gostou do nosso atendimento! Que tal nos ajudar deixando uma avaliação no Google? Leva menos de 1 minuto: ${link}`

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)' }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-4"
        style={{ borderBottom: '1px solid var(--color-border)', background: 'linear-gradient(135deg, #f8f9ff 0%, #fff 100%)' }}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm" style={{ backgroundColor: '#fff', border: '1px solid var(--color-border)' }}>
            <GoogleIcon size={22} />
          </div>
          <div>
            <p className="text-[14px] font-semibold" style={{ color: 'var(--color-text)' }}>Google Meu Negócio</p>
            <p className="text-[11px]" style={{ color: 'var(--color-text3)' }}>
              Convida clientes satisfeitos a avaliar no Google
            </p>
          </div>
        </div>

        {/* Toggle */}
        <div className="flex items-center gap-2.5">
          <span className="text-[12px] font-medium" style={{ color: ativo ? 'var(--color-green)' : 'var(--color-text3)' }}>
            {ativo ? 'Ativo' : 'Inativo'}
          </span>
          <button
            onClick={() => setAtivo(a => !a)}
            className="relative w-11 h-6 rounded-full transition-colors"
            style={{ backgroundColor: ativo ? 'var(--color-green)' : 'var(--color-border)' }}
          >
            <span
              className="absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all duration-200"
              style={{ left: ativo ? '23px' : '4px' }}
            />
          </button>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-3">
          <StatBox valor={String(convidados)} label="Links enviados" cor="var(--color-blue)" bg="var(--color-blue-bg)" />
          <StatBox valor={String(avaliaram)}  label="Clicaram"      cor="var(--color-green)" bg="var(--color-green-bg)" />
          <StatBox valor={`${conversao}%`}    label="Clique/Envio"  cor="var(--color-accent)" bg="var(--color-purple-light)" />
          <StatBox
            valor={notaGoogle.toFixed(1)}
            label={`${totalGoogle} reviews`}
            cor="var(--color-amber)"
            bg="var(--color-amber-bg)"
            icone={<GoogleIcon size={13} />}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Configurações */}
          <div className="space-y-3.5">
            {/* Nota mínima */}
            <div>
              <label className="block text-[12px] font-medium mb-2" style={{ color: 'var(--color-text2)' }}>
                Enviar convite para notas ≥
              </label>
              <div className="flex gap-2">
                {NOTA_MINIMA_OPCOES.map(n => (
                  <button
                    key={n}
                    onClick={() => setNotaMinima(n)}
                    className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-[12px] font-medium transition-all"
                    style={{
                      border: `2px solid ${notaMinima === n ? 'var(--color-amber)' : 'var(--color-border)'}`,
                      backgroundColor: notaMinima === n ? 'var(--color-amber-bg)' : 'transparent',
                      color: notaMinima === n ? 'var(--color-amber)' : 'var(--color-text2)',
                    }}
                  >
                    {n} <Star size={11} fill={notaMinima === n ? 'var(--color-amber)' : 'none'} style={{ color: 'var(--color-amber)' }} />
                  </button>
                ))}
              </div>
              <p className="text-[10px] mt-1.5" style={{ color: 'var(--color-text3)' }}>
                Clientes com nota ≥ {notaMinima} ★ recebem o link por WhatsApp automaticamente.
              </p>
            </div>

            {/* Link de avaliação */}
            <div>
              <label className="block text-[12px] font-medium mb-1.5" style={{ color: 'var(--color-text2)' }}>
                Link de avaliação Google
              </label>
              {editandoLink ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={linkTemp}
                    onChange={e => setLinkTemp(e.target.value)}
                    className="flex-1 text-[12px] px-3 py-2 rounded-lg outline-none"
                    style={{ border: '1.5px solid var(--color-purple-border)', backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}
                    autoFocus
                  />
                  <button onClick={() => { setLink(linkTemp); setEditandoLink(false) }}
                    className="px-3 rounded-lg" style={{ backgroundColor: 'var(--color-green)', color: '#fff' }}>
                    <Check size={14} />
                  </button>
                  <button onClick={() => { setLinkTemp(link); setEditandoLink(false) }}
                    className="px-3 rounded-lg" style={{ border: '1px solid var(--color-border)', color: 'var(--color-text3)' }}>
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div
                    className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] truncate"
                    style={{ backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text3)' }}
                  >
                    <ExternalLink size={11} className="shrink-0" />
                    <span className="truncate">{link}</span>
                  </div>
                  <button onClick={() => setEditandoLink(true)}
                    className="p-2 rounded-lg transition-colors hover:bg-gray-100"
                    style={{ color: 'var(--color-text3)' }}>
                    <Edit2 size={13} />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Preview da mensagem */}
          <div>
            <label className="block text-[12px] font-medium mb-1.5" style={{ color: 'var(--color-text2)' }}>
              Preview da mensagem enviada
            </label>
            <div
              className="rounded-xl p-3"
              style={{ backgroundColor: '#e5ddd5' }}
            >
              <div
                className="rounded-2xl px-3.5 py-2.5 text-[12px] max-w-[90%] shadow-sm"
                style={{
                  backgroundColor: 'var(--color-surface)',
                  borderRadius: '18px 18px 18px 4px',
                  color: 'var(--color-text)',
                  lineHeight: '1.5',
                }}
              >
                {msgPreview.replace('{{nome}}', 'Maria')}
                <p className="text-[10px] text-right mt-1" style={{ color: 'var(--color-text3)' }}>agora ✓✓</p>
              </div>
            </div>
            <p className="text-[10px] mt-1.5" style={{ color: 'var(--color-text3)' }}>
              Enviada via WhatsApp 2 minutos após a nota ser registrada.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatBox({ valor, label, cor, bg, icone }: { valor: string; label: string; cor: string; bg: string; icone?: React.ReactNode }) {
  return (
    <div className="rounded-lg px-3 py-3 text-center" style={{ backgroundColor: bg, border: `1px solid ${cor}25` }}>
      <div className="flex items-center justify-center gap-1 mb-0.5">
        {icone}
        <p className="text-[18px] font-bold" style={{ color: cor }}>{valor}</p>
      </div>
      <p className="text-[10px]" style={{ color: 'var(--color-text3)' }}>{label}</p>
    </div>
  )
}

// ─── Brinde por Nota 5 ───────────────────────────────────────────────────────

type TipoBrinde = 'desconto' | 'produto' | 'voucher' | 'personalizado'

const TIPOS_BRINDE: { key: TipoBrinde; label: string; exemplo: string }[] = [
  { key: 'desconto',     label: '% Desconto',    exemplo: '10% de desconto na próxima compra' },
  { key: 'produto',      label: 'Produto grátis', exemplo: 'Um café grátis na sua próxima visita' },
  { key: 'voucher',      label: 'Voucher',        exemplo: 'Voucher de R$20 para usar em até 30 dias' },
  { key: 'personalizado',label: 'Personalizado',  exemplo: 'Surpresa especial para você!' },
]

function CardBrindeNota5() {
  const [ativo, setAtivo]         = useState(false)
  const [tipo, setTipo]           = useState<TipoBrinde>('desconto')
  const [mensagem, setMensagem]   = useState('Parabéns {{nome}}! 🎉 Como agradecimento pela sua avaliação 5 estrelas, preparamos um presente especial: {{brinde}}. Válido por 30 dias!')
  const brindesEnviados = 27
  const resgates        = 19

  const tipoAtual = TIPOS_BRINDE.find(t => t.key === tipo)!

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)' }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-4"
        style={{ borderBottom: '1px solid var(--color-border)', background: 'linear-gradient(135deg, #fffbf0 0%, #fff 100%)' }}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm" style={{ backgroundColor: 'var(--color-amber-bg)', border: '1px solid var(--color-amber)' }}>
            <Gift size={20} style={{ color: 'var(--color-amber)' }} />
          </div>
          <div>
            <p className="text-[14px] font-semibold" style={{ color: 'var(--color-text)' }}>Brinde por Nota 5</p>
            <p className="text-[11px]" style={{ color: 'var(--color-text3)' }}>
              Recompensa automática para clientes que avaliam com 5 estrelas
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="text-[12px] font-medium" style={{ color: ativo ? 'var(--color-green)' : 'var(--color-text3)' }}>
            {ativo ? 'Ativo' : 'Inativo'}
          </span>
          <button
            onClick={() => setAtivo(a => !a)}
            className="relative w-11 h-6 rounded-full transition-colors"
            style={{ backgroundColor: ativo ? 'var(--color-green)' : 'var(--color-border)' }}
          >
            <span
              className="absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all duration-200"
              style={{ left: ativo ? '23px' : '4px' }}
            />
          </button>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <StatBox valor={String(brindesEnviados)} label="Brindes enviados" cor="var(--color-amber)"  bg="var(--color-amber-bg)" />
          <StatBox valor={String(resgates)}        label="Resgates"         cor="var(--color-green)"  bg="var(--color-green-bg)" />
          <StatBox valor={`${Math.round((resgates / brindesEnviados) * 100)}%`} label="Taxa de resgate" cor="var(--color-accent)" bg="var(--color-purple-light)" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Config */}
          <div className="space-y-3.5">
            {/* Tipo de brinde */}
            <div>
              <label className="block text-[12px] font-medium mb-2" style={{ color: 'var(--color-text2)' }}>
                Tipo de brinde
              </label>
              <div className="grid grid-cols-2 gap-2">
                {TIPOS_BRINDE.map(t => (
                  <button
                    key={t.key}
                    onClick={() => setTipo(t.key)}
                    className="text-left px-3 py-2 rounded-lg text-[11px] font-medium transition-all"
                    style={{
                      border: `2px solid ${tipo === t.key ? 'var(--color-amber)' : 'var(--color-border)'}`,
                      backgroundColor: tipo === t.key ? 'var(--color-amber-bg)' : 'transparent',
                      color: tipo === t.key ? 'var(--color-amber)' : 'var(--color-text2)',
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Mensagem */}
            <div>
              <label className="block text-[12px] font-medium mb-1.5" style={{ color: 'var(--color-text2)' }}>
                Mensagem enviada
              </label>
              <textarea
                value={mensagem}
                onChange={e => setMensagem(e.target.value)}
                rows={4}
                className="w-full text-[12px] px-3 py-2 rounded-lg outline-none resize-none"
                style={{ border: '1.5px solid var(--color-border)', backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}
              />
              <div className="flex gap-1.5 mt-1.5 flex-wrap">
                {['{{nome}}', '{{brinde}}'].map(v => (
                  <span key={v} className="text-[10px] px-2 py-0.5 rounded font-mono"
                    style={{ backgroundColor: 'var(--color-blue-bg)', color: 'var(--color-blue)' }}>
                    {v}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Preview */}
          <div>
            <label className="block text-[12px] font-medium mb-1.5" style={{ color: 'var(--color-text2)' }}>
              Preview da mensagem
            </label>
            <div className="rounded-xl p-3" style={{ backgroundColor: '#e5ddd5' }}>
              <div
                className="rounded-2xl px-3.5 py-2.5 text-[12px] max-w-[90%] shadow-sm"
                style={{ backgroundColor: 'var(--color-surface)', borderRadius: '18px 18px 18px 4px', color: 'var(--color-text)', lineHeight: '1.5' }}
              >
                {mensagem.replace('{{nome}}', 'Maria').replace('{{brinde}}', tipoAtual.exemplo)}
                <p className="text-[10px] text-right mt-1" style={{ color: 'var(--color-text3)' }}>agora ✓✓</p>
              </div>
            </div>
            <a
              href="/automacao"
              className="mt-2 flex items-center gap-1 text-[11px] transition-colors hover:underline"
              style={{ color: 'var(--color-accent)' }}
            >
              Ver histórico completo em Automações <ArrowRight size={11} />
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Página ───────────────────────────────────────────────────────────────────

export default function SatisfacaoPage() {
  const [filtroNota, setFiltroNota] = useState<'todas' | 'positivas' | 'neutras' | 'negativas'>('todas')

  const total = mockAvaliacoes.length
  const notaMedia = total > 0 ? mockAvaliacoes.reduce((s, a) => s + a.nota, 0) / total : 0
  const positivas = mockAvaliacoes.filter(a => a.nota >= 4).length
  const alertas = mockAvaliacoes.filter(a => a.nota <= 2).length

  const avaliacoesFiltradas = mockAvaliacoes.filter(a => {
    if (filtroNota === 'positivas') return a.nota >= 4
    if (filtroNota === 'neutras')   return a.nota === 3
    if (filtroNota === 'negativas') return a.nota <= 2
    return true
  })

  const filtros = [
    { key: 'todas',     label: 'Todas',     count: total },
    { key: 'positivas', label: 'Positivas', count: positivas },
    { key: 'neutras',   label: 'Neutras',   count: mockAvaliacoes.filter(a => a.nota === 3).length },
    { key: 'negativas', label: 'Negativas', count: alertas },
  ] as const

  return (
    <AppLayout title="Satisfação" subtitle="Pesquisa de NPS e avaliações dos atendimentos">
      <div className="p-6 space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard icon={Star} iconBg="var(--color-amber)" label="Nota média" value={notaMedia.toFixed(1)} sub="de 5.0" />
          <KpiCard icon={MessageSquare} iconBg="var(--color-accent)" label="Total de avaliações" value={String(total)} sub="últimos 30 dias" />
          <KpiCard icon={ThumbsUp} iconBg="var(--color-green)" label="Avaliações positivas" value={`${Math.round((positivas / total) * 100)}%`} sub={`${positivas} de ${total}`} />
          <KpiCard icon={AlertTriangle} iconBg="var(--color-red)" label="Alertas ativos" value={String(alertas)} sub="notas ≤ 2" />
        </div>

        {/* Integrações e Automações */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <CardGoogleMeuNegocio />
          <CardBrindeNota5 />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Distribuição */}
          <div
            className="rounded-lg p-5"
            style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
          >
            <h2 className="text-[14px] font-semibold mb-4" style={{ color: 'var(--color-text)' }}>Distribuição</h2>
            <div className="flex items-center justify-center mb-5">
              <div className="text-center">
                <p className="text-[40px] font-bold" style={{ color: 'var(--color-text)' }}>{notaMedia.toFixed(1)}</p>
                <Estrelas nota={Math.round(notaMedia)} size={18} />
                <p className="text-[12px] mt-1" style={{ color: 'var(--color-text3)' }}>{total} avaliações</p>
              </div>
            </div>
            <DistribuicaoNotas />
          </div>

          {/* Lista de avaliações */}
          <div className="lg:col-span-2 space-y-4">
            {/* Filtros */}
            <div className="flex items-center gap-2">
              {filtros.map(f => (
                <button
                  key={f.key}
                  onClick={() => setFiltroNota(f.key)}
                  className="flex items-center gap-1.5 text-[11px] font-medium px-3 py-1.5 rounded-full transition-colors"
                  style={{
                    backgroundColor: filtroNota === f.key ? 'var(--color-accent)' : 'var(--color-surface)',
                    color: filtroNota === f.key ? '#fff' : 'var(--color-text2)',
                    border: `1px solid ${filtroNota === f.key ? 'var(--color-accent)' : 'var(--color-border)'}`,
                  }}
                >
                  {f.label} <span className="opacity-70">{f.count}</span>
                </button>
              ))}
            </div>

            <div className="space-y-3">
              {avaliacoesFiltradas.map(av => (
                <AvaliacaoCard key={av.id} av={av} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}

function KpiCard({ icon: Icon, iconBg, label, value, sub }: {
  icon: React.ElementType; iconBg: string; label: string; value: string; sub: string
}) {
  return (
    <div
      className="rounded-lg p-4 flex items-start gap-3"
      style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
    >
      <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: iconBg }}>
        <Icon size={16} className="text-white" />
      </div>
      <div>
        <p className="text-[11px]" style={{ color: 'var(--color-text2)' }}>{label}</p>
        <p className="text-[20px] font-semibold" style={{ color: 'var(--color-text)' }}>{value}</p>
        <p className="text-[10px]" style={{ color: 'var(--color-text3)' }}>{sub}</p>
      </div>
    </div>
  )
}
