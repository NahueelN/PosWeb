import { open } from '@tauri-apps/plugin-shell'
import type { PedidoDetailDto } from '../types'
import { buildPedidoWhatsAppMessage } from './whatsapp'

export type MailMethod = 'mailto' | 'gmail'

const MAIL_PREF_KEY = 'mailPreferido'

export function getMailPref(): MailMethod | null {
  try {
    const v = localStorage.getItem(MAIL_PREF_KEY)
    return v === 'mailto' || v === 'gmail' ? v : null
  } catch {
    return null
  }
}

export function setMailPref(method: MailMethod | null): void {
  try {
    if (method) localStorage.setItem(MAIL_PREF_KEY, method)
    else localStorage.removeItem(MAIL_PREF_KEY)
  } catch {}
}

export function buildMailtoUrl(email: string, subject: string, body: string): string {
  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}

export function buildGmailUrl(email: string, subject: string, body: string): string {
  return `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}

export async function openEmail(pedido: PedidoDetailDto, method: MailMethod = 'mailto'): Promise<void> {
  const email = pedido.proveedorMail?.trim()
  if (!email) return
  const subject = `Pedido #${pedido.id}`
  const body = buildPedidoWhatsAppMessage(pedido)
  const url = method === 'gmail'
    ? buildGmailUrl(email, subject, body)
    : buildMailtoUrl(email, subject, body)
  try {
    await open(url)
  } catch {
    window.open(url, '_blank')
  }
}
