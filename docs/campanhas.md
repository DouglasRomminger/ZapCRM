# Campanhas — Regras e Proteções Anti-spam

## Proteções obrigatórias (sem exceção)

- Disparos apenas entre **08:00 e 20:00** (America/Sao_Paulo)
- Máximo **1 mensagem por cliente por dia**
- **Nunca enviar** se `Contato.optin !== true`
- Verificar opt-in antes de **cada** disparo individual — não só no início da campanha
- **Blacklist automática** para números que bloquearam ou marcaram como spam

## Fluxo de disparo

```
1. Admin cria campanha com segmentação e agendamento
2. Job Bull agenda os disparos respeitando janela de horário
3. Antes de cada disparo: checar opt-in + blacklist + limite diário
4. Registrar resultado em DisparoCampanha (enviado | falhou | bloqueado)
5. Atualizar métricas da campanha em tempo real
```

## Modelo `DisparoCampanha`

Cada registro representa um disparo individual e deve conter: `campanhaId`, `contatoId`, `status`, `enviadoEm`, `erro` (se falhou).
