import jwt from 'jsonwebtoken'

const SECRET = process.env.JWT_SECRET!

export interface JwtPayload {
  empresaId: string
  usuarioId: string
  role: 'OPERADOR' | 'SUPERVISOR' | 'ADMIN'
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, SECRET, { expiresIn: '12h' })
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, SECRET) as JwtPayload
}
