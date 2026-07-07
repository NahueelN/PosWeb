import { useEffect, useCallback } from 'react'
import { api } from '../api/client'
import { useNotification } from '../context/NotificationContext'
import type { SucursalDto } from '../types'
import Button from '../components/ui/Button'
import Dialog from '../components/ui/Dialog'
import PageShell from '../components/shared/PageShell'
import EntityEmptyState from '../components/shared/EntityEmptyState'
import { useEntityList } from '../hooks/useEntityList'
import { useEntityForm } from '../hooks/useEntityForm'

const emptyForm = { numero: '', codigo: '', nombre: '' }

export default function SucursalesPage() {
  const { notifyError } = useNotification()

  // ── Hooks ──────────────────────────────────────────────────────────
  const list = useEntityList<SucursalDto>({
    fetchFn: async () => await api.sucursales.listar(),
  })

  const form = useEntityForm<{ numero: string; codigo: string; nombre: string }, SucursalDto>({ emptyForm })

  // ── Workflow ───────────────────────────────────────────────────────
  // LOAD on mount
  useEffect(() => { list.load() }, [])

  // SAVING → DONE → REFRESH
  const handleSave = useCallback(async () => {
    if (!form.form.nombre.trim()) return
    form.setSaving(true)
    try {
      await api.sucursales.crear({
        numero: Number(form.form.numero),
        codigo: form.form.codigo,
        nombre: form.form.nombre,
      })
      form.closeForm()
      list.load()
    } catch (err: any) {
      notifyError(err.message || 'Error al crear sucursal')
    } finally {
      form.setSaving(false)
    }
  }, [form, list, notifyError])

  async function handleEliminar(id: number) {
    try {
      await api.sucursales.eliminar(id)
      list.load()
    } catch (e: any) { notifyError(e.message) }
  }

  // ── Render ────────────────────────────────────────────────────────
  return (
    <PageShell
      title="Sucursales"
      subtitle={`${list.data.length} sucursales activas`}
      actions={<Button onClick={form.openCreate} variant="primary" size="sm">Nueva sucursal</Button>}
      loading={list.loading && list.data.length === 0}
      error={list.error}
      onErrorClose={list.clearError}
    >
      {list.data.length === 0 ? (
        <EntityEmptyState hasSearch={false} emptyMessage="No hay sucursales" />
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="px-4 py-3">Número</th>
                  <th className="px-4 py-3">Código</th>
                  <th className="px-4 py-3">Nombre</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {list.data.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-800">{s.numero}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{s.codigo}</td>
                    <td className="px-4 py-3 text-gray-800">{s.nombre}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleEliminar(s.id)}
                        className="text-sm text-gray-400 hover:text-red-500 transition-colors"
                      >Eliminar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Dialog
        open={form.showForm}
        onClose={() => form.closeForm()}
        title="Nueva sucursal"
        width="sm"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => form.closeForm()}>Cancelar</Button>
            <Button variant="primary" size="sm" onClick={handleSave} disabled={form.saving || !form.form.nombre.trim()}>
              {form.saving ? 'Creando...' : 'Crear'}
            </Button>
          </>
        }
      >
        <form id="sucursal-form" onSubmit={(e) => { e.preventDefault(); handleSave() }} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-700">Número</label>
              <input type="number" value={form.form.numero}
                onChange={e => form.setForm({ ...form.form, numero: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none" required />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-700">Código</label>
              <input type="text" value={form.form.codigo}
                onChange={e => form.setForm({ ...form.form, codigo: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none" required />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-700">Nombre</label>
            <input type="text" value={form.form.nombre}
              onChange={e => form.setForm({ ...form.form, nombre: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none" required />
          </div>
        </form>
      </Dialog>
    </PageShell>
  )
}
