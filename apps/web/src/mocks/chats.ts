import type { Chat, MensagemDisplay } from '@/src/types'
import { mockContatos } from './contatos'
import { mockOperadores } from './usuarios'
import { mockColunasAtendimento } from './kanban'

export const mockChats: Chat[] = [
  {
    id: 'ch1',
    empresaId: 'e1',
    contato: mockContatos[0],
    operador: mockOperadores[0],
    status: 'EM_ATENDIMENTO',
    kanbanColuna: mockColunasAtendimento[1],
    totalNaoLidas: 0,
    ultimaMensagem: { id: 'm1', chatId: 'ch1', autorId: undefined, conteudo: 'Preciso de um orçamento para 10 unidades', tipo: 'texto', lida: true, criadaEm: new Date(Date.now() - 3 * 60000).toISOString() },
    criadoEm: new Date(Date.now() - 25 * 60000).toISOString(),
    atualizadoEm: new Date(Date.now() - 3 * 60000).toISOString(),
  },
  {
    id: 'ch2',
    empresaId: 'e1',
    contato: mockContatos[1],
    operador: undefined,
    status: 'AGUARDANDO',
    kanbanColuna: mockColunasAtendimento[0],
    totalNaoLidas: 2,
    ultimaMensagem: { id: 'm2', chatId: 'ch2', autorId: undefined, conteudo: 'Queria saber sobre o plano mensal', tipo: 'texto', lida: false, criadaEm: new Date(Date.now() - 7 * 60000).toISOString() },
    criadoEm: new Date(Date.now() - 7 * 60000).toISOString(),
    atualizadoEm: new Date(Date.now() - 7 * 60000).toISOString(),
  },
  {
    id: 'ch3',
    empresaId: 'e1',
    contato: mockContatos[2],
    operador: mockOperadores[1],
    status: 'AGUARDANDO_CLIENTE',
    kanbanColuna: mockColunasAtendimento[2],
    totalNaoLidas: 0,
    ultimaMensagem: { id: 'm3', chatId: 'ch3', autorId: 'u2', conteudo: 'Enviei o boleto por e-mail, pode verificar?', tipo: 'texto', lida: true, criadaEm: new Date(Date.now() - 42 * 60000).toISOString() },
    criadoEm: new Date(Date.now() - 2 * 3600000).toISOString(),
    atualizadoEm: new Date(Date.now() - 42 * 60000).toISOString(),
  },
  {
    id: 'ch4',
    empresaId: 'e1',
    contato: mockContatos[4],
    operador: mockOperadores[0],
    status: 'EM_ATENDIMENTO',
    kanbanColuna: mockColunasAtendimento[1],
    totalNaoLidas: 1,
    ultimaMensagem: { id: 'm4', chatId: 'ch4', autorId: undefined, conteudo: 'Tá, mas quando chega o pedido?', tipo: 'texto', lida: false, criadaEm: new Date(Date.now() - 15 * 60000).toISOString() },
    criadoEm: new Date(Date.now() - 90 * 60000).toISOString(),
    atualizadoEm: new Date(Date.now() - 15 * 60000).toISOString(),
  },
  {
    id: 'ch5',
    empresaId: 'e1',
    contato: mockContatos[5],
    operador: undefined,
    status: 'AGUARDANDO',
    kanbanColuna: mockColunasAtendimento[0],
    totalNaoLidas: 3,
    ultimaMensagem: { id: 'm5', chatId: 'ch5', autorId: undefined, conteudo: 'Oi! Vi o anúncio de vocês', tipo: 'texto', lida: false, criadaEm: new Date(Date.now() - 2 * 60000).toISOString() },
    criadoEm: new Date(Date.now() - 2 * 60000).toISOString(),
    atualizadoEm: new Date(Date.now() - 2 * 60000).toISOString(),
  },
]

export const mockMensagensChat: Record<string, Chat['ultimaMensagem'][]> = {
  ch1: [
    { id: 'm1a', chatId: 'ch1', autorId: undefined, conteudo: 'Olá! Gostaria de um orçamento', tipo: 'texto', lida: true, criadaEm: new Date(Date.now() - 25 * 60000).toISOString() },
    { id: 'm1b', chatId: 'ch1', autorId: 'u1',      conteudo: 'Oi Maria! Claro, para quantas unidades?', tipo: 'texto', lida: true, criadaEm: new Date(Date.now() - 20 * 60000).toISOString() },
    { id: 'm1c', chatId: 'ch1', autorId: undefined, conteudo: 'Preciso de um orçamento para 10 unidades', tipo: 'texto', lida: true, criadaEm: new Date(Date.now() - 3 * 60000).toISOString() },
  ],
}

// Mensagens enriquecidas para o inbox (inclui notas internas e logs de atividade)
export const mockMensagensDisplay: Record<string, MensagemDisplay[]> = {
  ch1: [
    { id: 'd1a', chatId: 'ch1', tipo: 'texto',          autorId: undefined,  autorNome: undefined,    conteudo: 'Olá! Gostaria de saber sobre os produtos de vocês', lida: true, criadaEm: new Date(Date.now() - 28 * 60000).toISOString() },
    { id: 'd1b', chatId: 'ch1', tipo: 'log_atividade',  autorId: undefined,  autorNome: 'Sistema',    conteudo: 'Chat atribuído para Ana Costa via Round Robin', lida: true, criadaEm: new Date(Date.now() - 27 * 60000).toISOString() },
    { id: 'd1c', chatId: 'ch1', tipo: 'texto',          autorId: 'u1',       autorNome: 'Ana Costa',  conteudo: 'Oi Maria! Tudo bem? 😊 Claro, posso te ajudar! O que você está procurando?', lida: true, criadaEm: new Date(Date.now() - 25 * 60000).toISOString() },
    { id: 'd1d', chatId: 'ch1', tipo: 'nota_interna',   autorId: 'u1',       autorNome: 'Ana Costa',  conteudo: 'Cliente parece interessada em volume. Verificar desconto de fidelidade com o supervisor antes de cotar.', lida: true, criadaEm: new Date(Date.now() - 22 * 60000).toISOString() },
    { id: 'd1e', chatId: 'ch1', tipo: 'texto',          autorId: undefined,  autorNome: undefined,    conteudo: 'Preciso de um orçamento para 10 unidades. Tem algum desconto para pedidos grandes?', lida: true, criadaEm: new Date(Date.now() - 20 * 60000).toISOString() },
    { id: 'd1f', chatId: 'ch1', tipo: 'log_atividade',  autorId: undefined,  autorNome: 'Sistema',    conteudo: 'Movido para "Em Atendimento" por Ana Costa', lida: true, criadaEm: new Date(Date.now() - 15 * 60000).toISOString() },
    { id: 'd1g', chatId: 'ch1', tipo: 'texto',          autorId: 'u1',       autorNome: 'Ana Costa',  conteudo: 'Para 10 unidades temos 12% de desconto! Vou montar o orçamento completo agora.', lida: true, criadaEm: new Date(Date.now() - 10 * 60000).toISOString() },
    { id: 'd1h', chatId: 'ch1', tipo: 'texto',          autorId: undefined,  autorNome: undefined,    conteudo: 'Preciso de um orçamento para 10 unidades', lida: true, criadaEm: new Date(Date.now() - 3 * 60000).toISOString() },
  ],
  ch2: [
    { id: 'd2a', chatId: 'ch2', tipo: 'texto',          autorId: undefined,  autorNome: undefined,    conteudo: 'Boa tarde! Queria saber sobre o plano mensal de vocês', lida: false, criadaEm: new Date(Date.now() - 9 * 60000).toISOString() },
    { id: 'd2b', chatId: 'ch2', tipo: 'texto',          autorId: undefined,  autorNome: undefined,    conteudo: 'Queria saber sobre o plano mensal', lida: false, criadaEm: new Date(Date.now() - 7 * 60000).toISOString() },
  ],
  ch3: [
    { id: 'd3a', chatId: 'ch3', tipo: 'texto',          autorId: 'u2',       autorNome: 'Bruno Lima', conteudo: 'Olá Juliana! O boleto foi gerado e enviei para o seu e-mail ju@hotmail.com.', lida: true, criadaEm: new Date(Date.now() - 50 * 60000).toISOString() },
    { id: 'd3b', chatId: 'ch3', tipo: 'log_atividade',  autorId: undefined,  autorNome: 'Sistema',    conteudo: 'Movido para "Aguardando Cliente" por Bruno Lima', lida: true, criadaEm: new Date(Date.now() - 45 * 60000).toISOString() },
    { id: 'd3c', chatId: 'ch3', tipo: 'nota_interna',   autorId: 'u2',       autorNome: 'Bruno Lima', conteudo: 'Aguardando confirmação do pagamento. Prazo: até amanhã.', lida: true, criadaEm: new Date(Date.now() - 44 * 60000).toISOString() },
    { id: 'd3d', chatId: 'ch3', tipo: 'texto',          autorId: 'u2',       autorNome: 'Bruno Lima', conteudo: 'Enviei o boleto por e-mail, pode verificar?', lida: true, criadaEm: new Date(Date.now() - 42 * 60000).toISOString() },
  ],
  ch4: [
    { id: 'd4a', chatId: 'ch4', tipo: 'texto',          autorId: undefined,  autorNome: undefined,    conteudo: 'Fiz o pedido há 5 dias, quando vai chegar?', lida: true, criadaEm: new Date(Date.now() - 20 * 60000).toISOString() },
    { id: 'd4b', chatId: 'ch4', tipo: 'nota_interna',   autorId: 'u1',       autorNome: 'Ana Costa',  conteudo: 'Verificar status do pedido #4521 no sistema de logística.', lida: true, criadaEm: new Date(Date.now() - 17 * 60000).toISOString() },
    { id: 'd4c', chatId: 'ch4', tipo: 'texto',          autorId: undefined,  autorNome: undefined,    conteudo: 'Tá, mas quando chega o pedido?', lida: false, criadaEm: new Date(Date.now() - 15 * 60000).toISOString() },
  ],
  ch5: [
    { id: 'd5a', chatId: 'ch5', tipo: 'texto',          autorId: undefined,  autorNome: undefined,    conteudo: 'Oi! Vi o anúncio de vocês no Instagram', lida: false, criadaEm: new Date(Date.now() - 3 * 60000).toISOString() },
    { id: 'd5b', chatId: 'ch5', tipo: 'texto',          autorId: undefined,  autorNome: undefined,    conteudo: 'Oi! Vi o anúncio de vocês', lida: false, criadaEm: new Date(Date.now() - 2 * 60000).toISOString() },
  ],
}
