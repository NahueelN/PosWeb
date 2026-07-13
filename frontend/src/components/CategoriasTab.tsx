import { useState, useEffect, useMemo } from 'react'
import { api } from '../api/client'
import type { CategoriaDto } from '../types'
import { Folder, Pencil, Trash2 } from 'lucide-react'
import ABMTable from './shared/ABMTable'
import Dialog from './ui/Dialog'
import Button from './ui/Button'

export default function CategoriasTab({ notifyError }: { notifyError: (msg: string) => void }) {
  const [items, setItems] = useState<CategoriaDto[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [codigo, setCodigo] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [saving, setSaving] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try { setItems(await api.categorias.listar()) }
    catch { notifyError('Error al cargar categorías') }
    finally { setLoading(false) }
  }

  const filtered = useMemo(() => {
    if (!search.trim()) return items
    const q = search.toLowerCase()
    return items.filter(i =>
      i.codigo.toLowerCase().includes(q) ||
      i.descripcion.toLowerCase().includes(q)
    )
  }, [items, search])

  function openCreate() {
    setEditingId(null); setCodigo(''); setDescripcion(''); setShowForm(true)
  }

  function openEdit(item: CategoriaDto) {
    setEditingId(item.id); setCodigo(item.codigo); setDescripcion(item.descripcion); setShowForm(true)
  }

  function closeForm() {
    setShowForm(false); setEditingId(null); setCodigo(''); setDescripcion('')
  }

  async function handleSave() {
    if (!descripcion.trim()) return
    setSaving(true)
    try {
      if (editingId) {
        await api.categorias.actualizar(editingId, {
          codigo: codigo.trim() || undefined,
          descripcion: descripcion.trim(),
        })
      } else {
        await api.categorias.crear({ codigo: codigo.trim() || undefined, descripcion: descripcion.trim() })
      }
      closeForm(); await load()
    } catch (err: any) { notifyError(err.message || 'Error al guardar') }
    finally { setSaving(false) }
  }

  async function confirmarEliminar() {
    if (confirmDeleteId == null) return
    try {
      await api.categorias.eliminar(confirmDeleteId)
      setConfirmDeleteId(null); await load()
    } catch (err: any) { notifyError(err.message || 'Error al eliminar') }
  }

  return (
    <>
      <ABMTable
        icon={<Folder size={22} />}
        title="Categorías"
        description="Administrá las categorías utilizadas por los productos."
        loading={loading}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar categoría..."
        createLabel="Nueva categoría"
        onCreate={openCreate}
        emptyIcon={<Folder size={40} />}
        emptyTitle="No hay categorías creadas"
        emptyDescription="Las categorías te ayudan a organizar los productos y asignar márgenes sugeridos."
        footerInfo={filtered.length !== items.length
          ? `Mostrando ${filtered.length} de ${items.length} categorías`
          : `${items.length} categoría${items.length !== 1 ? 's' : ''}`}
        headers={
          <>
            <th className="pl-4 pr-4 w-28">Código</th>
            <th className="pr-4">Descripción</th>
            <th className="pr-4 w-24 text-right">% Margen</th>
            <th className="pr-4 w-24 text-right">Productos</th>
            <th className="pr-4 w-24 text-right">Acciones</th>
          </>
        }
      >
        {filtered.map(item => (
          <tr key={item.id} className="hover:bg-indigo-50/40 transition-colors even:bg-gray-50/60">
            <td className="py-3 pl-4 pr-4">
              <span className="font-mono text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">{item.codigo}</span>
            </td>
            <td className="py-3 pr-4">
              <span className="font-medium text-gray-800">{item.descripcion}</span>
            </td>
            <td className="py-3 pr-4 text-right">
              {item.margenGanancia != null
                ? <span className="font-medium text-gray-700">{item.margenGanancia}%</span>
                : <span className="text-gray-300">—</span>}
            </td>
            <td className="py-3 pr-4 text-right">
              <span className="text-gray-300">—</span>
            </td>
            <td className="py-3 pr-4 text-right">
              <div className="flex items-center justify-end gap-1">
                <button onClick={() => openEdit(item)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                  title="Editar categoría">
                  <Pencil size={14} />
                </button>
                <button onClick={() => setConfirmDeleteId(item.id)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                  title="Eliminar categoría">
                  <Trash2 size={14} />
                </button>
              </div>
            </td>
          </tr>
        ))}
      </ABMTable>

      <Dialog
        open={showForm}
        onClose={closeForm}
        title={editingId ? 'Editar categoría' : 'Nueva categoría'}
        icon={<Folder size={18} />}
        width="sm"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={closeForm}>Cancelar</Button>
            <Button variant="primary" size="sm" onClick={handleSave} disabled={saving || !descripcion.trim()}>
              {saving ? 'Guardando...' : editingId ? 'Guardar' : 'Crear'}
            </Button>
          </>
        }>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-gray-700">Código</label>
            <input type="text" value={codigo} onChange={e => setCodigo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
              placeholder={editingId ? 'Dejar vacío para mantener el actual' : 'Auto-incremental si se deja vacío'} />
            <p className="text-[11px] text-gray-400 mt-0.5">
              {editingId
                ? 'Opcional. Solo se actualiza si se ingresa un valor.'
                : 'Opcional. Si se deja vacío se asigna el próximo número disponible.'}
            </p>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-700">Descripción *</label>
            <input type="text" value={descripcion} onChange={e => setDescripcion(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
              placeholder="Ej: Lácteos" required autoFocus />
          </div>
        </div>
      </Dialog>

      <Dialog
        open={confirmDeleteId != null}
        onClose={() => setConfirmDeleteId(null)}
        title="Eliminar categoría"
        description="¿Estás seguro? Los productos asociados a esta categoría no se eliminarán."
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setConfirmDeleteId(null)}>Cancelar</Button>
            <Button variant="primary" size="sm" onClick={confirmarEliminar}>Eliminar</Button>
          </>
        }>
        <></>
      </Dialog>
    </>
  )
}
