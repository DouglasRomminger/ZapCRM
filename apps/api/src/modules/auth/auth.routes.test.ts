import { describe, it, expect } from 'vitest'
import bcrypt from 'bcryptjs'
import { autenticar } from './auth.routes'

const SENHA = 'senha-forte-123'
const hash = bcrypt.hashSync(SENHA, 10)

describe('autenticar', () => {
  it('aceita usuário ativo com senha correta', async () => {
    expect(await autenticar({ senhaHash: hash, ativo: true }, SENHA)).toBe(true)
  })

  it('recusa senha errada', async () => {
    expect(await autenticar({ senhaHash: hash, ativo: true }, 'errada')).toBe(false)
  })

  it('recusa usuário inativo mesmo com senha correta', async () => {
    expect(await autenticar({ senhaHash: hash, ativo: false }, SENHA)).toBe(false)
  })

  it('recusa usuário inexistente', async () => {
    expect(await autenticar(null, SENHA)).toBe(false)
  })
})

describe('token JWT', () => {
  it('assina e verifica o payload de login', async () => {
    process.env.JWT_SECRET = 'segredo-de-teste'
    const { signToken, verifyToken } = await import('../../lib/jwt')
    const token = signToken({ empresaId: 'emp1', usuarioId: 'usr1', role: 'ADMIN' })
    const payload = verifyToken(token)
    expect(payload.empresaId).toBe('emp1')
    expect(payload.usuarioId).toBe('usr1')
    expect(payload.role).toBe('ADMIN')
  })
})
