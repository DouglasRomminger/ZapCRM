# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Projeto

ZapCRM é uma plataforma SaaS de atendimento via WhatsApp para PMEs. Dois painéis: `app.zapcrmapp.com.br` (operadores/supervisores/admins das empresas clientes) e `admin.zapcrmapp.com.br` (Super Admin exclusivo do dono do produto). Funcionalidades centrais: inbox em tempo real, fila Round Robin, Kanban sincronizado com chat, pipeline de vendas, NPS automático e campanhas segmentadas.

---

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend (app + admin) | Next.js 14 (App Router) + Tailwind CSS + shadcn/ui |
| Backend | Fastify (Node.js + TypeScript) |
| Banco de dados | Supabase (PostgreSQL gerenciado) |
| ORM | Prisma (`DATABASE_URL` → Supabase) |
| Tempo real | Socket.io |
| Estado global | Zustand |
| Fila de jobs | Bull + Redis |
| Auth (app) | Supabase Auth + JWT |
| Auth (Super Admin) | JWT + TOTP 2FA obrigatório (otplib) |
| WhatsApp | Evolution API (self-hosted na VPS) |
| Pagamentos | Pagar.me — nunca substituir por Stripe |
| Armazenamento | Supabase Storage |

---

## Estrutura de Pastas — IMUTÁVEL

```
ZapCRM/
├── apps/
│   ├── web/                  # Next.js — painel das empresas clientes
│   │   └── app/
│   │       ├── (auth)/       # Login, cadastro, recuperação de senha
│   │       └── (app)/        # Área autenticada
│   │           ├── dashboard/
│   │           ├── inbox/
│   │           ├── kanban/
│   │           ├── pipeline/
│   │           ├── contatos/
│   │           ├── satisfacao/
│   │           ├── campanhas/
│   │           └── settings/
│   ├── admin/                # Next.js — painel Super Admin
│   │   └── app/
│   │       ├── (auth)/       # Login com 2FA obrigatório
│   │       └── (admin)/
│   │           ├── empresas/
│   │           ├── financeiro/
│   │           ├── sistema/
│   │           └── suporte/
│   └── api/                  # Fastify backend
│       └── src/
│           ├── modules/
│           │   ├── auth/
│           │   ├── chat/
│           │   ├── contatos/
│           │   ├── kanban/
│           │   ├── pipeline/
│           │   ├── campanhas/
│           │   ├── satisfacao/
│           │   ├── evolution/
│           │   ├── pagamentos/
│           │   └── superadmin/
│           └── socket/
├── packages/
│   └── shared/               # Tipos e utilitários compartilhados
├── prisma/
│   └── schema.prisma
├── docs/                     # Documentação detalhada por módulo
└── .env
```

---

## Entidades do Prisma — NUNCA RENOMEAR

| Model | Descrição |
|---|---|
| `Empresa` | Empresa cliente cadastrada |
| `Usuario` | Operador, Supervisor ou Admin de uma empresa |
| `Contato` | Cliente final que interage via WhatsApp |
| `Chat` | Conversa entre empresa e contato |
| `Mensagem` | Cada mensagem dentro de um chat |
| `LogAtividade` | Log inline de ações dentro de um chat |
| `KanbanColuna` | Coluna do Kanban (atendimento ou pipeline) |
| `ChatKanbanHistorico` | Histórico de movimentações entre colunas |
| `Avaliacao` | Nota de satisfação de um atendimento encerrado |
| `Campanha` | Campanha de mensagens em massa |
| `DisparoCampanha` | Disparo individual de uma campanha |
| `Fatura` | Fatura de pagamento de uma empresa |
| `LogSuperAdmin` | Log imutável de ações do Super Admin |

Migrations em português: `npx prisma migrate dev --name adiciona-campo-status-chat`

---

## Design System

Usar variáveis CSS — nunca hardcodar hex em componentes.

```css
--color-sidebar:       #2D1B69;  /* Sidebar */
--color-accent:        #7C3AED;  /* Botões primários, links */
--color-accent-dark:   #6D28D9;  /* Hover */
--color-purple-light:  #EDE9FE;  /* Backgrounds */
--color-purple-border: #DDD6FE;  /* Bordas ativas */
--color-bg:            #F5F6FA;  /* Fundo das páginas */
--color-surface:       #FFFFFF;  /* Cards e painéis */
--color-text:          #1A1A2E;
--color-text2:         #6B7280;
--color-text3:         #9CA3AF;
--color-border:        #E5E7EB;
--color-green:         #10B981;
--color-green-bg:      #D1FAE5;
--color-red:           #EF4444;
--color-red-bg:        #FEE2E2;
--color-amber:         #F59E0B;
--color-amber-bg:      #FEF3C7;
--color-blue:          #3B82F6;
--color-blue-bg:       #DBEAFE;
```

**Fonte:** Inter (Google Fonts). Títulos `text-[17px] font-semibold`, corpo `text-[13px] md:text-[14px]`, badges `text-[10px] md:text-[12px] font-medium`.
**Sidebar:** `w-[220px]` — fixo. **Topbar:** `h-[58px]` — fixo. **Bordas:** `rounded-lg` cards, `rounded-md` inputs/botões.

---

## Regras Críticas de Negócio

1. **Chat ↔ Kanban em tempo real:** qualquer mutação que afeta o Kanban emite Socket.io **antes** de retornar HTTP. Nunca atualizar UI otimisticamente sem garantir emissão do evento. Ver `docs/socket-events.md`.

2. **LogAtividade obrigatório:** toda movimentação de coluna, transferência e encerramento cria um `LogAtividade` inline na conversa.

3. **Topbar do chat:** sempre exibir a coluna atual do Kanban com cor e barra de progresso das etapas.

4. **Pesquisa de satisfação:** dispara **somente** após operador clicar em Encerrar. Job Bull aguarda exatamente 2 minutos. Máximo 1 pesquisa por cliente a cada 7 dias. Nota ≤ 2 emite `alerta_satisfacao` ao supervisor.

5. **Campanhas — anti-spam:** disparos apenas entre 08:00–20:00 (America/Sao_Paulo), máximo 1 mensagem por cliente por dia, nunca enviar se `Contato.optin !== true`. Ver `docs/campanhas.md`.

6. **Super Admin:** 2FA obrigatório sem exceção, sessão de 4 horas, bloqueio após 3 tentativas. `LogSuperAdmin` é imutável — nunca gerar DELETE ou UPDATE nessa tabela. Ver `docs/super-admin.md`.

7. **Webhook Evolution API:** sempre validar `apikey` no header antes de processar. Nunca logar conteúdo de mensagens de usuários finais. Ver `docs/evolution-api.md`.

8. **Pagar.me:** gateway fixo para PIX, boleto e cartão recorrente. Nunca substituir por Stripe.

---

## Variáveis de Ambiente

```env
# Supabase
DATABASE_URL=                  # postgres://... (connection pooling)
DIRECT_URL=                    # postgres://... (direto — Prisma migrations)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=     # apenas backend, NUNCA expor no frontend

# Auth
JWT_SECRET=                    # openssl rand -base64 32
NEXTAUTH_SECRET=               # openssl rand -base64 32
NEXTAUTH_URL=                  # https://app.zapcrmapp.com.br

# Evolution API
EVOLUTION_API_URL=
EVOLUTION_API_KEY=

# Pagar.me
PAGARME_API_KEY=
PAGARME_WEBHOOK_SECRET=

# Redis
REDIS_URL=                     # redis://localhost:6379

# App
SOCKET_PORT=
APP_URL=                       # https://app.zapcrmapp.com.br
ADMIN_URL=                     # https://admin.zapcrmapp.com.br
NODE_ENV=                      # development | production
```

---

## Comandos

```bash
npm install              # instalar dependências
npm run dev              # frontend + backend juntos
npm run dev:web          # apenas apps/web
npm run dev:admin        # apenas apps/admin
npm run dev:api          # apenas apps/api
npm run build
npm test
npm run lint

npx prisma generate                                        # após alterar schema
npx prisma migrate dev --name <descricao-em-portugues>
npx prisma studio
```
