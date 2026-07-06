// Backfill dos contatos de prospecção ANTIGOS (importados antes do PR #17).
//
// Esses leads têm as colunas estruturadas (site/instagram/categoria/endereco/googleNota)
// NULL — os dados ficaram só no campo texto `Contato.notas`. Este script parseia o `notas`
// e preenche APENAS os campos que estão null (nunca sobrescreve dado já preenchido).
//
// ┌─ SEGURANÇA ────────────────────────────────────────────────────────────────┐
// │ DRY-RUN é o DEFAULT: sem flag, o script apenas LÊ e imprime um relatório.    │
// │ Nada é gravado. O UPDATE real só ocorre com a flag explícita `--apply`.      │
// └─────────────────────────────────────────────────────────────────────────────┘
//
// Uso (a partir da raiz do repositório):
//   Dry-run (só relatório, não grava):
//     npm run backfill:prospeccao --workspace=apps/api
//   Executar de verdade (grava no banco de DATABASE_URL):
//     npm run backfill:prospeccao --workspace=apps/api -- --apply

import dotenv from 'dotenv'
import { resolve } from 'path'
dotenv.config({ path: resolve(process.cwd(), '../../.env') })

import { prisma } from '../lib/prisma'
import { parseNotasProspeccao } from './parse-notas-prospeccao'

const APLICAR = process.argv.includes('--apply')

// Campos que este backfill consegue reconstruir a partir do `notas`
type CampoBackfill = 'site' | 'googleNota' | 'categoria' | 'endereco'
const CAMPOS: CampoBackfill[] = ['site', 'googleNota', 'categoria', 'endereco']

// Patch com o tipo correto por campo (googleNota é numérico, os demais texto)
interface PatchBackfill {
  site?: string
  googleNota?: number
  categoria?: string
  endereco?: string
}

async function main() {
  console.log(`\n🔎 Backfill de prospecção — modo: ${APLICAR ? '⚠️  APPLY (grava no banco)' : 'DRY-RUN (não grava)'}\n`)

  // Só contatos de prospecção com `notas` preenchido e ao menos um campo estruturado null
  const contatos = await prisma.contato.findMany({
    where: {
      tags: { has: 'prospeccao' },
      notas: { not: null },
      OR: [{ site: null }, { googleNota: null }, { categoria: null }, { endereco: null }],
    },
    select: { id: true, nome: true, notas: true, site: true, googleNota: true, categoria: true, endereco: true },
  })

  console.log(`Candidatos (prospecção + notas + algum campo null): ${contatos.length}`)

  // Monta o patch de cada contato (só campos null no registro e não-null no parse)
  const planos = contatos
    .map(c => {
      const parsed = parseNotasProspeccao(c.notas)
      const patch: PatchBackfill = {}
      if (c.site === null && parsed.site !== null) patch.site = parsed.site
      if (c.googleNota === null && parsed.googleNota !== null) patch.googleNota = parsed.googleNota
      if (c.categoria === null && parsed.categoria !== null) patch.categoria = parsed.categoria
      if (c.endereco === null && parsed.endereco !== null) patch.endereco = parsed.endereco
      return { c, patch }
    })
    .filter(p => Object.keys(p.patch).length > 0)

  console.log(`Serão enriquecidos: ${planos.length}\n`)

  // Contagem por campo
  const porCampo: Record<CampoBackfill, number> = { site: 0, googleNota: 0, categoria: 0, endereco: 0 }
  for (const { patch } of planos) {
    for (const campo of CAMPOS) if (campo in patch) porCampo[campo]++
  }
  console.log('Preenchimentos por campo:')
  for (const campo of CAMPOS) console.log(`  ${campo.padEnd(12)}: ${porCampo[campo]}`)

  // Amostra (antes → depois)
  console.log('\nAmostra (até 10):')
  for (const { c, patch } of planos.slice(0, 10)) {
    console.log(`  • ${c.nome}`)
    console.log(`    notas: ${c.notas}`)
    for (const campo of CAMPOS) {
      if (campo in patch) console.log(`    ${campo}: ${c[campo] ?? 'null'} → ${patch[campo]}`)
    }
  }

  if (!APLICAR) {
    console.log('\n🟡 DRY-RUN concluído. Nada foi gravado.')
    console.log('   Para aplicar de verdade: npm run backfill:prospeccao --workspace=apps/api -- --apply\n')
    return
  }

  // Aplica em lotes pequenos para não estourar o pool do Supabase
  console.log('\n⚙️  Aplicando updates...')
  const TAMANHO_LOTE = 10
  let gravados = 0
  for (let i = 0; i < planos.length; i += TAMANHO_LOTE) {
    const lote = planos.slice(i, i + TAMANHO_LOTE)
    await Promise.all(lote.map(({ c, patch }) => prisma.contato.update({ where: { id: c.id }, data: patch })))
    gravados += lote.length
    console.log(`  ${gravados}/${planos.length}`)
  }
  console.log(`\n✅ Backfill concluído. ${gravados} contatos enriquecidos.\n`)
}

main()
  .catch(err => {
    console.error('❌ Erro no backfill:', err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
