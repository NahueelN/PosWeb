import { useEffect, useRef, useState } from 'react'
import { Mail, Share2, MessageCircle, Globe } from 'lucide-react'
import {
  getMailPref,
  setMailPref,
  openEmailTo,
  getMailRecipient,
  setMailRecipient,
  isValidEmail,
  type MailMethod,
} from '../lib/mail'
import {
  getWhatsAppPref,
  setWhatsAppPref,
  openWhatsAppTo,
  getWhatsAppRecipient,
  setWhatsAppRecipient,
  normalizeWhatsAppPhone,
  sanitizePhone,
  type WhatsAppMethod,
} from '../lib/whatsapp'

interface CompartirMenuProps {
  mail?: string | null
  telefono?: string | null
  mailSubject: string
  mensaje: string
  destinatarioManual?: boolean
  className?: string
  buttonClassName?: string
  dropdownUp?: boolean
  onOpenChange?: (open: boolean) => void
}

export default function CompartirMenu({
  mail,
  telefono,
  mailSubject,
  mensaje,
  destinatarioManual = false,
  className = 'relative flex-1',
  buttonClassName = 'w-full py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2',
  dropdownUp = true,
  onOpenChange,
}: CompartirMenuProps) {
  const [showShare, setShowShare] = useState(false)
  const shareRef = useRef<HTMLDivElement>(null)
  const [mailModalOpen, setMailModalOpen] = useState(false)
  const [mailRecordar, setMailRecordar] = useState(false)
  const [whatsappModalOpen, setWhatsappModalOpen] = useState(false)
  const [whatsappRecordar, setWhatsappRecordar] = useState(false)
  const [manualCanal, setManualCanal] = useState<'mail' | 'whatsapp' | null>(null)
  const [destinatarioValor, setDestinatarioValor] = useState('')
  const [destinatarioError, setDestinatarioError] = useState(false)
  const manualMethod = useRef<MailMethod | WhatsAppMethod>('mailto')
  const destinatarioRef = useRef<HTMLInputElement>(null)

  const puedeMail = destinatarioManual || !!mail
  const puedeWhatsApp = destinatarioManual || !!telefono

  useEffect(() => {
    onOpenChange?.(mailModalOpen || whatsappModalOpen || manualCanal !== null)
  }, [mailModalOpen, whatsappModalOpen, manualCanal, onOpenChange])

  useEffect(() => {
    if (manualCanal) requestAnimationFrame(() => destinatarioRef.current?.focus())
  }, [manualCanal])

  const abrirManual = (canal: 'mail' | 'whatsapp', method: MailMethod | WhatsAppMethod) => {
    manualMethod.current = method
    setDestinatarioValor(canal === 'whatsapp' ? getWhatsAppRecipient() : getMailRecipient())
    setDestinatarioError(false)
    setManualCanal(canal)
  }

  const ejecutarMail = (method: MailMethod) => {
    const email = mail?.trim()
    if (email) {
      void openEmailTo(email, mailSubject, mensaje, method)
      return
    }
    if (destinatarioManual) abrirManual('mail', method)
  }

  const ejecutarWhatsApp = (method: WhatsAppMethod) => {
    const phone = telefono?.trim()
    if (phone) {
      void openWhatsAppTo(phone, mensaje, method)
      return
    }
    if (destinatarioManual) abrirManual('whatsapp', method)
  }

  const openMail = () => {
    setShowShare(false)
    const pref = getMailPref()
    if (pref && puedeMail) {
      ejecutarMail(pref)
      return
    }
    setMailRecordar(false)
    setMailModalOpen(true)
  }

  const elegirMail = (method: MailMethod) => {
    setMailPref(mailRecordar ? method : null)
    setMailModalOpen(false)
    if (puedeMail) ejecutarMail(method)
  }

  const openWhatsApp = () => {
    setShowShare(false)
    const pref = getWhatsAppPref()
    if (pref && puedeWhatsApp) {
      ejecutarWhatsApp(pref)
      return
    }
    setWhatsappRecordar(false)
    setWhatsappModalOpen(true)
  }

  const elegirWhatsApp = (method: WhatsAppMethod) => {
    setWhatsAppPref(whatsappRecordar ? method : null)
    setWhatsappModalOpen(false)
    if (puedeWhatsApp) ejecutarWhatsApp(method)
  }

  const confirmarDestinatario = () => {
    if (manualCanal === 'whatsapp') {
      const phone = normalizeWhatsAppPhone(destinatarioValor)
      if (sanitizePhone(phone).length < 8) {
        setDestinatarioError(true)
        return
      }
      setWhatsAppRecipient(phone)
      setManualCanal(null)
      void openWhatsAppTo(phone, mensaje, manualMethod.current as WhatsAppMethod)
      return
    }
    if (manualCanal === 'mail') {
      const email = destinatarioValor.trim()
      if (!isValidEmail(email)) {
        setDestinatarioError(true)
        return
      }
      setMailRecipient(email)
      setManualCanal(null)
      void openEmailTo(email, mailSubject, mensaje, manualMethod.current as MailMethod)
    }
  }

  useEffect(() => {
    if (!mailModalOpen && !whatsappModalOpen && !manualCanal) return
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (mailModalOpen) setMailModalOpen(false)
      else if (whatsappModalOpen) setWhatsappModalOpen(false)
      else if (manualCanal) setManualCanal(null)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [mailModalOpen, whatsappModalOpen, manualCanal])

  useEffect(() => {
    if (!showShare) return
    const handler = (e: MouseEvent) => {
      if (shareRef.current && !shareRef.current.contains(e.target as Node)) {
        setShowShare(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showShare])

  return (
    <>
      <div ref={shareRef} className={className}>
        <button onClick={() => setShowShare(v => !v)} className={buttonClassName}>
          <Share2 size={16} />
          Compartir
        </button>
        {showShare && (
          <div className={`absolute ${dropdownUp ? 'bottom-full mb-1' : 'top-full mt-1'} right-0 min-w-[220px] bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-10`}>
            <span className="block" title={!puedeMail ? 'Falta correo electrónico' : undefined}>
              <button onClick={openMail} disabled={!puedeMail}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                <Mail size={16} className="text-gray-400" />
                Enviar por mail
              </button>
            </span>
            <span className="block" title={!puedeWhatsApp ? 'Falta número de celular' : undefined}>
              <button onClick={openWhatsApp} disabled={!puedeWhatsApp}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed border-t border-gray-100">
                <MessageCircle size={16} className="text-gray-400" />
                Compartir por WhatsApp
              </button>
            </span>
          </div>
        )}
      </div>

      {mailModalOpen && (
        <div className="fixed inset-0 bg-black/30 z-[60] flex items-center justify-center p-4" onClick={() => setMailModalOpen(false)}>
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between mb-1">
              <h3 className="text-lg font-bold text-gray-900">Compartir por mail</h3>
              <button onClick={() => setMailModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <p className="text-sm text-gray-500 mb-4">¿Cómo querés abrir el correo?</p>
            <div className="space-y-2">
              <button onClick={() => elegirMail('mailto')}
                className="w-full flex items-center gap-3 px-4 py-3 border border-gray-200 rounded-xl transition-colors hover:border-indigo-300 hover:bg-gray-50">
                <Mail size={18} className="text-indigo-600 shrink-0" />
                <span className="flex-1 text-left">
                  <span className="block font-medium text-gray-900 text-sm">Outlook</span>
                  <span className="block text-xs text-gray-400">Abre con mailto</span>
                </span>
              </button>
              <button onClick={() => elegirMail('gmail')}
                className="w-full flex items-center gap-3 px-4 py-3 border border-gray-200 rounded-xl transition-colors hover:border-indigo-300 hover:bg-gray-50">
                <Globe size={18} className="text-indigo-600 shrink-0" />
                <span className="flex-1 text-left">
                  <span className="block font-medium text-gray-900 text-sm">Navegador (Gmail)</span>
                  <span className="block text-xs text-gray-400">Abre en Gmail web</span>
                </span>
              </button>
            </div>
            <label className="flex items-center gap-2 mt-4 text-sm text-gray-600 cursor-pointer select-none">
              <input type="checkbox" checked={mailRecordar} onChange={e => setMailRecordar(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
              Guardar como opción predeterminada
            </label>
          </div>
        </div>
      )}

      {whatsappModalOpen && (
        <div className="fixed inset-0 bg-black/30 z-[60] flex items-center justify-center p-4" onClick={() => setWhatsappModalOpen(false)}>
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between mb-1">
              <h3 className="text-lg font-bold text-gray-900">Compartir por WhatsApp</h3>
              <button onClick={() => setWhatsappModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <p className="text-sm text-gray-500 mb-4">¿Cómo querés abrir WhatsApp?</p>
            <div className="space-y-2">
              <button onClick={() => elegirWhatsApp('desktop')}
                className="w-full flex items-center gap-3 px-4 py-3 border border-gray-200 rounded-xl transition-colors hover:border-indigo-300 hover:bg-gray-50">
                <MessageCircle size={18} className="text-indigo-600 shrink-0" />
                <span className="flex-1 text-left">
                  <span className="block font-medium text-gray-900 text-sm">Escritorio</span>
                  <span className="block text-xs text-gray-400">WhatsApp Desktop</span>
                </span>
              </button>
              <button onClick={() => elegirWhatsApp('web')}
                className="w-full flex items-center gap-3 px-4 py-3 border border-gray-200 rounded-xl transition-colors hover:border-indigo-300 hover:bg-gray-50">
                <Globe size={18} className="text-indigo-600 shrink-0" />
                <span className="flex-1 text-left">
                  <span className="block font-medium text-gray-900 text-sm">Navegador</span>
                  <span className="block text-xs text-gray-400">WhatsApp Web</span>
                </span>
              </button>
            </div>
            <label className="flex items-center gap-2 mt-4 text-sm text-gray-600 cursor-pointer select-none">
              <input type="checkbox" checked={whatsappRecordar} onChange={e => setWhatsappRecordar(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
              Guardar como opción predeterminada
            </label>
          </div>
        </div>
      )}

      {manualCanal && (
        <div className="fixed inset-0 bg-black/30 z-[60] flex items-center justify-center p-4" onClick={() => setManualCanal(null)}>
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between mb-1">
              <h3 className="text-lg font-bold text-gray-900">
                {manualCanal === 'whatsapp' ? 'Compartir por WhatsApp' : 'Compartir por mail'}
              </h3>
              <button onClick={() => setManualCanal(null)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              {manualCanal === 'whatsapp'
                ? 'Ingresá el número al que querés enviar.'
                : 'Ingresá el correo al que querés enviar.'}
            </p>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              {manualCanal === 'whatsapp' ? 'Número de WhatsApp' : 'Correo electrónico'}
            </label>
            <input
              ref={destinatarioRef}
              type={manualCanal === 'whatsapp' ? 'tel' : 'email'}
              inputMode={manualCanal === 'whatsapp' ? 'tel' : 'email'}
              value={destinatarioValor}
              onChange={e => { setDestinatarioValor(e.target.value); setDestinatarioError(false) }}
              onKeyDown={e => {
                if (e.key === 'Enter') confirmarDestinatario()
                if (e.key === 'Escape') setManualCanal(null)
              }}
              placeholder={manualCanal === 'whatsapp' ? '351 1234-5678' : 'nombre@ejemplo.com'}
              className={`w-full px-3 py-2.5 border rounded-xl text-sm outline-none transition-all focus:ring-2 ${
                destinatarioError
                  ? 'border-red-400 bg-red-50 focus:ring-red-500/20 focus:border-red-500'
                  : 'border-gray-300 focus:ring-[var(--color-primary-ring)] focus:border-[var(--color-primary)]'
              }`}
            />
            {destinatarioError && (
              <p className="text-xs text-red-500 mt-1">
                {manualCanal === 'whatsapp' ? 'Ingresá un número válido.' : 'Ingresá un correo válido.'}
              </p>
            )}
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setManualCanal(null)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors">
                Cancelar
              </button>
              <button onClick={confirmarDestinatario}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors">
                Enviar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
