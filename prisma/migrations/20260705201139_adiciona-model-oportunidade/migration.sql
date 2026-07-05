-- CreateTable
CREATE TABLE "Oportunidade" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "valorEstimado" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "tags" TEXT[],
    "kanbanColunaId" TEXT NOT NULL,
    "operadorId" TEXT,
    "contatoId" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Oportunidade_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Oportunidade" ADD CONSTRAINT "Oportunidade_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Oportunidade" ADD CONSTRAINT "Oportunidade_kanbanColunaId_fkey" FOREIGN KEY ("kanbanColunaId") REFERENCES "KanbanColuna"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Oportunidade" ADD CONSTRAINT "Oportunidade_operadorId_fkey" FOREIGN KEY ("operadorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Oportunidade" ADD CONSTRAINT "Oportunidade_contatoId_fkey" FOREIGN KEY ("contatoId") REFERENCES "Contato"("id") ON DELETE SET NULL ON UPDATE CASCADE;

