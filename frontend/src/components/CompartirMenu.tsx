import { useEffect, useRef, useState } from 'react'
import { Mail, Share2, MessageCircle, Globe } from 'lucide-react'
import { getMailPref, setMailPref, openEmailTo, type MailMethod } from '../lib/mail'
import { getWhatsAppPref, setWhatsAppPref, openWhatsAppTo, type WhatsAppMethod } from '../lib/whatsapp'

interface CompartirMenuProps {
  mail?: string | null
  telefono?: string | null
  mailSubject: string
  mensaje: string
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

  useEffect(() => {
    onOpenChange?.(mailModalOpen || whatsappModalOpen)
  }, [mailModalOpen, whatsappModalOpen, onOpenChange])

  const openMail = () => {
    setShowShare(false)
    const pref = getMailPref()
    if (pref && mail) {
      openEmailTo(mail, mailSubject, mensaje, pref)
      return
    }
    setMailRecordar(false)
    setMailModalOpen(true)
  }

  const elegirMail = (method: MailMethod) => {
    setMailPref(mailRecordar ? method : null)
    setMailModalOpen(false)
    if (mail) openEmailTo(mail, mailSubject, mensaje, method)
  }

  const openWhatsAppShare = () => {
    setShowShare(false)
    const pref = getWhatsAppPref()
    if (pref && telefono) {
      openWhatsAppTo(telefono, mensaje, pref)
      return
    }
    setWhatsappRecordar(false)
    setWhatsappModalOpen(true)
  }

  const elegirWhatsApp = (method: WhatsAppMethod) => {
    setWhatsAppPref(whatsappRecordar ? method : null)
    setWhatsappModalOpen(false)
    if (telefono) openWhatsAppTo(telefono, mensaje, method)
  }

  useEffect(() => {
    if (!mailModalOpen && !whatsappModalOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (mailModalOpen) setMailModalOpen(false)
      else if (whatsappModalOpen) setWhatsappModalOpen(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [mailModalOpen, whatsappModalOpen])

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
            <button onClick={openMail} disabled={!mail}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
              <Mail size={16} className="text-gray-400" />
              Enviar por mail
            </button>
            <button onClick={openWhatsAppShare} disabled={!telefono}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed border-t border-gray-100">
              <MessageCircle size={16} className="text-gray-400" />
              Compartir por WhatsApp
            </button>
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
    </>
  )
}
