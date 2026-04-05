import type { Contato } from '@/src/types'

export const mockContatos: Contato[] = [
  { id: 'c1', empresaId: 'e1', nome: 'Maria Silva',    telefone: '5511999001001', email: 'maria@gmail.com',  optin: true,  tags: ['cliente', 'vip'] },
  { id: 'c2', empresaId: 'e1', nome: 'Pedro Alves',    telefone: '5511999002002', email: undefined,          optin: true,  tags: ['lead'] },
  { id: 'c3', empresaId: 'e1', nome: 'Juliana Rocha',  telefone: '5511999003003', email: 'ju@hotmail.com',   optin: true,  tags: ['cliente'] },
  { id: 'c4', empresaId: 'e1', nome: 'Carlos Eduardo', telefone: '5511999004004', email: undefined,          optin: false, tags: [] },
  { id: 'c5', empresaId: 'e1', nome: 'Fernanda Lima',  telefone: '5511999005005', email: 'fe@gmail.com',     optin: true,  tags: ['cliente', 'recorrente'] },
  { id: 'c6', empresaId: 'e1', nome: 'Roberto Santos', telefone: '5511999006006', email: undefined,          optin: true,  tags: ['lead'] },
]
