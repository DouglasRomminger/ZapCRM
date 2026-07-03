import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import bcrypt from 'bcryptjs'
import { prisma } from '../../lib/prisma'
import { signToken } from '../../lib/jwt'

// ─── Lógica pura (exportada para teste) ───────────────────────────────────────

export async function autenticar(
  usuario: { senhaHash: string; ativo: boolean } | null,
  senha: string,
): Promise<boolean> {
  if (!usuario || !usuario.ativo) return false
  return bcrypt.compare(senha, usuario.senhaHash)
}

// ─── Rotas ────────────────────────────────────────────────────────────────────

export async function authRoutes(fastify: FastifyInstance) {

  // POST /api/auth/login — email + senha → JWT
  fastify.post('/login', async (req: FastifyRequest<{
    Body: { email?: string; senha?: string }
  }>, reply: FastifyReply) => {
    try {
      const { email, senha } = req.body ?? {}
      if (!email || !senha) {
        return reply.status(400).send({ error: 'Informe email e senha' })
      }

      const usuario = await prisma.usuario.findUnique({
        where: { email },
        include: { empresa: { select: { id: true, nome: true, ativa: true } } },
      })

      // Mensagem genérica: não revelar se o email existe
      const ok = await autenticar(usuario, senha)
      if (!ok || !usuario || !usuario.empresa.ativa) {
        return reply.status(401).send({ error: 'Credenciais inválidas' })
      }

      const token = signToken({
        empresaId: usuario.empresaId,
        usuarioId: usuario.id,
        role: usuario.role,
      })

      await prisma.usuario.update({
        where: { id: usuario.id },
        data: { ultimoAtivoEm: new Date() },
      })

      return {
        token,
        usuario: {
          id: usuario.id,
          nome: usuario.nome,
          email: usuario.email,
          role: usuario.role,
          empresaId: usuario.empresaId,
          empresa: { id: usuario.empresa.id, nome: usuario.empresa.nome },
        },
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro interno'
      return reply.status(500).send({ error: msg })
    }
  })
}
