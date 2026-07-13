import { useState, useEffect, useMemo } from 'react'
import { api } from '../api/client'
import type { CategoriaDto } from '../types'
import { Percent, Check, X } from 'lucide-react'
import ABMTable from './shared/ABMTable'

export default function MargenesTab({ notifyError }: { notifyError: (msg: string) => void }) {
  const [categorias, setCategorias] = useState<CategoriaDto[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [saving, setSaving] = useState<number | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editValue, setEditValue] = useState('')

  useEffect(() => {
    api.categorias.listar()
      .then(setCategorias)
      .catch(() => notifyError('Error al cargar categorías'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    if (!search.trim()) return categorias
    const q = search.toLowerCase()
    return categorias.filter(c =>
      c.descripcion.toLowerCase().includes(q) ||
      c.codigo.toLowerCase().includes(q)
    )
  }, [categorias, search])

  function startEdit(cat: CategoriaDto) {
    setEditingId(cat.id)
    setEditValue(cat.margenGanancia?.toString() ?? '')
  }

  function cancelEdit() {
    setEditingId(null)
    setEditValue('')
  }

  async function saveMargen(id: number) {
    const trimmed = editValue.trim()
    const margen = trimmed === '' ? null : parseFloat(trimmed)
    if (trimmed !== '' && (isNaN(margen!) || margen! < 0 || margen! > 999.99)) {
      notifyError('El margen debe ser un número entre 0 y 999.99')
      return
    }

    setSaving(id)
    try {
      const updated = await api.categorias.actualizarMargen(id, margen)
      setCategorias(prev => prev.map(c => c.id === id ? updated : c))
      setEditingId(null)
      setEditValue('')
    } catch (err: any) {
      notifyError(err.message || 'Error al guardar margen')
    } finally {
      setSaving(null)
    }
  }

  return (
    <ABMTable
      icon={<Percent size={22} />}
      title="Márgenes por categoría"
      description="Definí los márgenes sugeridos para cada categoría."
      loading={loading}
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder="Buscar margen..."
      emptyIcon={<Percent size={40} />}
      emptyTitle="No hay categorías cargadas"
      emptyDescription="Primero creá categorías desde la pestaña Categorías para poder asignar márgenes."
      footerInfo={filtered.length !== categorias.length
        ? `Mostrando ${filtered.length} de ${categorias.length} categorías`
        : `${categorias.length} categoría${categorias.length !== 1 ? 's' : ''}`}
      headers={
        <>
          <th className="pl-4 pr-4 w-28">Código</th>
          <th className="pr-4">Categoría</th>
          <th className="pr-4 w-36">% Margen</th>
          <th className="pr-4 w-24 text-right">Productos</th>
          <th className="pr-4 w-24 text-right">Acciones</th>
        </>
      }
    >
      {filtered.map(cat => (
        <tr key={cat.id} className="hover:bg-indigo-50/40 transition-colors even:bg-gray-50/60">
          <td className="py-3 pl-4 pr-4">
            <span className="font-mono text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">{cat.codigo}</span>
          </td>
          <td className="py-3 pr-4">
            <span className="font-medium text-gray-800">{cat.descripcion}</span>
          </td>
          <td className="py-3 pr-4">
            {editingId === cat.id ? (
              <div className="flex items-center gap-1.5">
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="999.99"
                    value={editValue}
                    onChange={e => setEditValue(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') saveMargen(cat.id)
                      if (e.key === 'Escape') cancelEdit()
                    }}
                    className="w-24 h-8 pl-3 pr-7 text-sm border border-indigo-300 rounded-lg
                      focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                    autoFocus
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">%</span>
                </div>
              </div>
            ) : (
              <span className={cat.margenGanancia != null
                ? 'font-medium text-gray-700'
                : 'text-gray-300'}>
                {cat.margenGanancia != null ? `${cat.margenGanancia}%` : '—'}
              </span>
            )}
          </td>
          <td className="py-3 pr-4 text-right">
            <span className="text-gray-300">—</span>
          </td>
          <td className="py-3 pr-4 text-right">
            {editingId === cat.id ? (
              <div className="flex items-center justify-end gap-1">
                <button onClick={() => saveMargen(cat.id)} disabled={saving === cat.id}
                  className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors disabled:opacity-50"
                  title="Guardar margen">
                  <Check size={14} />
                </button>
                <button onClick={cancelEdit}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                  title="Cancelar">
                  <X size={14} />
                </button>
              </div>
            ) : (
              <button onClick={() => startEdit(cat)}
                className="px-2.5 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors">
                {cat.margenGanancia != null ? 'Editar' : 'Asignar'}
              </button>
            )}
          </td>
        </tr>
      ))}
    </ABMTable>
  )
}
