import { useState, useEffect, useCallback } from 'react'
import { api } from '../api/client'
import { useNotification } from '../context/NotificationContext'
import type { ClienteDto, PagedResult } from '../types'

const TIPOS_DOCUMENTO = ['DNI', 'CUIT', 'CUIL', 'ConsumidorFinal']
const IVA_CONDICIONES = ['ResponsableInscripto', 'Monotributo', 'Exento', 'ConsumidorFinal']

export default function ClientesPage() {
  const [data, setData] = useState<PagedResult<ClienteDto> | null>(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const { notifyError } = useNotification()

  // Form state
  const [form, setForm] = useState<ClienteDto>({
    nombre: '',
    tipoDocumento: 'DNI',
    numeroDocumento: '',
    ivaCondicion: 'ConsumidorFinal',
    telefono: '',
    domicilio: '',
  })

  const load = useCallback(async (q?: string, p: number = 1) => {
    setLoading(true)
    try {
      const result = await api.clientes.listar(q || undefined, p)
      setData(result)
    } catch (err: any) {
      notifyError(err.message || 'Error al cargar clientes')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load(search, page) }, [load, search, page])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setPage(1)
    load(search, 1)
  }

  function resetForm() {
    setForm({ nombre: '', tipoDocumento: 'DNI', numeroDocumento: '', ivaCondicion: 'ConsumidorFinal', telefono: '', domicilio: '' })
    setEditingId(null)
    setShowForm(false)
  }

  function openEdit(cliente: ClienteDto) {
    setForm({
      nombre: cliente.nombre,
      tipoDocumento: cliente.tipoDocumento,
      numeroDocumento: cliente.numeroDocumento,
      ivaCondicion: cliente.ivaCondicion,
      telefono: cliente.telefono || '',
      domicilio: cliente.domicilio || '',
    })
    setEditingId(cliente.id ?? null)
    setShowForm(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      if (editingId) {
        await api.clientes.actualizar(editingId, form)
      } else {
        await api.clientes.crear(form)
      }
      resetForm()
      load(search, page)
    } catch (err: any) {
      try {
        const parts = err.message.split(': ')
        const parsed = JSON.parse(parts[parts.length - 1])
        notifyError(parsed.error || err.message)
      } catch {
        notifyError(err.message || 'Error al guardar cliente')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
        <button
          onClick={() => { resetForm(); setShowForm(true) }}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-500"
        >
          + Nuevo cliente
        </button>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="mb-4 flex gap-2">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por nombre o documento..."
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
        />
        <button type="submit" className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200">
          Buscar
        </button>
      </form>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg mx-4 shadow-xl">
            <h2 className="text-lg font-semibold mb-4">{editingId ? 'Editar cliente' : 'Nuevo cliente'}</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                <input
                  type="text" value={form.nombre}
                  onChange={e => setForm({ ...form, nombre: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo documento</label>
                  <select
                    value={form.tipoDocumento}
                    onChange={e => setForm({ ...form, tipoDocumento: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    {TIPOS_DOCUMENTO.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">N° documento</label>
                  <input
                    type="text" value={form.numeroDocumento}
                    onChange={e => setForm({ ...form, numeroDocumento: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    disabled={form.tipoDocumento === 'ConsumidorFinal'}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Condición IVA</label>
                <select
                  value={form.ivaCondicion}
                  onChange={e => setForm({ ...form, ivaCondicion: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  {IVA_CONDICIONES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                  <input
                    type="text" value={form.telefono || ''}
                    onChange={e => setForm({ ...form, telefono: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Domicilio</label>
                  <input
                    type="text" value={form.domicilio || ''}
                    onChange={e => setForm({ ...form, domicilio: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={resetForm} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cancelar</button>
                <button type="submit" disabled={loading} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-500 disabled:opacity-50">
                  {loading ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Table */}
      {loading && !data ? (
        <div className="text-center py-8 text-gray-500">Cargando...</div>
      ) : data && data.items.length > 0 ? (
        <>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Nombre</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Documento</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">IVA</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Teléfono</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Acción</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map(c => (
                  <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{c.nombre}</td>
                    <td className="px-4 py-3 text-gray-600">{c.tipoDocumento} {c.numeroDocumento}</td>
                    <td className="px-4 py-3 text-gray-600">{c.ivaCondicion}</td>
                    <td className="px-4 py-3 text-gray-600">{c.telefono || '-'}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => openEdit(c)} className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">Editar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
            <span>{data.totalCount} cliente(s)</span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Anterior
              </button>
              <span className="px-3 py-1">Pág. {page} / {data.totalPages}</span>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page >= data.totalPages}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-8 text-gray-500">No hay clientes</div>
      )}
    </div>
  )
}
