import { describe, it, expect } from 'vitest'
import { parseNotasProspeccao } from './parse-notas-prospeccao'

describe('parseNotasProspeccao', () => {
  it('formato 1: "categoria · endereço · site"', () => {
    const r = parseNotasProspeccao('Clínica odontológica · Rua X, 123 · https://site.com')
    expect(r.categoria).toBe('Clínica odontológica')
    expect(r.endereco).toBe('Rua X, 123')
    expect(r.site).toBe('https://site.com')
    expect(r.googleNota).toBeNull()
  })

  it('formato 2: "categoria · ⭐nota · site"', () => {
    const r = parseNotasProspeccao('Clínica odontológica · ⭐ 4.5 · https://x.com')
    expect(r.categoria).toBe('Clínica odontológica')
    expect(r.googleNota).toBe(4.5)
    expect(r.site).toBe('https://x.com')
    expect(r.endereco).toBeNull()
  })

  it('extrai domínio sem http (www e .com.br)', () => {
    expect(parseNotasProspeccao('Padaria · www.padaria.com').site).toBe('www.padaria.com')
    expect(parseNotasProspeccao('Loja · loja.com.br').site).toBe('loja.com.br')
  })

  it('aceita nota com vírgula decimal', () => {
    expect(parseNotasProspeccao('Bar · ⭐ 4,7').googleNota).toBe(4.7)
  })

  it('só categoria (um token textual)', () => {
    const r = parseNotasProspeccao('Restaurante')
    expect(r.categoria).toBe('Restaurante')
    expect(r.site).toBeNull()
    expect(r.endereco).toBeNull()
    expect(r.googleNota).toBeNull()
  })

  it('reconhece logradouro como endereço', () => {
    const r = parseNotasProspeccao('Mercado · Avenida Brasil 500 · https://m.com')
    expect(r.endereco).toBe('Avenida Brasil 500')
    expect(r.categoria).toBe('Mercado')
  })

  it('retorna tudo null para vazio/nulo', () => {
    for (const v of ['', null, undefined]) {
      expect(parseNotasProspeccao(v)).toEqual({ site: null, googleNota: null, categoria: null, endereco: null })
    }
  })
})
