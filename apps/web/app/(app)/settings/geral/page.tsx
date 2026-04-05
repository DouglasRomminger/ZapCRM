'use client'

import { useState } from 'react'
import { AppLayout } from '@/components/layout/AppLayout'
import { Building2, Clock, MessageSquare, Star, Save, Upload } from 'lucide-react'

// ─── Tipos locais ─────────────────────────────────────────────────────────────

const DIAS_SEMANA = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'] as const
type DiaSemana = typeof DIAS_SEMANA[number]

interface HorarioDia {
  ativo: boolean
  inicio: string
  fim: string
}

// ─── Dados iniciais ───────────────────────────────────────────────────────────

const horarioInicial: Record<DiaSemana, HorarioDia> = {
  Segunda:  { ativo: true,  inicio: '08:00', fim: '18:00' },
  Terça:    { ativo: true,  inicio: '08:00', fim: '18:00' },
  Quarta:   { ativo: true,  inicio: '08:00', fim: '18:00' },
  Quinta:   { ativo: true,  inicio: '08:00', fim: '18:00' },
  Sexta:    { ativo: true,  inicio: '08:00', fim: '18:00' },
  Sábado:   { ativo: true,  inicio: '09:00', fim: '13:00' },
  Domingo:  { ativo: false, inicio: '09:00', fim: '13:00' },
}

// ─── Seção de formulário ──────────────────────────────────────────────────────

function Secao({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div
      className="rounded-lg p-6"
      style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
    >
      <div className="flex items-center gap-2.5 mb-5 pb-4" style={{ borderBottom: '1px solid var(--color-border)' }}>
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: 'var(--color-purple-light)' }}
        >
          <Icon size={15} style={{ color: 'var(--color-accent)' }} />
        </div>
        <p className="text-[14px] font-semibold" style={{ color: 'var(--color-text)' }}>{title}</p>
      </div>
      {children}
    </div>
  )
}

function Campo({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[12px] font-medium mb-1.5" style={{ color: 'var(--color-text2)' }}>{label}</label>
      {children}
      {hint && <p className="text-[11px] mt-1" style={{ color: 'var(--color-text3)' }}>{hint}</p>}
    </div>
  )
}

const inputStyle = {
  border: '1px solid var(--color-border)',
  backgroundColor: 'var(--color-bg)',
  color: 'var(--color-text)',
}

// ─── Toggle switch ────────────────────────────────────────────────────────────

function Toggle({ active, onChange }: { active: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!active)}
      className="relative w-10 h-5 rounded-full transition-colors shrink-0"
      style={{ backgroundColor: active ? 'var(--color-accent)' : 'var(--color-border)' }}
    >
      <span
        className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all"
        style={{ left: active ? '22px' : '2px' }}
      />
    </button>
  )
}

// ─── Página ───────────────────────────────────────────────────────────────────

export default function GeralPage() {
  const [nomeEmpresa, setNomeEmpresa] = useState('Minha Empresa')
  const [horarios, setHorarios] = useState<Record<DiaSemana, HorarioDia>>(horarioInicial)
  const [msgForaHorario, setMsgForaHorario] = useState(
    'Olá! No momento estamos fora do horário de atendimento. Retornaremos em breve. Horário: Seg–Sex 08h–18h e Sáb 09h–13h.'
  )
  const [perguntaNps, setPerguntaNps] = useState(
    'De 1 a 5, como você avalia o nosso atendimento de hoje?'
  )
  const [salvo, setSalvo] = useState(false)

  function atualizarHorario(dia: DiaSemana, campo: keyof HorarioDia, valor: string | boolean) {
    setHorarios(h => ({ ...h, [dia]: { ...h[dia], [campo]: valor } }))
  }

  function salvar() {
    setSalvo(true)
    setTimeout(() => setSalvo(false), 2000)
  }

  return (
    <AppLayout title="Configurações Gerais" subtitle="Empresa, horários e mensagens automáticas">
      <div className="p-6 space-y-6 max-w-3xl">

        {/* Empresa */}
        <Secao title="Informações da empresa" icon={Building2}>
          <div className="space-y-4">
            <Campo label="Nome da empresa">
              <input
                type="text"
                value={nomeEmpresa}
                onChange={e => setNomeEmpresa(e.target.value)}
                className="w-full text-[13px] px-3 py-2.5 rounded-lg outline-none"
                style={inputStyle}
              />
            </Campo>

            <Campo label="Logo da empresa" hint="PNG ou JPG, máximo 2MB. Exibida na sidebar e nos e-mails.">
              <div
                className="flex items-center gap-3 px-4 py-3 rounded-lg border-2 border-dashed cursor-pointer hover:opacity-80 transition-opacity"
                style={{ borderColor: 'var(--color-purple-border)', backgroundColor: 'var(--color-bg)' }}
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: 'var(--color-purple-light)' }}
                >
                  <Upload size={16} style={{ color: 'var(--color-accent)' }} />
                </div>
                <div>
                  <p className="text-[13px] font-medium" style={{ color: 'var(--color-text)' }}>Clique para fazer upload</p>
                  <p className="text-[11px]" style={{ color: 'var(--color-text3)' }}>ou arraste o arquivo aqui</p>
                </div>
              </div>
            </Campo>
          </div>
        </Secao>

        {/* Horários */}
        <Secao title="Horário de atendimento" icon={Clock}>
          <div className="space-y-2">
            {DIAS_SEMANA.map(dia => {
              const h = horarios[dia]
              return (
                <div
                  key={dia}
                  className="flex items-center gap-4 py-2.5 px-3 rounded-lg"
                  style={{ backgroundColor: h.ativo ? 'var(--color-bg)' : 'transparent' }}
                >
                  <Toggle active={h.ativo} onChange={v => atualizarHorario(dia, 'ativo', v)} />
                  <span
                    className="w-20 text-[13px] font-medium shrink-0"
                    style={{ color: h.ativo ? 'var(--color-text)' : 'var(--color-text3)' }}
                  >
                    {dia}
                  </span>
                  {h.ativo ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="time"
                        value={h.inicio}
                        onChange={e => atualizarHorario(dia, 'inicio', e.target.value)}
                        className="text-[12px] px-2 py-1.5 rounded-md outline-none"
                        style={inputStyle}
                      />
                      <span className="text-[12px]" style={{ color: 'var(--color-text3)' }}>até</span>
                      <input
                        type="time"
                        value={h.fim}
                        onChange={e => atualizarHorario(dia, 'fim', e.target.value)}
                        className="text-[12px] px-2 py-1.5 rounded-md outline-none"
                        style={inputStyle}
                      />
                    </div>
                  ) : (
                    <span className="text-[12px]" style={{ color: 'var(--color-text3)' }}>Fechado</span>
                  )}
                </div>
              )
            })}
          </div>
        </Secao>

        {/* Mensagem fora do horário */}
        <Secao title="Mensagem fora do horário" icon={MessageSquare}>
          <Campo
            label="Texto automático"
            hint="Enviada automaticamente quando o cliente envia mensagem fora do horário de atendimento."
          >
            <textarea
              rows={4}
              value={msgForaHorario}
              onChange={e => setMsgForaHorario(e.target.value)}
              className="w-full text-[13px] px-3 py-2.5 rounded-lg outline-none resize-none"
              style={inputStyle}
            />
          </Campo>
        </Secao>

        {/* Pesquisa de satisfação */}
        <Secao title="Pesquisa de satisfação" icon={Star}>
          <div className="space-y-4">
            <Campo
              label="Pergunta do NPS"
              hint="Enviada ao cliente 2 minutos após encerrar o atendimento. Máximo 1 pesquisa por cliente a cada 7 dias."
            >
              <textarea
                rows={2}
                value={perguntaNps}
                onChange={e => setPerguntaNps(e.target.value)}
                className="w-full text-[13px] px-3 py-2.5 rounded-lg outline-none resize-none"
                style={inputStyle}
              />
            </Campo>

            <div
              className="flex items-start gap-3 px-4 py-3 rounded-lg"
              style={{ backgroundColor: 'var(--color-blue-bg)', border: '1px solid var(--color-blue)' }}
            >
              <Star size={14} className="shrink-0 mt-0.5" style={{ color: 'var(--color-blue)' }} />
              <p className="text-[12px]" style={{ color: 'var(--color-text)' }}>
                Notas <strong>1 ou 2</strong> geram um alerta automático para o supervisor responsável.
              </p>
            </div>
          </div>
        </Secao>

        {/* Botão salvar */}
        <div className="flex justify-end">
          <button
            onClick={salvar}
            className="flex items-center gap-2 text-[13px] font-medium px-6 py-2.5 rounded-lg text-white transition-all"
            style={{ backgroundColor: salvo ? 'var(--color-green)' : 'var(--color-accent)' }}
          >
            <Save size={14} />
            {salvo ? 'Salvo!' : 'Salvar configurações'}
          </button>
        </div>
      </div>
    </AppLayout>
  )
}
