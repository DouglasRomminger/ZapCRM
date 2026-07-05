// Cria as colunas padrão do kanban para uma empresa e faz backfill dos chats
// existentes na coluna de atendimento correspondente ao status.
// Uso: npm run seed:colunas --workspace=apps/api -- "Nome da Empresa"
//   (sem argumento, usa a primeira empresa cadastrada)
import dotenv from 'dotenv'
import { resolve } from 'path'
dotenv.config({ path: resolve(process.cwd(), '../../.env') })

import { prisma } from '../lib/prisma'
import { garantirColunasPadrao, STATUS_PARA_COLUNA } from '../lib/colunas'

async function main() {
  const empresaNome = process.argv[2]
  const empresa = empresaNome
    ? await prisma.empresa.findFirst({ where: { nome: empresaNome } })
    : await prisma.empresa.findFirst()

  if (!empresa) {
    console.error('Empresa não encontrada.')
    process.exit(1)
  }

  const colunas = await garantirColunasPadrao(empresa.id)
  console.log(`Colunas garantidas para "${empresa.nome}": ${colunas.length}`)

  const atendimento = colunas.filter(c => c.tipo === 'ATENDIMENTO')
  for (const [status, nome] of Object.entries(STATUS_PARA_COLUNA)) {
    const col = atendimento.find(c => c.nome === nome)
    if (!col) continue
    const r = await prisma.chat.updateMany({
      where: { empresaId: empresa.id, status: status as never, kanbanColunaId: null },
      data: { kanbanColunaId: col.id },
    })
    console.log(`  ${status} → ${nome}: ${r.count} chat(s) atualizados`)
  }
}

main()
  .catch((err) => { console.error(err); process.exit(1) })
  .finally(() => prisma.$disconnect())
