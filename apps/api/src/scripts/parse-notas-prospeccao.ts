// Função PURA de parsing do campo `Contato.notas` dos leads de prospecção antigos.
//
// Antes do PR #17 os dados ricos ficavam concatenados com ` · ` no campo texto `notas`,
// em dois formatos históricos:
//   1) "categoria · endereço · site"   ex.: "Clínica odontológica · Rua X, 123 · https://site.com"
//   2) "categoria · ⭐nota · site"      ex.: "Clínica odontológica · ⭐ 4.5 · https://x.com"
//
// O objetivo do backfill é robusto para `site` e `googleNota` (identificáveis sem ambiguidade)
// e best-effort para `categoria`/`endereco` — quando ambíguo, deixa null (não chuta).

export interface NotasParse {
  site: string | null
  googleNota: number | null
  categoria: string | null
  endereco: string | null
}

// Token parece uma URL/domínio (site). Exclui e-mails (contato@x.com viraria "site").
function ehUrl(t: string): boolean {
  if (t.includes('@')) return false
  if (/^https?:\/\//i.test(t)) return true
  if (/^www\./i.test(t)) return true
  // domínio.tld genérico (2+ letras no TLD): cobre .com, .com.br, .ai, .digital, .store, etc.
  return /\b[a-z0-9-]+\.[a-z]{2,}(\.[a-z]{2,})?(\/|$)/i.test(t)
}

// Token parece um endereço (logradouro ou "algo com número e vírgula")
function ehEndereco(t: string): boolean {
  if (/^(rua|r\.|av|av\.|avenida|alameda|al\.|travessa|rod|rodovia|estrada|praça|praca|quadra|lote)\b/i.test(t)) {
    return true
  }
  return /\d/.test(t) && /,/.test(t)
}

// Extrai a nota do Google de um token iniciado por ⭐ (aceita vírgula ou ponto decimal)
function extrairNota(t: string): number | null {
  const m = t.match(/(\d+(?:[.,]\d+)?)/)
  if (!m) return null
  const n = Number(m[1].replace(',', '.'))
  return Number.isFinite(n) ? n : null
}

export function parseNotasProspeccao(notas: string | null | undefined): NotasParse {
  const vazio: NotasParse = { site: null, googleNota: null, categoria: null, endereco: null }
  if (!notas) return vazio

  const tokens = notas.split('·').map(t => t.trim()).filter(Boolean)
  if (tokens.length === 0) return vazio

  const site = tokens.find(ehUrl) ?? null

  const tokenNota = tokens.find(t => t.startsWith('⭐'))
  const googleNota = tokenNota ? extrairNota(tokenNota) : null

  // Sobra: nem site, nem nota — candidatos a categoria/endereço
  const resto = tokens.filter(t => !ehUrl(t) && !t.startsWith('⭐'))
  const tokenEndereco = resto.find(ehEndereco) ?? null
  const categoria = resto.find(t => t !== tokenEndereco) ?? null

  return { site, googleNota, categoria, endereco: tokenEndereco }
}
