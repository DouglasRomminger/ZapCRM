import type { KanbanColuna } from '@/src/types'

export const mockColunasAtendimento: KanbanColuna[] = [
  { id: 'k1', empresaId: 'e1', nome: 'Aguardando',          cor: '#3B82F6', ordem: 1, tipo: 'ATENDIMENTO', totalChats: 4 },
  { id: 'k2', empresaId: 'e1', nome: 'Em Atendimento',      cor: '#7C3AED', ordem: 2, tipo: 'ATENDIMENTO', totalChats: 7 },
  { id: 'k3', empresaId: 'e1', nome: 'Aguardando Cliente',  cor: '#F59E0B', ordem: 3, tipo: 'ATENDIMENTO', totalChats: 3 },
  { id: 'k4', empresaId: 'e1', nome: 'Encerrado',           cor: '#10B981', ordem: 4, tipo: 'ATENDIMENTO', totalChats: 12 },
]

export const mockColunasPipeline: KanbanColuna[] = [
  { id: 'p1', empresaId: 'e1', nome: 'Lead Novo',               cor: '#3B82F6', ordem: 1, tipo: 'PIPELINE', totalChats: 8 },
  { id: 'p2', empresaId: 'e1', nome: 'Interesse Identificado',  cor: '#8B5CF6', ordem: 2, tipo: 'PIPELINE', totalChats: 5 },
  { id: 'p3', empresaId: 'e1', nome: 'Proposta Enviada',        cor: '#F59E0B', ordem: 3, tipo: 'PIPELINE', totalChats: 3 },
  { id: 'p4', empresaId: 'e1', nome: 'Negociando',              cor: '#EC4899', ordem: 4, tipo: 'PIPELINE', totalChats: 2 },
  { id: 'p5', empresaId: 'e1', nome: 'Fechado',                 cor: '#10B981', ordem: 5, tipo: 'PIPELINE', totalChats: 6 },
  { id: 'p6', empresaId: 'e1', nome: 'Perdido',                 cor: '#6B7280', ordem: 6, tipo: 'PIPELINE', totalChats: 1 },
]
