import type { Usuario } from '@/src/types'

export const mockOperadores: Usuario[] = [
  { id: 'u1', empresaId: 'e1', nome: 'Ana Costa',    email: 'ana@empresa.com',    role: 'OPERADOR',    status: 'ONLINE',   avatar: undefined },
  { id: 'u2', empresaId: 'e1', nome: 'Bruno Lima',   email: 'bruno@empresa.com',  role: 'OPERADOR',    status: 'ONLINE',   avatar: undefined },
  { id: 'u3', empresaId: 'e1', nome: 'Carla Mendes', email: 'carla@empresa.com',  role: 'SUPERVISOR',  status: 'AUSENTE',  avatar: undefined },
  { id: 'u4', empresaId: 'e1', nome: 'Diego Sousa',  email: 'diego@empresa.com',  role: 'OPERADOR',    status: 'OFFLINE',  avatar: undefined },
]

export const mockUsuarioLogado: Usuario = {
  id: 'u1',
  empresaId: 'e1',
  nome: 'Ana Costa',
  email: 'ana@empresa.com',
  role: 'OPERADOR',
  status: 'ONLINE',
}
