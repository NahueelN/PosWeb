import { open, Command } from '@tauri-apps/plugin-shell'
import type { PedidoDetailDto } from '../types'

export type WhatsAppMethod = 'desktop' | 'web'

const WHATSAPP_PREF_KEY = 'whatsappPreferido'
const WHATSAPP_RECIPIENT_KEY = 'whatsappDestinatario'

export function getWhatsAppPref(): WhatsAppMethod | null {
  try {
    const v = localStorage.getItem(WHATSAPP_PREF_KEY)
    return v === 'desktop' || v === 'web' ? v : null
  } catch {
    return null
  }
}

export function setWhatsAppPref(method: WhatsAppMethod | null): void {
  try {
    if (method) localStorage.setItem(WHATSAPP_PREF_KEY, method)
    else localStorage.removeItem(WHATSAPP_PREF_KEY)
  } catch {}
}

export function getWhatsAppRecipient(): string {
  try {
    return localStorage.getItem(WHATSAPP_RECIPIENT_KEY) ?? ''
  } catch {
    return ''
  }
}

export function setWhatsAppRecipient(phone: string): void {
  try {
    const v = phone.trim()
    if (v) localStorage.setItem(WHATSAPP_RECIPIENT_KEY, v)
    else localStorage.removeItem(WHATSAPP_RECIPIENT_KEY)
  } catch {
    // localStorage no disponible: se ignora la persistencia del destinatario
  }
}

export function normalizeWhatsAppPhone(value: string): string {
  const d = sanitizePhone(value)
  if (d.length === 0) return ''
  if (d.startsWith('549')) return `+${d}`
  if (d.startsWith('54')) return `+${d}`
  return `+549${d}`
}

export function sanitizePhone(phone: string): string {
  return phone.replace(/[^\d]/g, '')
}

export function buildWhatsAppUrl(phone: string, message: string): string {
  const clean = sanitizePhone(phone)
  return `https://web.whatsapp.com/send?phone=${clean}&text=${encodeURIComponent(message)}`
}

export function buildWhatsAppDesktopUrl(phone: string, message: string): string {
  const clean = sanitizePhone(phone)
  return `whatsapp://send?phone=${clean}&text=${encodeURIComponent(message)}`
}

export function buildPedidoWhatsAppMessage(pedido: PedidoDetailDto): string {
  const lines: string[] = []
  lines.push('Pedido')
  pedido.items.forEach((item) => {
    lines.push(`• ${item.productoNombre} × ${item.cantidadPedida}`)
  })
  return lines.join('\n')
}

export async function isWhatsAppDesktopInstalled(): Promise<boolean> {
  if (typeof window === 'undefined' || !('__TAURI_INTERNALS__' in window)) return false
  try {
    const output = await Command.create('reg', ['query', 'HKCR\\whatsapp\\shell\\open\\command']).execute()
    return output.code === 0
  } catch {
    return false
  }
}

export async function openWhatsAppTo(phone: string, message: string, method: WhatsAppMethod = 'web'): Promise<void> {
  if (method === 'desktop') {
    const instalado = await isWhatsAppDesktopInstalled()
    if (instalado) {
      const desktopUrl = buildWhatsAppDesktopUrl(phone, message)
      try {
        await open(desktopUrl)
        return
      } catch {
        // si el open falla, seguimos con la web
      }
    }
  }

  const webUrl = buildWhatsAppUrl(phone, message)
  try {
    await open(webUrl)
  } catch {
    window.open(webUrl, '_blank')
  }
}

export async function openWhatsApp(pedido: PedidoDetailDto, method: WhatsAppMethod = 'web'): Promise<void> {
  const phone = pedido.proveedorTelefono?.trim()
  if (!phone) return
  await openWhatsAppTo(phone, buildPedidoWhatsAppMessage(pedido), method)
}
