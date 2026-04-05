# Socket.io — Eventos e Rooms

## Regra geral

Qualquer mutação que afeta o Kanban ou o inbox deve emitir o evento Socket.io **antes** de retornar a resposta HTTP.

## Eventos emitidos pelo servidor

| Evento | Payload | Descrição |
|---|---|---|
| `nova_mensagem` | `{ chatId, mensagem }` | Nova mensagem recebida ou enviada |
| `chat_atribuido` | `{ chatId, operadorId, operadorNome }` | Chat atribuído a um operador |
| `kanban_movido` | `{ chatId, colunaId, colunaAnteriorId, operadorId }` | Card movido entre colunas |
| `chat_encerrado` | `{ chatId }` | Chat encerrado pelo operador |
| `chat_reaberto` | `{ chatId }` | Cliente respondeu após encerramento |
| `alerta_satisfacao` | `{ avaliacaoId, nota, chatId, operadorId }` | Nota ≤ 2 — emitir para supervisor |
| `fila_atualizada` | `{ totalEspera, chats[] }` | Atualização da fila de espera |
| `operador_status` | `{ usuarioId, status }` | Operador ficou online/offline/pausado |
| `conexao_whatsapp` | `{ empresaId, status, qrcode? }` | Mudança de status da instância WhatsApp |

## Rooms — segmentação obrigatória

```typescript
`empresa:${empresaId}`     // Todos os usuários da empresa
`operador:${usuarioId}`    // Apenas este operador
`chat:${chatId}`           // Quem está com este chat aberto
`supervisor:${empresaId}`  // Supervisores e admins da empresa
```

## Sincronização Chat ↔ Kanban

| Ação no chat | Efeito automático no Kanban |
|---|---|
| Operador envia primeira resposta | `Aguardando` → `Em Atendimento` |
| Operador não responde por X min | Alerta visual no card (borda vermelha) |
| Operador transfere o chat | Operador do card atualizado em tempo real |
| Operador clica em Encerrar | → `Encerrado` + pesquisa após 2 min |
| Cliente responde após encerramento | Chat reabre + card volta para `Aguardando` |

**Topbar do chat:** sempre exibir a coluna atual com cor e barra de progresso das etapas.
