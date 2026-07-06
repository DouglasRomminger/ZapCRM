-- Campos estruturados de prospecção no Contato (aditivo, nullable — sem perda de dados)
ALTER TABLE "Contato" ADD COLUMN "categoria" TEXT;
ALTER TABLE "Contato" ADD COLUMN "endereco" TEXT;
ALTER TABLE "Contato" ADD COLUMN "site" TEXT;
ALTER TABLE "Contato" ADD COLUMN "instagram" TEXT;
ALTER TABLE "Contato" ADD COLUMN "googleNota" DOUBLE PRECISION;
ALTER TABLE "Contato" ADD COLUMN "googleAvaliacoes" INTEGER;
