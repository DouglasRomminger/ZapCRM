import type { Avaliacao } from '@/src/types'
import { mockContatos } from './contatos'
import { mockOperadores } from './usuarios'

export const mockAvaliacoes: Avaliacao[] = [
  { id: 'av1', chatId: 'ch1', contato: mockContatos[0], operador: mockOperadores[0], nota: 5, comentario: 'Atendimento excelente, muito rápido e resolutivo!', criadaEm: new Date(Date.now() - 1 * 3600000).toISOString() },
  { id: 'av2', chatId: 'ch3', contato: mockContatos[2], operador: mockOperadores[1], nota: 4, comentario: 'Bom atendimento, resolveu meu problema.', criadaEm: new Date(Date.now() - 3 * 3600000).toISOString() },
  { id: 'av3', chatId: 'ch5', contato: mockContatos[5], operador: mockOperadores[0], nota: 2, comentario: 'Demorou muito para responder, fiquei esperando.', criadaEm: new Date(Date.now() - 5 * 3600000).toISOString() },
  { id: 'av4', chatId: 'ch2', contato: mockContatos[1], operador: mockOperadores[1], nota: 5, comentario: undefined, criadaEm: new Date(Date.now() - 8 * 3600000).toISOString() },
  { id: 'av5', chatId: 'ch4', contato: mockContatos[4], operador: mockOperadores[0], nota: 1, comentario: 'Péssimo. Não resolveram meu problema e me deixaram sem resposta.', criadaEm: new Date(Date.now() - 12 * 3600000).toISOString() },
  { id: 'av6', chatId: 'ch1', contato: mockContatos[3], operador: mockOperadores[1], nota: 4, comentario: 'Atendimento rápido e atencioso.', criadaEm: new Date(Date.now() - 24 * 3600000).toISOString() },
  { id: 'av7', chatId: 'ch2', contato: mockContatos[2], operador: mockOperadores[0], nota: 3, comentario: 'Razoável, poderia melhorar.', criadaEm: new Date(Date.now() - 30 * 3600000).toISOString() },
  { id: 'av8', chatId: 'ch3', contato: mockContatos[0], operador: mockOperadores[0], nota: 5, comentario: 'Perfeito! Super indicado.', criadaEm: new Date(Date.now() - 48 * 3600000).toISOString() },
]
