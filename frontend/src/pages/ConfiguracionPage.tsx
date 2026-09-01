import { useCallback, useEffect, useState } from 'react'
import { api } from '../api/client'
import { useNotification } from '../context/NotificationContext'
import type { EmpresaDto } from '../types'
import { getMailPref, setMailPref as persistMailPref, type MailMethod } from '../lib/mail'
import { getWhatsAppPref, setWhatsAppPref as persistWhatsAppPref, type WhatsAppMethod } from '../lib/whatsapp'

export default function ConfiguracionPage() {
  const { notifyError, notifySuccess } = useNotification()

  const [empresa, setEmpresa] = useState<EmpresaDto | null>(null)
  const [empresaNombre, setEmpresaNombre] = useState('')
  const [empresaDireccion, setEmpresaDireccion] = useState('')
  const [empresaTelefono, setEmpresaTelefono] = useState('')
  const [mostrarTelefonoTicket, setMostrarTelefonoTicket] = useState(false)
  const [empresaDoc, setEmpresaDoc] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [mailPref, setMailPref] = useState<MailMethod | ''>(getMailPref() ?? '')
  const [whatsappPref, setWhatsappPref] = useState<WhatsAppMethod | ''>(getWhatsAppPref() ?? '')

  const datosEmpresa = useCallback(() => ({
    nombre: empresaNombre.trim(),
    direccion: empresaDireccion.trim(),
    telefono: empresaTelefono.trim(),
    mostrarTelefonoTicket,
    documento: empresaDoc.trim(),
  }), [empresaNombre, empresaDireccion, empresaTelefono, mostrarTelefonoTicket, empresaDoc])

  useEffect(() => {
    setLoading(true)
    api.empresas.obtener()
      .then(e => {
        setEmpresa(e)
        setEmpresaNombre(e.nombre)
        setEmpresaDireccion(e.direccion ?? '')
        setEmpresaTelefono(e.telefono ?? '')
        setMostrarTelefonoTicket(e.mostrarTelefonoTicket ?? false)
        setEmpresaDoc(e.documento)
      })
      .catch(() => notifyError('Error al cargar empresa'))
      .finally(() => setLoading(false))
  }, [])

  const guardarEmpresa = useCallback(async (datos = datosEmpresa()) => {
    if (!empresa || (
      empresa.nombre === datos.nombre &&
      empresa.direccion === datos.direccion &&
      empresa.telefono === datos.telefono &&
      empresa.mostrarTelefonoTicket === datos.mostrarTelefonoTicket &&
      empresa.documento === datos.documento
    )) return true

    if (!datos.nombre) {
      notifyError('El nombre de la empresa es requerido')
      return false
    }
    setSaving(true)
    try {
      const updated = await api.empresas.actualizar(datos)
      setEmpresa(updated)
      return true
    } catch {
      notifyError('Error al guardar empresa')
      return false
    } finally {
      setSaving(false)
    }
  }, [empresa, datosEmpresa, notifyError])

  const handleMailPrefChange = (value: string) => {
    const v = value as MailMethod | ''
    setMailPref(v)
    persistMailPref(v === '' ? null : v)
    notifySuccess(v === '' ? 'Ahora se preguntará cada vez' : 'Preferencia de mail guardada')
  }

  const handleWhatsAppPrefChange = (value: string) => {
    const v = value as WhatsAppMethod | ''
    setWhatsappPref(v)
    persistWhatsAppPref(v === '' ? null : v)
    notifySuccess(v === '' ? 'Ahora se preguntará cada vez' : 'Preferencia de WhatsApp guardada')
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Configuración</h1>
        <p className="mt-1 text-sm text-slate-500">Gestioná los datos de tu empresa.</p>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-xl space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">Datos de la empresa</h2>
        {loading ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
            Cargando...
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nombre</label>
              <input
                type="text"
                value={empresaNombre}
                onChange={e => setEmpresaNombre(e.target.value)}
                onBlur={() => { void guardarEmpresa() }}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                placeholder="Nombre de la empresa"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Dirección</label>
              <input
                type="text"
                value={empresaDireccion}
                onChange={e => setEmpresaDireccion(e.target.value)}
                onBlur={() => { void guardarEmpresa() }}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                placeholder="Av. Rivadavia 1234, Castelar, Buenos Aires"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Teléfono</label>
              <div className="flex items-center gap-3">
                <input
                  type="tel"
                  value={empresaTelefono}
                  onChange={e => setEmpresaTelefono(e.target.value)}
                  onBlur={() => { void guardarEmpresa() }}
                  className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  placeholder="(011) 1234-5678"
                />
                <label className="flex shrink-0 items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={mostrarTelefonoTicket}
                    onChange={e => {
                      const mostrarTelefonoTicket = e.target.checked
                      setMostrarTelefonoTicket(mostrarTelefonoTicket)
                      void guardarEmpresa({ ...datosEmpresa(), mostrarTelefonoTicket })
                    }}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  Mostrar en ticket
                </label>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Documento (CUIT/CUIL)</label>
              <input
                type="text"
                value={empresaDoc}
                onChange={e => setEmpresaDoc(e.target.value)}
                onBlur={() => { void guardarEmpresa() }}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                placeholder="00000000000"
              />
            </div>
            <p className="text-xs text-slate-500">{saving ? 'Guardando cambios...' : 'Los cambios se guardan al salir de cada campo.'}</p>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl p-6 shadow-xl space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">Compartir pedidos por mail</h2>
        <p className="text-sm text-slate-500">Elegí cómo se abre el correo al compartir un pedido. Si dejás "Preguntar cada vez", se mostrará la opción al momento de compartir.</p>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Abrir correo con</label>
          <select
            value={mailPref}
            onChange={e => handleMailPrefChange(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
          >
            <option value="">Preguntar cada vez</option>
            <option value="mailto">Outlook (mailto)</option>
            <option value="gmail">Navegador (Gmail)</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-xl space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">Compartir pedidos por WhatsApp</h2>
        <p className="text-sm text-slate-500">Elegí cómo se abre WhatsApp al compartir un pedido. Si dejás "Preguntar cada vez", se mostrará la opción al momento de compartir.</p>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Abrir WhatsApp con</label>
          <select
            value={whatsappPref}
            onChange={e => handleWhatsAppPrefChange(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
          >
            <option value="">Preguntar cada vez</option>
            <option value="desktop">Escritorio (WhatsApp Desktop)</option>
            <option value="web">Navegador (WhatsApp Web)</option>
          </select>
        </div>
      </div>
    </div>
  )
}
