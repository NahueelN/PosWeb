import { open } from '@tauri-apps/plugin-shell'
import type { PedidoDetailDto } from '../types'

export function sanitizePhone(phone: string): string {
  return phone.replace(/[^\d]/g, '')
}

export function buildWhatsAppUrl(phone: string, message: string): string {
  const clean = sanitizePhone(phone)
  return `https://web.whatsapp.com/send?phone=${clean}&text=${encodeURIComponent(message)}`
}

export function buildPedidoWhatsAppMessage(pedido: PedidoDetailDto): string {
  const lines: string[] = []
  lines.push('Pedido')
  pedido.items.forEach((item) => {
    lines.push(`• ${item.productoNombre} × ${item.cantidadPedida}`)
  })
  return lines.join('\n')
}

export async function openWhatsApp(pedido: PedidoDetailDto): Promise<void> {
  const phone = pedido.proveedorTelefono?.trim()
  if (!phone) return
  const url = buildWhatsAppUrl(phone, buildPedidoWhatsAppMessage(pedido))
  try {
    await open(url)
  } catch {
    window.open(url, '_blank')
  }
}