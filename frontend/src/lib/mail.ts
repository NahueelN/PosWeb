import { open } from '@tauri-apps/plugin-shell'
import type { PedidoDetailDto } from '../types'
import { buildPedidoWhatsAppMessage } from './whatsapp'

export type MailMethod = 'mailto' | 'gmail'

const MAIL_PREF_KEY = 'mailPreferido'
const MAIL_RECIPIENT_KEY = 'mailDestinatario'

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

export function getMailRecipient(): string {
  try {
    return localStorage.getItem(MAIL_RECIPIENT_KEY) ?? ''
  } catch {
    return ''
  }
}

export function setMailRecipient(email: string): void {
  try {
    const v = email.trim()
    if (v) localStorage.setItem(MAIL_RECIPIENT_KEY, v)
    else localStorage.removeItem(MAIL_RECIPIENT_KEY)
  } catch {
    // localStorage no disponible: se ignora la persistencia del destinatario
  }
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

export function buildMailtoUrl(email: string, subject: string, body: string): string {
  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}

export function buildGmailUrl(email: string, subject: string, body: string): string {
  return `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}

export async function openEmailTo(email: string, subject: string, body: string, method: MailMethod = 'mailto'): Promise<void> {
  const url = method === 'gmail'
    ? buildGmailUrl(email, subject, body)
    : buildMailtoUrl(email, subject, body)
  try {
    await open(url)
  } catch {
    window.open(url, '_blank')
  }
}

export async function openEmail(pedido: PedidoDetailDto, method: MailMethod = 'mailto'): Promise<void> {
  const email = pedido.proveedorMail?.trim()
  if (!email) return
  await openEmailTo(email, `Pedido #${pedido.id}`, buildPedidoWhatsAppMessage(pedido), method)
}
