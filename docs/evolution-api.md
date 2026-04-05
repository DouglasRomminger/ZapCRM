# Evolution API — Integração

## Configuração base

```typescript
const EVOLUTION_BASE = process.env.EVOLUTION_API_URL
const EVOLUTION_KEY  = process.env.EVOLUTION_API_KEY

const headers = {
  'apikey': EVOLUTION_KEY,
  'Content-Type': 'application/json',
}
```

## Webhook

- Endpoint: `POST /webhook/evolution`
- **Sempre** validar o header `apikey` antes de processar qualquer payload
- **Nunca** logar conteúdo de mensagens de usuários finais

## Eventos relevantes

| Evento | Descrição |
|---|---|
| `MESSAGES_UPSERT` | Nova mensagem recebida ou enviada |
| `CONNECTION_UPDATE` | Mudança no status da conexão WhatsApp |
| `QRCODE_UPDATED` | Novo QR code gerado |

## Fluxo de mensagem recebida

```
1. Evolution API → POST /webhook/evolution
2. Backend valida apikey no header
3. Backend identifica Empresa pelo campo instance
4. Backend busca ou cria Contato pelo número
5. Backend aplica fila Round Robin para atribuir operador
6. Backend cria registro Mensagem no banco
7. Backend emite Socket.io 'nova_mensagem'
8. Frontend atualiza inbox + card do Kanban simultaneamente
```

## Round Robin — Regras de atribuição

- Cliente novo → operador com maior tempo sem receber atendimento
- Cliente existente → último operador que atendeu
- Empate → operador com menos chats abertos
- Operador offline/pausado → fora da fila
- Nenhum disponível → fila de espera visível ao supervisor (evento `fila_atualizada`)
