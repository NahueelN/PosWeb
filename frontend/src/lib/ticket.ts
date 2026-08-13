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
  ventaId: number
  fecha: string
  vendedor?: string
  items: TicketItem[]
  total: number
  pagos: { nombre: string }[]
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

function buildLine(width: TicketWidth): { line: string; dline: string } {
  const cols = TICKET_COLS[width]
  return { line: '─'.repeat(cols), dline: '═'.repeat(cols) }
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

  push(data.empresaNombre ?? 'PosWeb', { bold: true, center: true, size: 'md' })
  push('TICKET DE COMPRA', { bold: true, center: true })
  push('')
  push(`Fecha: ${fmtFecha(data.fecha)}`)
  push(`Ticket #: ${String(data.ventaId).padStart(6, '0')}`)
  push(`Vendedor: ${data.vendedor ?? '—'}`)
  push(line)

  data.items.forEach(item => {
    const name = item.nombre.length > nameMax ? item.nombre.slice(0, nameMax - 3) + '...' : item.nombre
    push(`${String(item.cantidad).padStart(2)}   ${name}`)
    push(LR(padFmt(item.precio) + ' c/u', padFmt(item.precio * item.cantidad)))
  })

  push(line)
  push(`Artículos: ${data.items.reduce((s, i) => s + i.cantidad, 0)}`)
  push(dline)
  push(LR('TOTAL', padFmt(data.total)), { bold: true, size: 'lg', space: true })
  push(dline)

  data.pagos.forEach(p => push(LR('Pago:', p.nombre.toUpperCase())))
  if (data.cambio > 0) {
    push(LR('Pagó:', padFmt(data.total + data.cambio)))
    push(LR('Cambio:', padFmt(data.cambio)))
  }
  push('')
  push('¡GRACIAS POR SU COMPRA!', { bold: true, center: true, space: true })
  push('NO VÁLIDO COMO FACTURA', { center: true, size: 'sm' })

  return entries
}
