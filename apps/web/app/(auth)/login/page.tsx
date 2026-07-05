'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Zap, Loader2 } from 'lucide-react'
import { API_URL, salvarSessao, obterToken } from '@/lib/auth'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail]           = useState('')
  const [senha, setSenha]           = useState('')
  const [erro, setErro]             = useState<string | null>(null)
  const [carregando, setCarregando] = useState(false)

  // Já logado? Vai direto pro app
  useEffect(() => {
    if (obterToken()) router.replace('/dashboard')
  }, [router])

  async function entrar(e: React.FormEvent) {
    e.preventDefault()
    setErro(null)
    setCarregando(true)
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha }),
      })
      const data = await res.json()
      if (!res.ok) {
        setErro(data?.error ?? 'Não foi possível entrar')
        return
      }
      salvarSessao(data.token, data.usuario)
      router.replace('/dashboard')
    } catch {
      setErro('Falha de conexão com o servidor')
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: 'var(--color-bg)' }}>
      <div className="w-full max-w-[380px]">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'var(--color-accent)' }}>
            <Zap size={22} className="text-white" />
          </div>
          <span className="text-[22px] font-semibold" style={{ color: 'var(--color-text)' }}>ZapCRM</span>
        </div>

        <form
          onSubmit={entrar}
          className="rounded-lg p-6 shadow-sm border"
          style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
        >
          <h1 className="text-[17px] font-semibold mb-1" style={{ color: 'var(--color-text)' }}>Entrar</h1>
          <p className="text-[13px] mb-5" style={{ color: 'var(--color-text2)' }}>Acesse sua conta para continuar</p>

          <label className="block text-[13px] font-medium mb-1.5" style={{ color: 'var(--color-text)' }}>E-mail</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoComplete="email"
            placeholder="voce@empresa.com.br"
            className="w-full rounded-md border px-3 py-2 text-[14px] mb-4 outline-none focus:ring-2"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
          />

          <label className="block text-[13px] font-medium mb-1.5" style={{ color: 'var(--color-text)' }}>Senha</label>
          <input
            type="password"
            value={senha}
            onChange={e => setSenha(e.target.value)}
            required
            autoComplete="current-password"
            placeholder="••••••••"
            className="w-full rounded-md border px-3 py-2 text-[14px] mb-5 outline-none focus:ring-2"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
          />

          {erro && (
            <div className="rounded-md px-3 py-2 text-[13px] mb-4" style={{ backgroundColor: 'var(--color-red-bg)', color: 'var(--color-red)' }}>
              {erro}
            </div>
          )}

          <button
            type="submit"
            disabled={carregando}
            className="w-full rounded-md py-2.5 text-[14px] font-medium text-white flex items-center justify-center gap-2 disabled:opacity-60 transition-colors"
            style={{ backgroundColor: 'var(--color-accent)' }}
          >
            {carregando && <Loader2 size={16} className="animate-spin" />}
            {carregando ? 'Entrando…' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
