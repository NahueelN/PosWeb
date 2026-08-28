import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { useNotification } from '../context/NotificationContext'
import type { EmpresaDto } from '../types'
import { getMailPref, setMailPref as persistMailPref, type MailMethod } from '../lib/mail'

export default function ConfiguracionPage() {
  const { notifyError, notifySuccess } = useNotification()

  const [, setEmpresa] = useState<EmpresaDto | null>(null)
  const [empresaNombre, setEmpresaNombre] = useState('')
  const [empresaDoc, setEmpresaDoc] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [mailPref, setMailPref] = useState<MailMethod | ''>(getMailPref() ?? '')

  useEffect(() => {
    setLoading(true)
    api.empresas.obtener()
      .then(e => {
        setEmpresa(e)
        setEmpresaNombre(e.nombre)
        setEmpresaDoc(e.documento)
      })
      .catch(() => notifyError('Error al cargar empresa'))
      .finally(() => setLoading(false))
  }, [])

  const handleGuardar = async () => {
    if (!empresaNombre.trim()) return
    setSaving(true)
    try {
      const updated = await api.empresas.actualizar({ nombre: empresaNombre.trim(), documento: empresaDoc.trim() })
      setEmpresa(updated)
      notifySuccess('Empresa actualizada')
    } catch {
      notifyError('Error al guardar empresa')
    } finally {
      setSaving(false)
    }
  }

  const handleMailPrefChange = (value: string) => {
    const v = value as MailMethod | ''
    setMailPref(v)
    persistMailPref(v === '' ? null : v)
    notifySuccess(v === '' ? 'Ahora se preguntará cada vez' : 'Preferencia de mail guardada')
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
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                placeholder="Nombre de la empresa"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Documento (CUIT/CUIL)</label>
              <input
                type="text"
                value={empresaDoc}
                onChange={e => setEmpresaDoc(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                placeholder="00000000000"
              />
            </div>
            <button
              onClick={handleGuardar}
              disabled={saving || !empresaNombre.trim()}
              className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
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
    </div>
  )
}
