export function normalizarCodigoBarra(codigo: string): string {
  const valor = (codigo ?? '').trim()
  if (valor.length > 0 && /^\d+$/.test(valor)) {
    return valor.padStart(13, '0')
  }
  return valor
}

/**
 * Indica si un código tiene la forma de un código de barras completo (GTIN/EAN/UPC):
 * numérico, con largo 8, 12, 13 o 14 y dígito verificador válido.
 * Sirve para no consultar APIs con códigos parciales mientras se escribe/pega.
 */
export function esCodigoBarraCompleto(codigo: string): boolean {
  const valor = (codigo ?? '').trim()
  if (!/^\d+$/.test(valor)) return false
  if (![8, 12, 13, 14].includes(valor.length)) return false
  const digits = valor.split('').map(Number)
  const check = digits.pop()!
  const total = digits
    .reverse()
    .reduce((sum, digit, index) => sum + digit * (index % 2 === 0 ? 3 : 1), 0)
  return (10 - (total % 10)) % 10 === check
}
