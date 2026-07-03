// Cria (ou atualiza) o primeiro usuário ADMIN de uma empresa.
// Uso: npm run seed:admin --workspace=apps/api -- "Nome da Empresa" "Nome do Admin" email@dominio.com senha
import dotenv from 'dotenv'
import { resolve } from 'path'
dotenv.config({ path: resolve(process.cwd(), '../../.env') })

import bcrypt from 'bcryptjs'
import { prisma } from '../lib/prisma'

async function main() {
  const [empresaNome, nome, email, senha] = process.argv.slice(2)
  if (!empresaNome || !nome || !email || !senha) {
    console.error('Uso: npm run seed:admin --workspace=apps/api -- "Empresa" "Nome" email senha')
    process.exit(1)
  }

  let empresa = await prisma.empresa.findFirst({ where: { nome: empresaNome } })
  if (!empresa) {
    empresa = await prisma.empresa.create({ data: { nome: empresaNome } })
    console.log(`Empresa criada: ${empresa.nome} (${empresa.id})`)
  } else {
    console.log(`Empresa existente: ${empresa.nome} (${empresa.id})`)
  }

  const senhaHash = await bcrypt.hash(senha, 10)
  const usuario = await prisma.usuario.upsert({
    where: { email },
    update: { senhaHash, role: 'ADMIN', ativo: true },
    create: { empresaId: empresa.id, nome, email, senhaHash, role: 'ADMIN' },
  })

  console.log(`Admin pronto: ${usuario.email} (empresa ${empresa.nome})`)
}

main()
  .catch((err) => { console.error(err); process.exit(1) })
  .finally(() => prisma.$disconnect())
