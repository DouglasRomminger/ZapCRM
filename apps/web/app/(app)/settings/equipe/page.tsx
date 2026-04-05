'use client'

import { useState } from 'react'
import { AppLayout } from '@/components/layout/AppLayout'
import { mockOperadores } from '@/src/mocks/usuarios'
import { mockAvaliacoes } from '@/src/mocks/avaliacoes'
import { mockChats } from '@/src/mocks/chats'
import type { Usuario, RoleUsuario, StatusOperador } from '@/src/types'
import { Plus, X, UserPlus, Mail, Shield, MessageSquare, Star } from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function iniciais(nome: string) {
  return nome.split(' ').map(n => n[0]).slice(0, 2).join('')
}

function statusConfig(s: StatusOperador) {
  return {
    ONLINE:  { label: 'Online',  color: 'var(--color-green)', bg: 'var(--color-green-bg)' },
    AUSENTE: { label: 'Ausente', color: 'var(--color-amber)', bg: 'var(--color-amber-bg)' },
    OFFLINE: { label: 'Offline', color: 'var(--color-text3)', bg: 'var(--color-bg)' },
  }[s]
}

function roleLabel(r: RoleUsuario) {
  return { ADMIN: 'Admin', SUPERVISOR: 'Supervisor', OPERADOR: 'Operador' }[r]
}

function roleColor(r: RoleUsuario) {
  return {
    ADMIN:      { bg: 'var(--color-purple-light)', color: 'var(--color-accent)' },
    SUPERVISOR: { bg: 'var(--color-blue-bg)',      color: 'var(--color-blue)' },
    OPERADOR:   { bg: 'var(--color-bg)',            color: 'var(--color-text2)' },
  }[r]
}

// ─── Card do operador ─────────────────────────────────────────────────────────

function OperadorCard({ op, onEditar }: { op: Usuario; onEditar: (op: Usuario) => void }) {
  const st = statusConfig(op.status)
  const rc = roleColor(op.role)
  const chatsAbertos = mockChats.filter(c => c.operador?.id === op.id && c.status !== 'ENCERRADO').length
  const notas = mockAvaliacoes.filter(a => a.operador.id === op.id)
  const notaMedia = notas.length
    ? (notas.reduce((s, a) => s + a.nota, 0) / notas.length).toFixed(1)
    : '—'

  return (
    <div
      className="rounded-lg p-5 flex items-center gap-4 transition-shadow hover:shadow-sm cursor-pointer"
      style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
      onClick={() => onEditar(op)}
    >
      {/* Avatar + status */}
      <div className="relative shrink-0">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center text-white text-[14px] font-semibold"
          style={{ backgroundColor: 'var(--color-accent)' }}
        >
          {iniciais(op.nome)}
        </div>
        <span
          className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white"
          style={{ backgroundColor: st.color }}
        />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="text-[14px] font-semibold truncate" style={{ color: 'var(--color-text)' }}>{op.nome}</p>
          <span
            className="text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0"
            style={{ backgroundColor: rc.bg, color: rc.color }}
          >
            {roleLabel(op.role)}
          </span>
        </div>
        <p className="text-[12px] truncate" style={{ color: 'var(--color-text3)' }}>{op.email}</p>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-5 shrink-0">
        <div className="text-center">
          <div className="flex items-center gap-1 justify-center mb-0.5" style={{ color: 'var(--color-accent)' }}>
            <MessageSquare size={12} />
            <span className="text-[14px] font-semibold" style={{ color: 'var(--color-text)' }}>{chatsAbertos}</span>
          </div>
          <p className="text-[10px]" style={{ color: 'var(--color-text3)' }}>chats abertos</p>
        </div>
        <div className="text-center">
          <div className="flex items-center gap-1 justify-center mb-0.5" style={{ color: 'var(--color-amber)' }}>
            <Star size={12} />
            <span className="text-[14px] font-semibold" style={{ color: 'var(--color-text)' }}>{notaMedia}</span>
          </div>
          <p className="text-[10px]" style={{ color: 'var(--color-text3)' }}>nota média</p>
        </div>
        <span
          className="text-[11px] font-medium px-2.5 py-1 rounded-full"
          style={{ backgroundColor: st.bg, color: st.color }}
        >
          {st.label}
        </span>
      </div>
    </div>
  )
}

// ─── Modal de operador ────────────────────────────────────────────────────────

function ModalOperador({
  operador, onClose,
}: {
  operador: Usuario | null
  onClose: () => void
}) {
  const [nome, setNome] = useState(operador?.nome ?? '')
  const [email, setEmail] = useState(operador?.email ?? '')
  const [role, setRole] = useState<RoleUsuario>(operador?.role ?? 'OPERADOR')
  const [limiteChats, setLimiteChats] = useState(10)

  const roles: RoleUsuario[] = ['OPERADOR', 'SUPERVISOR', 'ADMIN']

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div
        className="w-full max-w-md rounded-xl shadow-2xl"
        style={{ backgroundColor: 'var(--color-surface)' }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
          <p className="text-[15px] font-semibold" style={{ color: 'var(--color-text)' }}>
            {operador ? 'Editar operador' : 'Novo operador'}
          </p>
          <button onClick={onClose} style={{ color: 'var(--color-text3)' }}><X size={18} /></button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <FormField label="Nome completo" icon={UserPlus}>
            <input
              type="text"
              value={nome}
              onChange={e => setNome(e.target.value)}
              placeholder="Ex: João Silva"
              className="w-full text-[13px] px-3 py-2.5 rounded-lg outline-none"
              style={{ border: '1.5px solid var(--color-purple-border)', backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}
            />
          </FormField>

          <FormField label="E-mail" icon={Mail}>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="joao@empresa.com"
              className="w-full text-[13px] px-3 py-2.5 rounded-lg outline-none"
              style={{ border: '1.5px solid var(--color-purple-border)', backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}
            />
          </FormField>

          <FormField label="Perfil de acesso" icon={Shield}>
            <div className="flex gap-2">
              {roles.map(r => {
                const rc = roleColor(r)
                return (
                  <button
                    key={r}
                    onClick={() => setRole(r)}
                    className="flex-1 py-2 rounded-lg text-[12px] font-medium transition-all"
                    style={{
                      border: `2px solid ${role === r ? rc.color : 'var(--color-border)'}`,
                      backgroundColor: role === r ? rc.bg : 'transparent',
                      color: role === r ? rc.color : 'var(--color-text2)',
                    }}
                  >
                    {roleLabel(r)}
                  </button>
                )
              })}
            </div>
          </FormField>

          <FormField label={`Limite de chats simultâneos: ${limiteChats}`} icon={MessageSquare}>
            <input
              type="range"
              min={1}
              max={30}
              value={limiteChats}
              onChange={e => setLimiteChats(Number(e.target.value))}
              className="w-full accent-[var(--color-accent)]"
            />
            <div className="flex justify-between text-[10px] mt-0.5" style={{ color: 'var(--color-text3)' }}>
              <span>1</span><span>15</span><span>30</span>
            </div>
          </FormField>
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
            {operador ? 'Salvar alterações' : 'Criar operador'}
          </button>
        </div>
      </div>
    </div>
  )
}

function FormField({ label, icon: Icon, children }: { label: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-[12px] font-medium mb-1.5" style={{ color: 'var(--color-text2)' }}>
        <Icon size={12} />
        {label}
      </label>
      {children}
    </div>
  )
}

// ─── Página ───────────────────────────────────────────────────────────────────

export default function EquipePage() {
  const [modalAberto, setModalAberto] = useState(false)
  const [operadorEditando, setOperadorEditando] = useState<Usuario | null>(null)

  const online  = mockOperadores.filter(o => o.status === 'ONLINE').length
  const ausente = mockOperadores.filter(o => o.status === 'AUSENTE').length
  const offline = mockOperadores.filter(o => o.status === 'OFFLINE').length

  function abrirEditar(op: Usuario) {
    setOperadorEditando(op)
    setModalAberto(true)
  }

  function fecharModal() {
    setModalAberto(false)
    setOperadorEditando(null)
  }

  return (
    <AppLayout title="Equipe" subtitle="Gerenciamento de operadores e perfis de acesso">
      <div className="p-6 space-y-5">
        {/* Stats rápidas */}
        <div className="flex items-center gap-4">
          <StatPill label="Online" count={online} color="var(--color-green)" bg="var(--color-green-bg)" />
          <StatPill label="Ausente" count={ausente} color="var(--color-amber)" bg="var(--color-amber-bg)" />
          <StatPill label="Offline" count={offline} color="var(--color-text3)" bg="var(--color-bg)" />
          <div className="flex-1" />
          <button
            onClick={() => setModalAberto(true)}
            className="flex items-center gap-1.5 text-[13px] font-medium px-4 py-2 rounded-lg text-white"
            style={{ backgroundColor: 'var(--color-accent)' }}
          >
            <Plus size={14} /> Adicionar operador
          </button>
        </div>

        {/* Lista */}
        <div className="space-y-3">
          {mockOperadores.map(op => (
            <OperadorCard key={op.id} op={op} onEditar={abrirEditar} />
          ))}
        </div>
      </div>

      {modalAberto && (
        <ModalOperador operador={operadorEditando} onClose={fecharModal} />
      )}
    </AppLayout>
  )
}

function StatPill({ label, count, color, bg }: { label: string; count: number; color: string; bg: string }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ backgroundColor: bg, border: `1px solid ${color}30` }}>
      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
      <span className="text-[12px] font-medium" style={{ color: 'var(--color-text)' }}>{count}</span>
      <span className="text-[12px]" style={{ color: 'var(--color-text3)' }}>{label}</span>
    </div>
  )
}
