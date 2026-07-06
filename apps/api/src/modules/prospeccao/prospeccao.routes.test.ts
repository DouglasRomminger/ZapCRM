import { describe, it, expect } from 'vitest'
import { normalizarTelefoneBR, leadParaContato, leadTemSite, montarEnriquecimento } from './prospeccao.routes'

describe('normalizarTelefoneBR', () => {
  it('mantém número já com DDI 55', () => {
    expect(normalizarTelefoneBR('+55 47 99999-8888')).toBe('5547999998888')
  })
  it('adiciona DDI em número com DDD (11 dígitos)', () => {
    expect(normalizarTelefoneBR('(47) 99999-8888')).toBe('5547999998888')
  })
  it('adiciona DDI em fixo com DDD (10 dígitos)', () => {
    expect(normalizarTelefoneBR('47 3333-4444')).toBe('554733334444')
  })
  it('rejeita número curto demais', () => {
    expect(normalizarTelefoneBR('99999')).toBeNull()
  })
  it('rejeita vazio/nulo', () => {
    expect(normalizarTelefoneBR('')).toBeNull()
    expect(normalizarTelefoneBR(null)).toBeNull()
    expect(normalizarTelefoneBR(undefined)).toBeNull()
  })
})

describe('leadParaContato', () => {
  const item = {
    title: 'Padaria Central',
    phoneUnformatted: '+5547999998888',
    categoryName: 'Padaria',
    address: 'Rua X, 123 - Blumenau',
    website: 'https://padaria.com.br',
    instagrams: ['https://instagram.com/padariacentral'],
  }

  it('converte lead válido com tags de prospecção e optin false', () => {
    const c = leadParaContato(item, 'Padarias')
    expect(c).not.toBeNull()
    expect(c!.nome).toBe('Padaria Central')
    expect(c!.telefone).toBe('5547999998888')
    expect(c!.tags).toEqual(['prospeccao', 'padarias'])
    expect(c!.optin).toBe(false)
    expect(c!.categoria).toBe('Padaria')
    expect(c!.site).toBe('https://padaria.com.br')
    expect(c!.endereco).toBe('Rua X, 123 - Blumenau')
  })

  it('captura o Instagram quando disponível', () => {
    const c = leadParaContato(item, 'padarias')
    expect(c!.instagram).toBe('https://instagram.com/padariacentral')
  })

  it('instagram nulo quando ausente', () => {
    const c = leadParaContato({ ...item, instagrams: undefined }, 'padarias')
    expect(c!.instagram).toBeNull()
  })

  it('captura nota e nº de avaliações do Google', () => {
    const c = leadParaContato({ ...item, totalScore: 4.7, reviewsCount: 88 }, 'x')
    expect(c!.googleNota).toBe(4.7)
    expect(c!.googleAvaliacoes).toBe(88)
  })

  it('descarta lead sem telefone', () => {
    expect(leadParaContato({ title: 'Sem Fone' }, 'x')).toBeNull()
  })

  it('descarta lead sem nome', () => {
    expect(leadParaContato({ phoneUnformatted: '+5547999998888' }, 'x')).toBeNull()
  })

  it('usa phone como fallback do phoneUnformatted', () => {
    const c = leadParaContato({ title: 'Loja', phone: '(11) 98888-7777' }, 'lojas')
    expect(c!.telefone).toBe('5511988887777')
  })
})

describe('leadTemSite (filtro "só empresas sem site")', () => {
  it('true quando há website', () => {
    expect(leadTemSite({ website: 'https://x.com' })).toBe(true)
  })
  it('false quando website ausente, nulo ou vazio', () => {
    expect(leadTemSite({})).toBe(false)
    expect(leadTemSite({ website: undefined })).toBe(false)
    expect(leadTemSite({ website: '   ' })).toBe(false)
  })
})

describe('montarEnriquecimento (upsert enriquece só campos vazios)', () => {
  const novo = {
    categoria: 'Padaria', endereco: 'Rua X, 123', site: 'https://p.com',
    instagram: 'https://instagram.com/p', googleNota: 4.5, googleAvaliacoes: 30,
  }

  it('preenche campo antes null com o valor novo', () => {
    const patch = montarEnriquecimento({ site: null }, novo)
    expect(patch.site).toBe('https://p.com')
  })

  it('NÃO sobrescreve campo já preenchido', () => {
    const patch = montarEnriquecimento({ site: 'https://existente.com', categoria: 'Antiga' }, novo)
    expect(patch.site).toBeUndefined()
    expect(patch.categoria).toBeUndefined()
  })

  it('trata string vazia como vazio e preenche', () => {
    const patch = montarEnriquecimento({ categoria: '   ' }, novo)
    expect(patch.categoria).toBe('Padaria')
  })

  it('retorna patch vazio quando não há nada a enriquecer', () => {
    const cheio = { ...novo }
    expect(montarEnriquecimento(cheio, novo)).toEqual({})
  })

  it('não preenche quando o valor novo também é null', () => {
    const patch = montarEnriquecimento({ googleNota: null }, { ...novo, googleNota: null })
    expect(patch.googleNota).toBeUndefined()
  })
})
