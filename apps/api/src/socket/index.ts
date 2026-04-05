import { Server as SocketServer, Socket } from 'socket.io'
import { verifyToken } from '../lib/jwt'

export function initSocket(io: SocketServer) {
  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined

    if (!token) {
      // Permite empresaId direto enquanto auth JWT não está implementada
      const empresaId = socket.handshake.auth?.empresaId as string
      if (empresaId) {
        socket.data.empresaId = empresaId
        return next()
      }
      return next(new Error('Token não fornecido'))
    }

    try {
      const payload = verifyToken(token)
      socket.data.empresaId = payload.empresaId
      socket.data.usuarioId = payload.usuarioId
      next()
    } catch {
      next(new Error('Token inválido'))
    }
  })

  io.on('connection', (socket: Socket) => {
    const empresaId = socket.data.empresaId as string
    // Cada empresa tem sua sala isolada
    socket.join(`empresa:${empresaId}`)
    socket.on('disconnect', () => {})
  })
}

// Helpers exportados para uso nos módulos
export function emitParaEmpresa(
  io: SocketServer,
  empresaId: string,
  evento: string,
  dados: unknown,
) {
  io.to(`empresa:${empresaId}`).emit(evento, dados)
}
