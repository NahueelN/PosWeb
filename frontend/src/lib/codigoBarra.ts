export function normalizarCodigoBarra(codigo: string): string {
  const valor = (codigo ?? '').trim()
  if (valor.length > 0 && /^\d+$/.test(valor)) {
    return valor.padStart(13, '0')
  }
  return valor
}
