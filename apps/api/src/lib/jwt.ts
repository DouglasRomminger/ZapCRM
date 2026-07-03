import jwt from 'jsonwebtoken'

// Lido na hora do uso (não no load) — permite testes e falha com mensagem clara
function secret(): string {
  const s = process.env.JWT_SECRET
  if (!s) throw new Error('JWT_SECRET não configurado')
  return s
}

export interface JwtPayload {
  empresaId: string
  usuarioId: string
  role: 'OPERADOR' | 'SUPERVISOR' | 'ADMIN'
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, secret(), { expiresIn: '12h' })
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, secret()) as JwtPayload
}
