# Super Admin — Segurança e Regras

## Acesso

- URL exclusiva: `admin.zapcrmapp.com.br` — código em `apps/admin`, **nunca misturar com `apps/web`**
- **2FA obrigatório** via TOTP (otplib) — sem exceção, sem fallback por e-mail ou SMS
- Sessão: **4 horas** (app das empresas: 8 horas)
- Bloqueio após **3 tentativas** incorretas de login

## LogSuperAdmin — IMUTÁVEL

- Toda ação do Super Admin cria um registro em `LogSuperAdmin`
- **Nunca gerar DELETE ou UPDATE nessa tabela** — apenas INSERT
- Campos obrigatórios: `adminId`, `acao`, `empresaId` (quando aplicável), `ip`, `criadoEm`

## Impersonation

- Sempre registrada em `LogSuperAdmin` com `empresaId`, `entradaEm` e `saidaEm`
- Sessão de impersonation não renova o timer — expira junto com a sessão original

## Funcionalidades do painel

| Módulo | Descrição |
|---|---|
| `empresas/` | Lista, criação, suspensão e detalhes de empresas clientes |
| `financeiro/` | MRR, faturas, cobranças em atraso |
| `sistema/` | Saúde da VPS e status da Evolution API |
| `suporte/` | Impersonation e logs de atividade |
