// Sessão do usuário no navegador (token JWT + dados básicos) e fetch autenticado.

// Em dev, o .env define NEXT_PUBLIC_API_URL=http://localhost:3001; sem env, usa produção.
export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://zapcrm-zapcrm-api.jhtjgq.easypanel.host'

export interface UsuarioLogado {
  id: string
  nome: string
  email: string
  role: 'OPERADOR' | 'SUPERVISOR' | 'ADMIN'
  empresaId: string
  empresa: { id: string; nome: string }
}

const TOKEN_KEY   = 'zapcrm_token'
const USUARIO_KEY = 'zapcrm_usuario'

export function salvarSessao(token: string, usuario: UsuarioLogado) {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(USUARIO_KEY, JSON.stringify(usuario))
}

export function obterToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(TOKEN_KEY)
}

export function obterUsuario(): UsuarioLogado | null {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem(USUARIO_KEY)
  try { return raw ? (JSON.parse(raw) as UsuarioLogado) : null } catch { return null }
}

export function limparSessao() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USUARIO_KEY)
}

// fetch com Authorization: Bearer. Em 401, derruba a sessão e manda pro /login.
export async function apiFetch(path: string, options?: RequestInit) {
  const token = obterToken()
  const temBody = options?.body !== undefined
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    // Fastify recusa POST application/json sem body — envia {} nesses casos
    body: options?.method === 'POST' && !temBody ? '{}' : options?.body,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options?.headers ?? {}),
    },
  })
  if (res.status === 401 && typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
    limparSessao()
    window.location.href = '/login'
  }
  return res
}
