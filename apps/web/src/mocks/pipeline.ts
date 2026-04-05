import type { CardPipeline } from '@/src/types'
import { mockOperadores } from './usuarios'

export const mockCardsPipeline: CardPipeline[] = [
  // Lead Novo
  { id: 'pp01', empresaId: 'e1', nome: 'Tech Solutions Ltda',  operador: mockOperadores[0], colunaId: 'p1', valorEstimado: 2400,  diasNoEstagio: 1, tags: ['b2b', 'tech'] },
  { id: 'pp02', empresaId: 'e1', nome: 'Maria Oliveira',       operador: undefined,         colunaId: 'p1', valorEstimado: 800,   diasNoEstagio: 1, tags: ['pme'] },
  { id: 'pp03', empresaId: 'e1', nome: 'Construtora ABC',      operador: mockOperadores[1], colunaId: 'p1', valorEstimado: 5000,  diasNoEstagio: 2, tags: ['b2b'] },
  { id: 'pp04', empresaId: 'e1', nome: 'João Ferreira',        operador: undefined,         colunaId: 'p1', valorEstimado: 350,   diasNoEstagio: 2, tags: ['lead'] },
  { id: 'pp05', empresaId: 'e1', nome: 'Mercado Sul',          operador: mockOperadores[0], colunaId: 'p1', valorEstimado: 1200,  diasNoEstagio: 3, tags: ['varejo'] },

  // Interesse Identificado
  { id: 'pp06', empresaId: 'e1', nome: 'Pedro Alves',          operador: mockOperadores[1], colunaId: 'p2', valorEstimado: 1500,  diasNoEstagio: 3, tags: ['lead', 'interessado'] },
  { id: 'pp07', empresaId: 'e1', nome: 'Studio Design Co',     operador: mockOperadores[0], colunaId: 'p2', valorEstimado: 3200,  diasNoEstagio: 5, tags: ['b2b'] },
  { id: 'pp08', empresaId: 'e1', nome: 'Fernanda Lima',        operador: mockOperadores[0], colunaId: 'p2', valorEstimado: 950,   diasNoEstagio: 4, tags: ['recorrente'] },

  // Proposta Enviada
  { id: 'pp09', empresaId: 'e1', nome: 'Grupo Alvorada',       operador: mockOperadores[1], colunaId: 'p3', valorEstimado: 8500,  diasNoEstagio: 2, tags: ['b2b', 'vip'] },
  { id: 'pp10', empresaId: 'e1', nome: 'Juliana Rocha',        operador: mockOperadores[0], colunaId: 'p3', valorEstimado: 1800,  diasNoEstagio: 1, tags: ['cliente'] },

  // Negociando
  { id: 'pp11', empresaId: 'e1', nome: 'Roberto Santos',       operador: mockOperadores[0], colunaId: 'p4', valorEstimado: 4200,  diasNoEstagio: 6, tags: ['b2b'] },
  { id: 'pp12', empresaId: 'e1', nome: 'Loja das Flores',      operador: mockOperadores[1], colunaId: 'p4', valorEstimado: 700,   diasNoEstagio: 3, tags: ['varejo'] },

  // Fechado
  { id: 'pp13', empresaId: 'e1', nome: 'Carlos Eduardo',       operador: mockOperadores[0], colunaId: 'p5', valorEstimado: 2900,  diasNoEstagio: 0, tags: ['cliente'] },
  { id: 'pp14', empresaId: 'e1', nome: 'Agência Nova Era',     operador: mockOperadores[1], colunaId: 'p5', valorEstimado: 6000,  diasNoEstagio: 0, tags: ['b2b', 'vip'] },
  { id: 'pp15', empresaId: 'e1', nome: 'Ana Beatriz',          operador: mockOperadores[0], colunaId: 'p5', valorEstimado: 1100,  diasNoEstagio: 0, tags: [] },

  // Perdido
  { id: 'pp16', empresaId: 'e1', nome: 'Indústria Primus',     operador: mockOperadores[1], colunaId: 'p6', valorEstimado: 3500,  diasNoEstagio: 0, tags: ['b2b'] },
]
