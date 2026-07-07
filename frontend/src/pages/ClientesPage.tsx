import { useEffect, useRef, useCallback } from 'react'
import { api } from '../api/client'
import { useNotification } from '../context/NotificationContext'
import type { ClienteDto } from '../types'
import Button from '../components/ui/Button'
import Dialog from '../components/ui/Dialog'
import PageShell from '../components/shared/PageShell'
import EntityToolbar from '../components/shared/EntityToolbar'
import EntityEmptyState from '../components/shared/EntityEmptyState'
import { useEntityList } from '../hooks/useEntityList'
import { useEntitySearch } from '../hooks/useEntitySearch'
import { useEntityForm } from '../hooks/useEntityForm'
import { useEntityPagination } from '../hooks/useEntityPagination'

const TIPOS_DOCUMENTO = ['DNI', 'CUIT', 'CUIL', 'ConsumidorFinal']
const IVA_CONDICIONES = ['ResponsableInscripto', 'Monotributo', 'Exento', 'ConsumidorFinal']

const emptyForm: ClienteDto = {
  nombre: '',
  tipoDocumento: 'DNI',
  numeroDocumento: '',
  ivaCondicion: 'ConsumidorFinal',
  telefono: '',
  mail: '',
  domicilio: '',
}

export default function ClientesPage() {
  const { notifyError } = useNotification()
  const searchRef = useRef<HTMLInputElement>(null!)

  // ── Hooks ──────────────────────────────────────────────────────────
  const list = useEntityList<ClienteDto, { q?: string; page?: number }>({
    fetchFn: async (params) => {
      const result = await api.clientes.listar(params.q || undefined, params.page || 1)
      return result
    },
  })

  const search = useEntitySearch()

  const pagination = useEntityPagination(list.totalPages)

  const form = useEntityForm<ClienteDto, ClienteDto>({ emptyForm })

  // ── Workflow ───────────────────────────────────────────────────────
  // LOAD on mount, search, or page change
  useEffect(() => {
    list.load({ q: search.debouncedSearch || undefined, page: pagination.page })
  }, [search.debouncedSearch, pagination.page])

  // SAVING → DONE → REFRESH
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.form.nombre.trim()) return
    form.setSaving(true)
    try {
      if (form.editingId) {
        await api.clientes.actualizar(form.editingId, form.form)
      } else {
        await api.clientes.crear(form.form)
      }
      form.closeForm(() => searchRef.current?.focus())
      list.load({ q: search.debouncedSearch || undefined, page: pagination.page })
    } catch (err: any) {
      notifyError(err.message || 'Error al guardar cliente')
    } finally {
      form.setSaving(false)
    }
  }, [form, list, search.debouncedSearch, pagination.page, notifyError])

  // ── Render ────────────────────────────────────────────────────────
  return (
    <PageShell
      title="Clientes"
      subtitle={`${list.totalCount} clientes`}
      loading={list.loading && list.data.length === 0}
      error={list.error}
      onErrorClose={list.clearError}
    >
      <EntityToolbar
        search={search.search}
        onSearchChange={v => { search.setSearch(v); pagination.setPage(1) }}
        searchRef={searchRef}
        searchPlaceholder="Buscar por nombre o documento..."
        createLabel="Nuevo cliente"
        onCreate={form.openCreate}
      />

      {list.data.length === 0 ? (
        <EntityEmptyState hasSearch={!!search.debouncedSearch} emptyMessage="No hay clientes" />
      ) : (
        <>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Nombre</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Documento</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">IVA</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Teléfono</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Mail</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">Estado</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Acción</th>
                </tr>
              </thead>
              <tbody>
                {list.data.map(c => (
                  <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{c.nombre}</td>
                    <td className="px-4 py-3 text-gray-600">{c.tipoDocumento} {c.numeroDocumento}</td>
                    <td className="px-4 py-3 text-gray-600">{c.ivaCondicion}</td>
                    <td className="px-4 py-3 text-gray-600">{c.telefono || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{c.mail || '—'}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${c.activo !== false ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {c.activo !== false ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right space-x-1">
                      <Button variant="ghost" size="sm"                       onClick={() => form.openEdit(c, item => ({
                        nombre: item.nombre,
                        tipoDocumento: item.tipoDocumento,
                        numeroDocumento: item.numeroDocumento,
                        ivaCondicion: item.ivaCondicion,
                        telefono: item.telefono || '',
                        mail: item.mail || '',
                        domicilio: item.domicilio || '',
                      }))}>Editar</Button>
                      {c.activo !== false && (
                        <Button variant="ghost" size="sm" onClick={async () => {
                          try { await api.clientes.desactivar(c.id!); list.load({ q: search.debouncedSearch || undefined, page: pagination.page }) }
                          catch (err: any) { notifyError(err.message || 'Error') }
                        }}>Desactivar</Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
              <span>{list.totalCount} cliente(s)</span>
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" onClick={pagination.prevPage} disabled={pagination.page <= 1}>Anterior</Button>
                <span className="px-2 text-gray-500">Pág. {pagination.page} / {pagination.totalPages}</span>
                <Button variant="secondary" size="sm" onClick={pagination.nextPage} disabled={pagination.page >= pagination.totalPages}>Siguiente</Button>
              </div>
            </div>
          )}
        </>
      )}

      <Dialog
        open={form.showForm}
        onClose={() => form.closeForm(() => searchRef.current?.focus())}
        title={form.editingId ? 'Editar cliente' : 'Nuevo cliente'}
        width="md"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => form.closeForm(() => searchRef.current?.focus())}>Cancelar</Button>
            <Button variant="primary" size="sm" onClick={handleSubmit} disabled={form.saving || !form.form.nombre.trim()}>
              {form.saving ? 'Guardando...' : 'Guardar'}
            </Button>
          </>
        }
      >
        <form id="cliente-form" onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-gray-700">Nombre *</label>
            <input type="text" value={form.form.nombre} onChange={e => form.setForm({ ...form.form, nombre: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-700">Tipo documento</label>
              <select value={form.form.tipoDocumento} onChange={e => form.setForm({ ...form.form, tipoDocumento: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none">
                {TIPOS_DOCUMENTO.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-700">N° documento</label>
              <input type="text" value={form.form.numeroDocumento} onChange={e => form.setForm({ ...form.form, numeroDocumento: e.target.value })}
                disabled={form.form.tipoDocumento === 'ConsumidorFinal'}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none disabled:bg-gray-100" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-700">Condición IVA</label>
            <select value={form.form.ivaCondicion} onChange={e => form.setForm({ ...form.form, ivaCondicion: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none">
              {IVA_CONDICIONES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-700">Teléfono</label>
              <input type="text" value={form.form.telefono || ''} onChange={e => form.setForm({ ...form.form, telefono: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-700">Mail</label>
              <input type="email" value={form.form.mail || ''} onChange={e => form.setForm({ ...form.form, mail: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-700">Domicilio</label>
              <input type="text" value={form.form.domicilio || ''} onChange={e => form.setForm({ ...form.form, domicilio: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none" />
            </div>
          </div>
        </form>
      </Dialog>
    </PageShell>
  )
}
