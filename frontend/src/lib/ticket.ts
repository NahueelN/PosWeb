import type { CajaDto } from '../types'

export type TicketWidth = 58 | 80

export interface TicketLine {
  text: string
  bold?: boolean
  center?: boolean
  size?: 'sm' | 'md' | 'lg'
  space?: boolean
}

export interface TicketItem {
  nombre: string
  cantidad: number
  precio: number
}

export interface TicketData {
  empresaNombre?: string
  empresaDireccion?: string
  empresaDocumento?: string
  empresaTelefono?: string
  mostrarTelefonoTicket?: boolean
  ventaId: number
  fecha: string
  vendedor?: string
  mesa?: string
  items: TicketItem[]
  total: number
  pagos: { nombre: string; monto?: number }[]
  cambio: number
}

export const TICKET_COLS: Record<TicketWidth, number> = { 80: 40, 58: 32 }
export const TICKET_PRICE_W: Record<TicketWidth, number> = { 80: 14, 58: 12 }
export const TICKET_NAME_MAX: Record<TicketWidth, number> = { 80: 26, 58: 20 }
export const TICKET_DPI: Record<TicketWidth, number> = { 80: 203, 58: 203 }

export function fmtPeso(n: number): string {
  return '$' + n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function fmtFecha(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('es-AR') + ' ' + d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
}

function fmtHoraCorta(iso: string): string {
  return new Date(iso).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
}

function buildLine(width: TicketWidth): { line: string; dline: string } {
  const cols = TICKET_COLS[width]
  return { line: '─'.repeat(cols), dline: '═'.repeat(cols) }
}

export function wrapText(text: string, maxWidth: number): string[] {
  if (maxWidth <= 0) return [text]
  const words = text.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return ['']

  const lines: string[] = []
  let current = ''

  for (const word of words) {
    let rest = word
    while (rest.length > maxWidth) {
      if (current) { lines.push(current); current = '' }
      lines.push(rest.slice(0, maxWidth))
      rest = rest.slice(maxWidth)
    }
    if (!current) current = rest
    else if (current.length + 1 + rest.length <= maxWidth) current += ' ' + rest
    else { lines.push(current); current = rest }
  }

  if (current) lines.push(current)
  return lines
}

export function buildTicketLines(data: TicketData, width: TicketWidth): TicketLine[] {
  const cols = TICKET_COLS[width]
  const priceW = TICKET_PRICE_W[width]
  const nameMax = TICKET_NAME_MAX[width]
  const { line, dline } = buildLine(width)

  const padFmt = (n: number) => fmtPeso(n).padStart(priceW)
  const LR = (left: string, right: string) => {
    const avail = cols - left.length
    return left + (avail > 0 ? right.padStart(avail) : ' ' + right)
  }

  const entries: TicketLine[] = []
  const push = (text: string, opts: { bold?: boolean; center?: boolean; size?: 'sm' | 'md' | 'lg'; space?: boolean } = {}) =>
    entries.push({ text, bold: opts.bold ?? false, center: opts.center ?? false, size: opts.size, space: opts.space })

  push(data.empresaNombre ?? 'Vendeto', { bold: true, center: true, size: 'md' })
  if (data.empresaDireccion) push(data.empresaDireccion, { center: true })
  if (data.mostrarTelefonoTicket && data.empresaTelefono) push(`Tel: ${data.empresaTelefono}`, { center: true })
  push('TICKET DE COMPRA', { bold: true, center: true, space: true })
  push(line)
  push(fmtFecha(data.fecha))
  push(`Ticket N° ${String(data.ventaId).padStart(6, '0')}`)
  if (data.mesa) push(`MESA ${data.mesa}`, { bold: true })
  push(`Vendedor: ${data.vendedor ?? '—'}`)
  push(line)

  data.items.forEach(item => {
    wrapText(item.nombre, nameMax).forEach(linea => push(linea))
    push(LR(`${item.cantidad} x ${fmtPeso(item.precio)}`, padFmt(item.precio * item.cantidad)))
  })

  push(line)
  push(`${data.items.reduce((s, i) => s + i.cantidad, 0)} artículos`)
  push(line)
  push(LR('TOTAL', padFmt(data.total)), { bold: true, size: 'lg', space: true })
  push(dline)

  data.pagos.forEach(p => push(LR('Forma de pago:', p.nombre.toUpperCase())))
  if (data.cambio > 0) {
    push(LR('Pagó:', padFmt(data.total + data.cambio)))
    push(LR('Cambio:', padFmt(data.cambio)))
  }
  push('')
  push(line)
  push('¡GRACIAS POR SU COMPRA!', { bold: true, center: true, space: true })
  push('NO VÁLIDO COMO FACTURA', { center: true, size: 'sm' })
  push('')
  push('Vendeto~'.padStart(cols), { bold: true, size: 'sm' })

  return entries
}

export function buildCierreTicketLines(caja: CajaDto, width: TicketWidth): TicketLine[] {
  const cols = TICKET_COLS[width]
  const priceW = TICKET_PRICE_W[width]
  const { line, dline } = buildLine(width)

  const padFmt = (n: number) => fmtPeso(n).padStart(priceW)
  const signedFmt = (n: number) => ((n >= 0 ? '+' : '-') + fmtPeso(Math.abs(n))).padStart(priceW)
  const LR = (left: string, right: string) => {
    const avail = cols - left.length
    return left + (avail > 0 ? right.padStart(avail) : ' ' + right)
  }

  const entries: TicketLine[] = []
  const push = (text: string, opts: { bold?: boolean; center?: boolean; size?: 'sm' | 'md' | 'lg'; space?: boolean } = {}) =>
    entries.push({ text, bold: opts.bold ?? false, center: opts.center ?? false, size: opts.size, space: opts.space })

  push('CIERRE DE CAJA', { bold: true, center: true, size: 'md' })
  push(line)
  push(fmtFecha(caja.fechaCierre ?? caja.fechaApertura))
  push(LR('Apertura:', fmtHoraCorta(caja.fechaApertura)))
  if (caja.fechaCierre) push(LR('Cierre:', fmtHoraCorta(caja.fechaCierre)))
  push(LR('Usuario:', caja.usuarioCierre ?? caja.usuarioApertura ?? '—'))
  push(line)

  push(LR('Saldo inicial', padFmt(caja.montoInicial)))
  push(LR('Ventas', padFmt(caja.totalVentas)))
  push(LR('Gastos', caja.gastos > 0 ? ('-' + fmtPeso(caja.gastos)).padStart(priceW) : padFmt(0)))
  push(dline)
  push(LR('GANANCIA', padFmt(caja.totalVentas - caja.gastos)), { bold: true, size: 'lg', space: true })
  push(dline)

  const pagos = caja.desglosePagos ?? []
  if (pagos.length > 0) {
    push('MEDIOS DE PAGO', { bold: true, center: true, space: true })
    pagos.forEach(p => push(LR(p.medioPago, padFmt(p.monto))))
    push(line)
  }

  if (caja.montoContadoEfectivo != null) {
    const efectivoVentas = pagos.find(p => p.medioPago.toLowerCase().includes('efectivo'))?.monto ?? 0
    const esperado = caja.montoInicial + efectivoVentas - caja.gastos
    push('CONTEO DE EFECTIVO', { bold: true, center: true, space: true })
    push(LR('Esperado', padFmt(esperado)))
    push(LR('Contado', padFmt(caja.montoContadoEfectivo)))
    push(LR('Diferencia de caja', signedFmt(caja.montoContadoEfectivo - esperado)))
    push(line)
  }

  push('')
  push('FIN DEL CIERRE', { bold: true, center: true, size: 'sm' })

  return entries
}
