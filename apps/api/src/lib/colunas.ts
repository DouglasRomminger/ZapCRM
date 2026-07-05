import { prisma } from './prisma'

// Colunas padrão criadas para cada empresa (uma vez).
const ATENDIMENTO = [
  { nome: 'Aguardando',         cor: '#3B82F6', ordem: 1 },
  { nome: 'Em Atendimento',     cor: '#7C3AED', ordem: 2 },
  { nome: 'Aguardando Cliente', cor: '#F59E0B', ordem: 3 },
  { nome: 'Encerrado',          cor: '#10B981', ordem: 4 },
]
const PIPELINE = [
  { nome: 'Lead Novo',              cor: '#3B82F6', ordem: 1 },
  { nome: 'Interesse Identificado', cor: '#8B5CF6', ordem: 2 },
  { nome: 'Proposta Enviada',       cor: '#F59E0B', ordem: 3 },
  { nome: 'Negociando',             cor: '#EC4899', ordem: 4 },
  { nome: 'Fechado',                cor: '#10B981', ordem: 5 },
  { nome: 'Perdido',                cor: '#6B7280', ordem: 6 },
]

// Mapeia o status do chat para o nome da coluna de atendimento correspondente.
export const STATUS_PARA_COLUNA: Record<string, string> = {
  AGUARDANDO:         'Aguardando',
  EM_ATENDIMENTO:     'Em Atendimento',
  AGUARDANDO_CLIENTE: 'Aguardando Cliente',
  ENCERRADO:          'Encerrado',
}

// Cria as colunas padrão da empresa se ainda não existirem. Idempotente.
export async function garantirColunasPadrao(empresaId: string) {
  const existentes = await prisma.kanbanColuna.count({ where: { empresaId } })
  if (existentes === 0) {
    await prisma.kanbanColuna.createMany({
      data: [
        ...ATENDIMENTO.map(c => ({ ...c, empresaId, tipo: 'ATENDIMENTO' as const })),
        ...PIPELINE.map(c => ({ ...c, empresaId, tipo: 'PIPELINE' as const })),
      ],
    })
  }
  return prisma.kanbanColuna.findMany({ where: { empresaId }, orderBy: { ordem: 'asc' } })
}

// Id da coluna de atendimento "Aguardando" (garante as colunas antes).
export async function colunaAguardandoId(empresaId: string): Promise<string | null> {
  await garantirColunasPadrao(empresaId)
  const col = await prisma.kanbanColuna.findFirst({
    where: { empresaId, tipo: 'ATENDIMENTO', nome: 'Aguardando' },
  })
  return col?.id ?? null
}
