import type { CajaDto, EnvioCierreCajaConfig } from '../types'
import { formatCurrency, formatDate } from '../formats'
import { sanitizePhone } from './whatsapp'

export const ENVIO_CIERRE_SUBJECT = 'Cierre de caja'

export function normalizarTelefonoWhatsApp(v: string): string {
  const d = sanitizePhone(v)
  if (d.length === 0) return ''
  if (d.startsWith('549')) return `+${d}`
  if (d.startsWith('54')) return `+${d}`
  return `+549${d}`
}

export function normalizarEnvioCierre(pref: unknown): EnvioCierreCajaConfig {
  const p = (pref ?? {}) as Record<string, any>
  const wa = (p.whatsapp ?? {}) as Record<string, any>
  const em = (p.email ?? {}) as Record<string, any>
  return {
    envioAutomatico: Boolean(p.envioAutomatico),
    whatsapp: {
      habilitado: Boolean(wa.habilitado),
      destinatarios: Array.isArray(wa.destinatarios)
        ? wa.destinatarios.filter((x: unknown): x is string => typeof x === 'string' && x.trim() !== '')
        : [],
    },
    email: {
      habilitado: Boolean(em.habilitado),
      destinatarios: Array.isArray(em.destinatarios)
        ? em.destinatarios.filter((x: unknown): x is string => typeof x === 'string' && x.trim() !== '')
        : [],
    },
  }
}

export function buildCierreCajaMessage(caja: CajaDto): string {
  const lineas: string[] = []
  lineas.push('CIERRE DE CAJA')
  lineas.push('')
  lineas.push(`Fecha apertura: ${formatDate(caja.fechaApertura)}`)
  if (caja.fechaCierre) lineas.push(`Fecha cierre: ${formatDate(caja.fechaCierre)}`)
  lineas.push(`Cajero: ${caja.usuarioCierre ?? caja.usuarioApertura}`)
  lineas.push('')
  lineas.push(`Saldo inicial: ${formatCurrency(caja.montoInicial)}`)
  lineas.push(`Total vendido: ${formatCurrency(caja.totalVentas)}`)
  lineas.push(`Gastos: ${formatCurrency(caja.gastos)}`)
  lineas.push(`Saldo final: ${formatCurrency(caja.esperado)}`)
  if (caja.desglosePagos.length > 0) {
    lineas.push('')
    lineas.push('Desglose por medio de pago:')
    caja.desglosePagos.forEach(p => lineas.push(`• ${p.medioPago}: ${formatCurrency(p.monto)}`))
  }
  lineas.push('')
  if (caja.montoContadoEfectivo != null) lineas.push(`Efectivo contado: ${formatCurrency(caja.montoContadoEfectivo)}`)
  if (caja.montoContadoTarjetas != null) lineas.push(`Tarjetas contadas: ${formatCurrency(caja.montoContadoTarjetas)}`)
  if (caja.diferencia != null) lineas.push(`Diferencia de caja: ${formatCurrency(caja.diferencia)}`)
  return lineas.join('\n')
}