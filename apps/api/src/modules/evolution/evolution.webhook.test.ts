import { describe, it, expect, afterEach } from 'vitest'
import {
  extrairEmpresaId,
  extrairNumero,
  extrairTexto,
  apikeyValida,
} from './evolution.webhook'

describe('extrairEmpresaId', () => {
  it('remove o prefixo zapcrmapp-', () => {
    expect(extrairEmpresaId('zapcrmapp-abc123')).toBe('abc123')
  })
  it('mantém a string quando não há prefixo', () => {
    expect(extrairEmpresaId('abc123')).toBe('abc123')
  })
})

describe('extrairNumero', () => {
  it('extrai o número antes do @', () => {
    expect(extrairNumero('5511999999999@s.whatsapp.net')).toBe('5511999999999')
  })
})

describe('extrairTexto', () => {
  it('usa conversation', () => {
    expect(extrairTexto({ message: { conversation: 'oi' } } as any)).toBe('oi')
  })
  it('usa extendedTextMessage.text', () => {
    expect(extrairTexto({ message: { extendedTextMessage: { text: 'olá' } } } as any)).toBe('olá')
  })
  it('usa a caption da imagem', () => {
    expect(extrairTexto({ message: { imageMessage: { caption: 'foto' } } } as any)).toBe('foto')
  })
  it('retorna vazio sem message', () => {
    expect(extrairTexto({} as any)).toBe('')
  })
  it('retorna [mídia] para mídia sem texto', () => {
    expect(extrairTexto({ message: { audioMessage: {} } } as any)).toBe('[mídia]')
  })
})

describe('apikeyValida', () => {
  const env = process.env
  afterEach(() => {
    process.env = env
  })

  const req = (headers: Record<string, unknown> = {}, body: Record<string, unknown> = {}) =>
    ({ headers, body }) as any

  it('aceita quando o header apikey bate com EVOLUTION_API_KEY', () => {
    process.env = { ...env, EVOLUTION_API_KEY: 'secreta', NODE_ENV: 'production' }
    expect(apikeyValida(req({ apikey: 'secreta' }))).toBe(true)
  })

  it('aceita via header x-api-key', () => {
    process.env = { ...env, EVOLUTION_API_KEY: 'secreta', NODE_ENV: 'production' }
    expect(apikeyValida(req({ 'x-api-key': 'secreta' }))).toBe(true)
  })

  it('aceita apikey vinda no body (fallback)', () => {
    process.env = { ...env, EVOLUTION_API_KEY: 'secreta', NODE_ENV: 'production' }
    expect(apikeyValida(req({}, { apikey: 'secreta' }))).toBe(true)
  })

  it('recusa quando a apikey diverge', () => {
    process.env = { ...env, EVOLUTION_API_KEY: 'secreta', NODE_ENV: 'production' }
    expect(apikeyValida(req({ apikey: 'errada' }))).toBe(false)
  })

  it('fail-closed: sem key configurada em produção, recusa', () => {
    process.env = { ...env, EVOLUTION_API_KEY: '', NODE_ENV: 'production' }
    expect(apikeyValida(req({ apikey: 'qualquer' }))).toBe(false)
  })

  it('sem key configurada em desenvolvimento, libera', () => {
    process.env = { ...env, EVOLUTION_API_KEY: '', NODE_ENV: 'development' }
    expect(apikeyValida(req())).toBe(true)
  })
})
