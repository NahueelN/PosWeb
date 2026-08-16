import { useEffect, useRef, useCallback } from 'react'
import type { ProveedorDto, CrearProveedorRequestDto } from '../types'
import { api } from '../api/client'
import { useNotification } from '../context/NotificationContext'
import Button from '../components/ui/Button'
import Dialog from '../components/ui/Dialog'
import PageShell from '../components/shared/PageShell'
import EntityToolbar from '../components/shared/EntityToolbar'
import EntityEmptyState from '../components/shared/EntityEmptyState'
import EntidadContactoForm from '../components/shared/EntidadContactoForm'
import { useEntityList } from '../hooks/useEntityList'
import { useEntitySearch } from '../hooks/useEntitySearch'
import { useEntityForm } from '../hooks/useEntityForm'
import { formatCurrency } from '../formats'

const emptyForm: CrearProveedorRequestDto = {
  nombre: '', tipoDocumento: '', nroDocumento: '', telefono: '', domicilio: '', mail: '', ivaCondicion: 'ConsumidorFinal',
}

const IVA_OPTIONS = [
  { value: 'ConsumidorFinal', label: 'Consumidor Final' },
  { value: 'ResponsableInscripto', label: 'Responsable Inscripto' },
  { value: 'Monotributista', label: 'Monotributista' },
  { value: 'Exento', label: 'Exento' },
]

export default function ProveedoresPage() {
  const { notifyError } = useNotification()
  const searchRef = useRef<HTMLInputElement>(null!)

  // ── Hooks ──────────────────────────────────────────────────────────
  const list = useEntityList<ProveedorDto, string | undefined>({
    fetchFn: async (q) => await api.proveedores.listar(q || undefined),
  })

  const search = useEntitySearch()

  const form = useEntityForm<CrearProveedorRequestDto, ProveedorDto>({ emptyForm })

  // ── Workflow ───────────────────────────────────────────────────────
  // LOAD on debounced search
  useEffect(() => {
    list.load(search.debouncedSearch || undefined)
  }, [search.debouncedSearch])

  // SAVING → DONE → REFRESH
  const handleSave = useCallback(async () => {
    if (!form.form.nombre.trim()) return
    form.setSaving(true)
    try {
      if (form.editingId) {
        await api.proveedores.actualizar(form.editingId, form.form)
      } else {
        await api.proveedores.crear(form.form)
      }
      form.closeForm(() => searchRef.current?.focus())
      list.load(search.debouncedSearch || undefined)
    } catch (err: unknown) {
      notifyError(err instanceof Error ? err.message : 'Error al guardar proveedor')
    } finally {
      form.setSaving(false)
    }
  }, [form, list, search.debouncedSearch, notifyError])

  const handleEdit = useCallback((p: ProveedorDto) => {
    form.openEdit(p, item => ({
      nombre: item.nombre,
      tipoDocumento: item.tipoDocumento || '',
      nroDocumento: item.nroDocumento || '',
      telefono: item.telefono || '',
      domicilio: item.domicilio || '',
      mail: item.mail || '',
      ivaCondicion: item.ivaCondicion,
    }))
  }, [form])

  const totalDeuda = list.data.reduce((s, p) => s + p.deudaPendiente, 0)

  // ── Render ────────────────────────────────────────────────────────
  return (
    <PageShell
      title="Proveedores"
      subtitle={`${list.totalCount} proveedores`}
      loading={list.loading && list.data.length === 0}
      error={list.error}
      onErrorClose={list.clearError}
    >
      <EntityToolbar
        search={search.search}
        onSearchChange={search.setSearch}
        searchRef={searchRef}
        searchPlaceholder="Buscar proveedor..."
        createLabel="Nuevo proveedor"
        onCreate={form.openCreate}
      />

      {totalDeuda > 0 && (
        <div className="mb-4 text-sm">
          Deuda total: <span className="font-bold text-red-600">{formatCurrency(totalDeuda)}</span>
        </div>
      )}

      {list.data.length === 0 ? (
        <EntityEmptyState hasSearch={!!search.debouncedSearch} emptyMessage="No hay proveedores" />
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs text-gray-500 uppercase tracking-wider">
                <th className="px-4 py-3">Código</th>
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Documento</th>
                <th className="px-4 py-3">IVA</th>
                <th className="px-4 py-3">Teléfono</th>
                <th className="px-4 py-3 text-right">Deuda pendiente</th>
                <th className="px-4 py-3 text-center">Estado</th>
                <th className="px-4 py-3 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {list.data.map(p => (
                <tr key={p.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleEdit(p)}>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{p.codigo}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{p.nombre}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {p.tipoDocumento && p.nroDocumento ? `${p.tipoDocumento} ${p.nroDocumento}` : ''}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{p.ivaCondicion || '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{p.telefono || '—'}</td>
                  <td className={`px-4 py-3 text-right font-mono font-medium ${p.deudaPendiente > 0 ? 'text-red-600' : 'text-gray-500'}`}>
                    {formatCurrency(p.deudaPendiente)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${p.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {p.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right space-x-1">
                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleEdit(p) }}>Editar</Button>
                    {p.activo && (
                      <Button variant="ghost" size="sm" onClick={(e) => {
                        e.stopPropagation()
                        ;(async () => {
                          try { await api.proveedores.desactivar(p.id); list.load(search.debouncedSearch || undefined) }
                          catch (err: unknown) { notifyError(err instanceof Error ? err.message : 'Error') }
                        })()
                      }}>Desactivar</Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog
        open={form.showForm}
        onClose={() => form.closeForm(() => searchRef.current?.focus())}
        title={form.editingId ? 'Editar proveedor' : 'Nuevo proveedor'}
        width="md"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => form.closeForm(() => searchRef.current?.focus())}>Cancelar</Button>
            <Button variant="primary" size="sm" onClick={handleSave} disabled={form.saving || !form.form.nombre.trim()}>
              {form.saving ? 'Guardando...' : form.editingId ? 'Guardar cambios' : 'Crear proveedor'}
            </Button>
          </>
        }
      >
        <EntidadContactoForm
          nombre={form.form.nombre}
          tipoDocumento={form.form.tipoDocumento || ''}
          documento={form.form.nroDocumento || ''}
          ivaCondicion={form.form.ivaCondicion || ''}
          telefono={form.form.telefono || ''}
          mail={form.form.mail || ''}
          domicilio={form.form.domicilio || ''}
          onChange={(campo, valor) => {
            const campoReal = campo === 'documento' ? 'nroDocumento' : campo
            form.setForm({ ...form.form, [campoReal]: valor })
          }}
          tiposDocumento={['', 'CUIL', 'CUIT', 'DNI']}
          ivaCondiciones={IVA_OPTIONS.map(o => o.value)}
        />
      </Dialog>
    </PageShell>
  )
}
