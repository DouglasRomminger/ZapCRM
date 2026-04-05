# Kanban — Colunas e Regras

## Colunas de Atendimento (criadas automaticamente por empresa)

| Ordem | Nome | Cor |
|---|---|---|
| 1 | Aguardando | `#3B82F6` |
| 2 | Em Atendimento | `#7C3AED` |
| 3 | Aguardando Cliente | `#F59E0B` |
| 4 | Encerrado | `#10B981` |

## Colunas de Pipeline de Vendas (criadas automaticamente por empresa)

| Ordem | Nome | Cor |
|---|---|---|
| 1 | Lead Novo | `#3B82F6` |
| 2 | Interesse Identificado | `#8B5CF6` |
| 3 | Proposta Enviada | `#F59E0B` |
| 4 | Negociando | `#EC4899` |
| 5 | Fechado | `#10B981` |
| 6 | Perdido | `#6B7280` |

Ambos os Kanbans são configuráveis pelo admin da empresa: pode adicionar, renomear, reordenar e remover colunas.

## Regras de movimentação

- Toda movimentação cria um registro em `ChatKanbanHistorico`
- Toda movimentação cria um `LogAtividade` inline na conversa
- Movimentações disparam evento `kanban_movido` via Socket.io para a room `empresa:${empresaId}`
- O operador nunca precisa abrir o Kanban para atualizá-lo — o chat faz isso automaticamente
