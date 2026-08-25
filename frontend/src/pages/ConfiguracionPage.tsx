import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { useNotification } from '../context/NotificationContext'
import type { EmpresaDto } from '../types'

export default function ConfiguracionPage() {
  const { notifyError, notifySuccess } = useNotification()

  const [empresa, setEmpresa] = useState<EmpresaDto | null>(null)
  const [empresaNombre, setEmpresaNombre] = useState('')
  const [empresaDoc, setEmpresaDoc] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

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
    </div>
  )
}
