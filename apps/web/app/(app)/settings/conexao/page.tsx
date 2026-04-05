'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { AppLayout } from '@/components/layout/AppLayout'
import { io, Socket } from 'socket.io-client'
import {
  Wifi, WifiOff, RefreshCw, Smartphone, AlertCircle,
  MessageSquare, Clock, CheckCircle2, XCircle, Loader2,
} from 'lucide-react'

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({ mensagem, tipo }: { mensagem: string; tipo: 'success' | 'error' }) {
  return (
    <div
      className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-xl text-white text-[13px] font-medium animate-slide-in"
      style={{ backgroundColor: tipo === 'success' ? 'var(--color-green)' : 'var(--color-red)' }}
    >
      {tipo === 'success' ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
      {mensagem}
    </div>
  )
}

// ─── Config ───────────────────────────────────────────────────────────────────

const API_URL    = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'
// TODO: substituir pelo empresaId real vindo do contexto de auth
const EMPRESA_ID = process.env.NEXT_PUBLIC_DEV_EMPRESA_ID ?? 'empresa-dev-001'

// ─── Tipos ────────────────────────────────────────────────────────────────────

type StatusConexao = 'sem_instancia' | 'connecting' | 'open' | 'close' | 'carregando'

interface StatusData {
  status: StatusConexao
  numero?: string | null
  conectadoEm?: string | null
  instanciaId?: string | null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatarDataHora(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function calcularUptime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const horas = Math.floor(diff / 3600000)
  const minutos = Math.floor((diff % 3600000) / 60000)
  return { horas, minutos }
}

async function apiFetch(path: string, options?: RequestInit) {
  const temBody = options?.body !== undefined
  return fetch(`${API_URL}${path}`, {
    ...options,
    body: options?.method === 'POST' && !temBody ? '{}' : options?.body,
    headers: {
      'Content-Type': 'application/json',
      'x-empresa-id': EMPRESA_ID,
      ...(options?.headers ?? {}),
    },
  })
}

// ─── Hook: status + Socket.io ─────────────────────────────────────────────────

function useConexao() {
  const [status, setStatus]         = useState<StatusData>({ status: 'carregando' })
  const [qrcode, setQrcode]         = useState<string | null>(null)
  const [carregando, setCarregando] = useState(false)
  const [toast, setToast]           = useState<{ mensagem: string; tipo: 'success' | 'error' } | null>(null)
  const socketRef = useRef<Socket | null>(null)

  const mostrarToast = useCallback((mensagem: string, tipo: 'success' | 'error') => {
    setToast({ mensagem, tipo })
    setTimeout(() => setToast(null), 4000)
  }, [])

  const buscarStatus = useCallback(async () => {
    try {
      const res  = await apiFetch('/api/evolution/status')
      const data = await res.json() as StatusData
      setStatus(data)
    } catch {
      setStatus({ status: 'sem_instancia' })
    }
  }, [])

  // Socket.io — ouve eventos em tempo real
  useEffect(() => {
    const socket = io(API_URL, {
      auth: { empresaId: EMPRESA_ID },
      reconnectionDelay: 2000,
    })
    socketRef.current = socket

    socket.on('qrcode_atualizado', (data: { qrcode: string }) => {
      setQrcode(data.qrcode)
      setStatus(prev => ({ ...prev, status: 'connecting' }))
    })

    socket.on('conexao_atualizada', (data: { status: StatusConexao; numero?: string; conectadoEm?: string }) => {
      setStatus({ status: data.status, numero: data.numero, conectadoEm: data.conectadoEm })
      if (data.status === 'open') {
        setQrcode(null)
        mostrarToast('WhatsApp conectado com sucesso!', 'success')
      }
    })

    return () => { socket.disconnect() }
  }, [mostrarToast])

  // Busca status inicial ao montar
  useEffect(() => { buscarStatus() }, [buscarStatus])

  // Polling de status enquanto conectando (fallback para quando Socket.io não alcança)
  useEffect(() => {
    if (status.status !== 'connecting') return
    const poll = setInterval(async () => {
      try {
        const res  = await apiFetch('/api/evolution/status')
        const data = await res.json() as StatusData
        if (data.status === 'open') {
          setStatus(data)
          setQrcode(null)
          mostrarToast('WhatsApp conectado com sucesso!', 'success')
          clearInterval(poll)
        }
      } catch { /* ignora */ }
    }, 3000)
    return () => clearInterval(poll)
  }, [status.status, mostrarToast])

  // Polling do QR code quando está conectando mas sem QR (webhook não alcança localhost em dev)
  useEffect(() => {
    if (status.status !== 'connecting' || qrcode) return

    const poll = setInterval(async () => {
      try {
        const res  = await apiFetch('/api/evolution/qrcode')
        if (!res.ok) return
        const data = await res.json() as { qrcode: string | null }
        if (data.qrcode) {
          setQrcode(data.qrcode)
          clearInterval(poll)
        }
      } catch { /* ignora e tenta de novo */ }
    }, 3000)

    return () => clearInterval(poll)
  }, [status.status, qrcode])

  const iniciarConexao = useCallback(async () => {
    setCarregando(true)
    setQrcode(null)
    try {
      const res  = await apiFetch('/api/evolution/connect', { method: 'POST' })
      const data = await res.json() as { instanciaId: string; qrcode: string | null }
      if (data.qrcode) setQrcode(data.qrcode)
      setStatus(prev => ({ ...prev, status: 'connecting', instanciaId: data.instanciaId }))
    } finally {
      setCarregando(false)
    }
  }, [])

  const renovarQr = useCallback(async () => {
    try {
      const res  = await apiFetch('/api/evolution/qrcode')
      const data = await res.json() as { qrcode: string | null }
      if (data.qrcode) setQrcode(data.qrcode)
    } catch { /* novo QR chegará via webhook */ }
  }, [])

  const desconectar = useCallback(async () => {
    setCarregando(true)
    try {
      await apiFetch('/api/evolution/disconnect', { method: 'POST' })
      setStatus({ status: 'sem_instancia' })
      setQrcode(null)
    } finally {
      setCarregando(false)
    }
  }, [])

  return { status, qrcode, carregando, toast, iniciarConexao, renovarQr, desconectar }
}

// ─── Estado: aguardando / conectando ─────────────────────────────────────────

function EstadoDesconectado({
  qrcode,
  carregando,
  onIniciar,
  onRenovar,
}: {
  qrcode: string | null
  carregando: boolean
  onIniciar: () => void
  onRenovar: () => void
}) {
  const [segundos, setSegundos] = useState(30)

  // Reinicia contador sempre que chega novo QR
  useEffect(() => {
    if (!qrcode) return
    setSegundos(30)
    const timer = setInterval(() => {
      setSegundos(s => (s <= 1 ? 30 : s - 1))
    }, 1000)
    return () => clearInterval(timer)
  }, [qrcode])

  const urgente  = segundos <= 10
  const progresso = (segundos / 30) * 100

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-4xl">
      {/* Card QR Code */}
      <div
        className="rounded-lg p-6 flex flex-col items-center gap-5"
        style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
      >
        <div className="text-center">
          <p className="text-[14px] font-semibold" style={{ color: 'var(--color-text)' }}>
            Escaneie o QR Code
          </p>
          <p className="text-[12px] mt-1" style={{ color: 'var(--color-text3)' }}>
            Use o WhatsApp do número que deseja conectar
          </p>
        </div>

        {/* QR code ou estado de carregamento */}
        <div
          className="p-4 rounded-xl relative flex items-center justify-center"
          style={{
            border: `2px solid ${urgente ? 'var(--color-amber)' : 'var(--color-purple-border)'}`,
            minWidth: 208, minHeight: 208,
          }}
        >
          {carregando || !qrcode ? (
            <div className="flex flex-col items-center gap-3 text-center">
              <Loader2 size={32} className="animate-spin" style={{ color: 'var(--color-accent)' }} />
              <p className="text-[12px]" style={{ color: 'var(--color-text3)' }}>
                {carregando ? 'Gerando QR Code…' : 'Aguardando QR Code…'}
              </p>
            </div>
          ) : (
            <img
              src={qrcode}
              alt="QR Code WhatsApp"
              width={192}
              height={192}
              style={{ display: 'block' }}
            />
          )}
        </div>

        {/* Contador — só mostra se tem QR */}
        {qrcode && (
          <div className="w-full space-y-2">
            <div
              className="flex items-center justify-between text-[11px]"
              style={{ color: urgente ? 'var(--color-amber)' : 'var(--color-text3)' }}
            >
              <span className="flex items-center gap-1">
                <Clock size={11} /> QR atualiza em
              </span>
              <span className="font-semibold tabular-nums">{String(segundos).padStart(2, '0')}s</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-bg)' }}>
              <div
                className="h-1.5 rounded-full transition-all duration-1000"
                style={{
                  width: `${progresso}%`,
                  backgroundColor: urgente ? 'var(--color-amber)' : 'var(--color-accent)',
                }}
              />
            </div>
          </div>
        )}

        <div className="flex gap-2 w-full">
          {!qrcode && !carregando && (
            <button
              onClick={onIniciar}
              className="flex-1 flex items-center justify-center gap-1.5 text-[12px] font-medium py-2 rounded-md text-white transition-opacity hover:opacity-80"
              style={{ backgroundColor: 'var(--color-accent)' }}
            >
              Gerar QR Code
            </button>
          )}
          {qrcode && (
            <button
              onClick={onRenovar}
              className="flex-1 flex items-center justify-center gap-1.5 text-[12px] font-medium py-2 rounded-md transition-colors hover:opacity-80"
              style={{ border: '1px solid var(--color-border)', color: 'var(--color-text2)' }}
            >
              <RefreshCw size={12} /> Novo QR
            </button>
          )}
        </div>
      </div>

      {/* Card Instruções */}
      <div className="flex flex-col gap-4">
        <div
          className="flex items-start gap-3 px-4 py-3 rounded-lg"
          style={{ backgroundColor: 'var(--color-amber-bg)', border: '1px solid var(--color-amber)' }}
        >
          <AlertCircle size={15} className="shrink-0 mt-0.5" style={{ color: 'var(--color-amber)' }} />
          <p className="text-[12px]" style={{ color: 'var(--color-text)' }}>
            O QR Code expira a cada <strong>30 segundos</strong>. Um novo será enviado automaticamente via WebSocket.
          </p>
        </div>

        <div
          className="rounded-lg p-5 flex flex-col gap-4"
          style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
        >
          <p className="text-[13px] font-semibold" style={{ color: 'var(--color-text)' }}>Como conectar</p>
          {[
            { passo: 1, titulo: 'Abra o WhatsApp',           descricao: 'No celular com o número que deseja usar' },
            { passo: 2, titulo: 'Dispositivos conectados',    descricao: 'Toque nos 3 pontos (Android) ou "Configurações" (iPhone) → Dispositivos conectados' },
            { passo: 3, titulo: 'Escaneie o QR Code',         descricao: 'Aponte a câmera para o código ao lado e aguarde a conexão' },
          ].map(({ passo, titulo, descricao }) => (
            <div key={passo} className="flex items-start gap-3">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0 mt-0.5"
                style={{ backgroundColor: 'var(--color-accent)' }}
              >
                {passo}
              </div>
              <div>
                <p className="text-[13px] font-medium" style={{ color: 'var(--color-text)' }}>{titulo}</p>
                <p className="text-[11px] mt-0.5" style={{ color: 'var(--color-text3)' }}>{descricao}</p>
              </div>
            </div>
          ))}
        </div>

        <div
          className="rounded-lg px-4 py-3"
          style={{ backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)' }}
        >
          <p className="text-[11px]" style={{ color: 'var(--color-text3)' }}>
            Após escanear, a página atualizará automaticamente. A conexão é mantida enquanto o WhatsApp estiver com internet.
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── Estado conectado ─────────────────────────────────────────────────────────

function EstadoConectado({
  numero,
  conectadoEm,
  instanciaId,
  carregando,
  onDesconectar,
}: {
  numero: string | null | undefined
  conectadoEm: string | null | undefined
  instanciaId: string | null | undefined
  carregando: boolean
  onDesconectar: () => void
}) {
  const uptime = conectadoEm ? calcularUptime(conectadoEm) : null

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-4xl">
      {/* Card principal */}
      <div
        className="rounded-lg p-6 flex flex-col gap-5"
        style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
      >
        <div className="flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center"
            style={{ backgroundColor: 'var(--color-green-bg)' }}
          >
            <Smartphone size={24} style={{ color: 'var(--color-green)' }} />
          </div>
          <div>
            <p className="text-[15px] font-semibold" style={{ color: 'var(--color-text)' }}>
              {numero ? `+${numero}` : 'Conectado'}
            </p>
            {instanciaId && (
              <p className="text-[12px] mt-0.5" style={{ color: 'var(--color-text3)' }}>
                Instância:{' '}
                <code
                  className="text-[11px] px-1 py-0.5 rounded"
                  style={{ backgroundColor: 'var(--color-bg)' }}
                >
                  {instanciaId}
                </code>
              </p>
            )}
          </div>
        </div>

        <div className="h-px" style={{ backgroundColor: 'var(--color-border)' }} />

        <div className="space-y-3 text-[13px]">
          {conectadoEm && (
            <div className="flex justify-between">
              <span style={{ color: 'var(--color-text2)' }}>Conectado em</span>
              <span className="font-medium" style={{ color: 'var(--color-text)' }}>
                {formatarDataHora(conectadoEm)}
              </span>
            </div>
          )}
          {uptime && (
            <div className="flex justify-between">
              <span style={{ color: 'var(--color-text2)' }}>Uptime</span>
              <span className="font-medium" style={{ color: 'var(--color-green)' }}>
                {uptime.horas}h {uptime.minutos}min
              </span>
            </div>
          )}
          <div className="flex justify-between">
            <span style={{ color: 'var(--color-text2)' }}>Status da sessão</span>
            <span className="font-medium" style={{ color: 'var(--color-green)' }}>Estável</span>
          </div>
        </div>

        <button
          onClick={onDesconectar}
          disabled={carregando}
          className="flex items-center justify-center gap-2 py-2.5 rounded-md text-[13px] font-medium text-white transition-opacity hover:opacity-80 mt-auto disabled:opacity-50"
          style={{ backgroundColor: 'var(--color-red)' }}
        >
          {carregando ? <Loader2 size={15} className="animate-spin" /> : <XCircle size={15} />}
          Desconectar WhatsApp
        </button>
      </div>

      {/* Cards de estatísticas */}
      <div className="flex flex-col gap-4">
        <p className="text-[13px] font-semibold" style={{ color: 'var(--color-text)' }}>
          Informações da conexão
        </p>

        <div className="grid grid-cols-1 gap-3">
          {uptime && (
            <StatCard
              icon={Clock}
              iconBg="var(--color-green)"
              label="Uptime da conexão"
              value={`${uptime.horas}h ${uptime.minutos}min`}
              sub="desde a última conexão"
            />
          )}
          <StatCard
            icon={CheckCircle2}
            iconBg="var(--color-blue)"
            label="Qualidade da conexão"
            value="Ótima"
            sub="sem interrupções"
          />
          <StatCard
            icon={MessageSquare}
            iconBg="var(--color-accent)"
            label="Pronto para receber"
            value="Ativo"
            sub="webhook configurado"
          />
        </div>

        <div
          className="flex items-start gap-3 px-4 py-3 rounded-lg"
          style={{ backgroundColor: 'var(--color-green-bg)', border: '1px solid var(--color-green)' }}
        >
          <Wifi size={14} className="shrink-0 mt-0.5" style={{ color: 'var(--color-green)' }} />
          <p className="text-[12px]" style={{ color: 'var(--color-text)' }}>
            Mantenha o celular conectado à internet e com o WhatsApp aberto em segundo plano para garantir estabilidade.
          </p>
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, iconBg, label, value, sub }: {
  icon: React.ElementType
  iconBg: string
  label: string
  value: string
  sub: string
}) {
  return (
    <div
      className="flex items-center gap-4 px-4 py-3.5 rounded-lg"
      style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
    >
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
        style={{ backgroundColor: iconBg }}
      >
        <Icon size={16} className="text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px]" style={{ color: 'var(--color-text3)' }}>{label}</p>
        <p className="text-[15px] font-semibold" style={{ color: 'var(--color-text)' }}>{value}</p>
        <p className="text-[10px]" style={{ color: 'var(--color-text3)' }}>{sub}</p>
      </div>
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function ConexaoPage() {
  const { status, qrcode, carregando, toast, iniciarConexao, renovarQr, desconectar } = useConexao()

  const conectado = status.status === 'open'
  const conectando = status.status === 'connecting'

  return (
    <AppLayout title="Conexão WhatsApp" subtitle="Gerencie a instância Evolution API da sua empresa">
      {toast && <Toast mensagem={toast.mensagem} tipo={toast.tipo} />}
      <div className="p-6 space-y-6">
        {/* Cabeçalho com status */}
        <div className="flex items-center gap-3">
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-full text-[12px] font-semibold"
            style={{
              backgroundColor: conectado  ? 'var(--color-green-bg)'
                             : conectando ? 'var(--color-amber-bg)'
                             : 'var(--color-red-bg)',
              color: conectado  ? 'var(--color-green)'
                   : conectando ? 'var(--color-amber)'
                   : 'var(--color-red)',
            }}
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{
                backgroundColor: conectado  ? 'var(--color-green)'
                               : conectando ? 'var(--color-amber)'
                               : 'var(--color-red)',
                animation: (conectado || conectando) ? 'status-pulse 2s ease-in-out infinite' : undefined,
              }}
            />
            {conectado ? 'Conectado' : conectando ? 'Conectando…' : 'Desconectado'}
          </div>

          {conectado  ? <Wifi size={16} style={{ color: 'var(--color-green)' }} /> : null}
          {!conectado && !conectando ? <WifiOff size={16} style={{ color: 'var(--color-red)' }} /> : null}
        </div>

        {/* Conteúdo principal */}
        {conectado ? (
          <EstadoConectado
            numero={status.numero}
            conectadoEm={status.conectadoEm}
            instanciaId={status.instanciaId}
            carregando={carregando}
            onDesconectar={desconectar}
          />
        ) : (
          <EstadoDesconectado
            qrcode={qrcode}
            carregando={carregando}
            onIniciar={iniciarConexao}
            onRenovar={renovarQr}
          />
        )}
      </div>
    </AppLayout>
  )
}
