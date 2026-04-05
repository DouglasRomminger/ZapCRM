# ZapCRM — Criação de Telas

## Objetivo
Criar 7 telas com dados mock, uma por vez, seguindo o estilo visual do Kanban existente.

## Referência Visual
- Kanban: `apps/web/app/(app)/kanban/page.tsx` — padrão exato a seguir
- Design system: CSS vars em `globals.css` (--color-sidebar, --color-accent, etc.)
- Fonte Inter, text-[13px] corpo, text-[17px] títulos, rounded-lg cards

## Telas

| # | Rota | Status |
|---|------|--------|
| 1 | /inbox | ✅ completo |
| 2 | /pipeline | ✅ completo |
| 3 | /contatos | ✅ completo |
| 4 | /satisfacao | ✅ completo |
| 5 | /campanhas | ✅ completo |
| 6 | /settings/conexao | ✅ já existia |
| 7 | /settings/equipe | ✅ completo |
| 8 | /settings/geral | ✅ completo |

## Regras
- CSS vars only, sem hex hardcoded
- Mocks em src/mocks/, tipos em src/types/index.ts
- 'use client' apenas quando necessário (useState/useEffect)
- Funções ≤ 25 linhas
- Aguardar confirmação antes de prosseguir para próxima tela
