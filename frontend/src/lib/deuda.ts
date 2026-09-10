import { formatCurrency } from '../formats'

export interface DeudaParaCompartir {
  saldoPendiente: number
  fecha: string
}

function formatFecha(iso: string): string {
  return new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function buildDeudaMessage(deudas: DeudaParaCompartir[]): string {
  const lines = deudas.map(d => `-${formatCurrency(d.saldoPendiente)} ${formatFecha(d.fecha)}`)
  const total = deudas.reduce((s, d) => s + d.saldoPendiente, 0)
  return [...lines, '', `Total ${formatCurrency(total)}`].join('\n')
}
