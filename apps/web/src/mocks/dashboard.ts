import type { KpiDashboard } from '@/src/types'

export const mockKpis: KpiDashboard = {
  totalAtendimentos: 142,
  emAtendimento: 7,
  aguardando: 4,
  encerradosHoje: 38,
  tmrMinutos: 4.2,
  notaMedia: 4.6,
}

// Dados do gráfico de atendimentos nos últimos 7 dias
export const mockGraficoSemana = [
  { dia: 'Seg', total: 18, encerrados: 15 },
  { dia: 'Ter', total: 24, encerrados: 21 },
  { dia: 'Qua', total: 19, encerrados: 18 },
  { dia: 'Qui', total: 31, encerrados: 27 },
  { dia: 'Sex', total: 28, encerrados: 25 },
  { dia: 'Sáb', total: 12, encerrados: 11 },
  { dia: 'Dom', total: 10, encerrados: 9 },
]
