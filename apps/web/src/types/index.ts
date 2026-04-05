// Tipos compartilhados — espelham as entidades Prisma

export type RoleUsuario = 'OPERADOR' | 'SUPERVISOR' | 'ADMIN'
export type StatusChat = 'AGUARDANDO' | 'EM_ATENDIMENTO' | 'AGUARDANDO_CLIENTE' | 'ENCERRADO'
export type StatusOperador = 'ONLINE' | 'AUSENTE' | 'OFFLINE'
export type TipoKanban = 'ATENDIMENTO' | 'PIPELINE'

export interface Empresa {
  id: string
  nome: string
  plano: string
  ativa: boolean
}

export interface Usuario {
  id: string
  empresaId: string
  nome: string
  email: string
  role: RoleUsuario
  status: StatusOperador
  avatar?: string
}

export interface Contato {
  id: string
  empresaId: string
  nome: string
  telefone: string
  email?: string
  avatar?: string
  optin: boolean
  tags: string[]
}

export interface Mensagem {
  id: string
  chatId: string
  autorId?: string
  conteudo: string
  tipo: 'texto' | 'imagem' | 'audio' | 'documento'
  lida: boolean
  criadaEm: string
}

export interface Chat {
  id: string
  empresaId: string
  contato: Contato
  operador?: Usuario
  status: StatusChat
  kanbanColuna?: KanbanColuna
  ultimaMensagem?: Mensagem
  totalNaoLidas: number
  criadoEm: string
  atualizadoEm: string
}

export interface KanbanColuna {
  id: string
  empresaId: string
  nome: string
  cor: string
  ordem: number
  tipo: TipoKanban
  totalChats?: number
}

export interface KpiDashboard {
  totalAtendimentos: number
  emAtendimento: number
  aguardando: number
  encerradosHoje: number
  tmrMinutos: number // Tempo Médio de Resposta
  notaMedia: number
}

// Pipeline de vendas
export interface CardPipeline {
  id: string
  empresaId: string
  nome: string
  operador?: Usuario
  colunaId: string
  valorEstimado: number
  diasNoEstagio: number
  tags: string[]
}

// Campanhas
export type StatusCampanha = 'ATIVA' | 'AGENDADA' | 'ENCERRADA' | 'RASCUNHO'

export interface Campanha {
  id: string
  empresaId: string
  nome: string
  status: StatusCampanha
  enviados: number
  lidas: number
  totalDestinatarios: number
  criadaEm: string
  agendadaPara?: string
  mensagem: string
  segmento: string
}

// Avaliações de satisfação
export interface Avaliacao {
  id: string
  chatId: string
  contato: Contato
  operador: Usuario
  nota: number
  comentario?: string
  criadaEm: string
}

// Contato enriquecido para display (une Chat + Contato)
export interface ContatoDisplay extends Contato {
  operadorNome?: string
  pipelineColuna?: string
  ultimoAtendimento?: string
  totalAtendimentos: number
  notaMedia?: number
}

// Tipo de exibição no inbox (inclui notas internas e logs de atividade)
export type TipoMensagemDisplay = 'texto' | 'imagem' | 'audio' | 'documento' | 'nota_interna' | 'log_atividade'

export interface MensagemDisplay {
  id: string
  chatId: string
  autorId?: string
  autorNome?: string
  conteudo: string
  tipo: TipoMensagemDisplay
  lida: boolean
  criadaEm: string
}
