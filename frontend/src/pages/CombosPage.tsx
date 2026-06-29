import { useState, useEffect } from 'react'
import { api } from '../api/client'
import { useNotification } from '../context/NotificationContext'
import type { ComboDto, ProductoDto, ComboUpsertDto, ComboItemDto } from '../types'
import { Plus } from 'lucide-react'
import Button from '../components/ui/Button'

export default function CombosPage() {
  const [combos, setCombos] = useState<ComboDto[]>([])
  const [productos, setProductos] = useState<ProductoDto[]>([])
  const { notifyError, notifySuccess } = useNotification()
  const [editId, setEditId] = useState<number | null>(null)
  const [showForm, setShowForm] = useState(false)

  const [form, setForm] = useState({
    codCombo: '',
    descCombo: '',
    precio: '',
    items: [] as ComboItemDto[],
  })

  const [itemForm, setItemForm] = useState({ productoId: 0, cantidad: '1' })

  useEffect(() => {
    cargarCombos()
    api.productos.listar().then(setProductos).catch(() => {})
  }, [])

  async function cargarCombos() {
    try {
      setCombos(await api.combos.listar())
    } catch (e: any) { notifyError(e.message) }
  }

  function resetForm() {
    setForm({ codCombo: '', descCombo: '', precio: '', items: [] })
    setItemForm({ productoId: 0, cantidad: '1' })
    setEditId(null)
    setShowForm(false)
  }

  function iniciarEdicion(combo: ComboDto) {
    setForm({
      codCombo: combo.codCombo,
      descCombo: combo.descCombo,
      precio: combo.precio.toString(),
      items: combo.items.map(i => ({
        productoId: i.productoId,
        cantidad: i.cantidad,
        productoNombre: i.productoNombre,
        codigoBarra: i.codigoBarra,
      })),
    })
    setEditId(combo.id)
    setShowForm(true)
  }

  function agregarItem() {
    if (itemForm.productoId <= 0) {
      notifyError('Seleccioná un producto')
      return
    }
    const cant = parseInt(itemForm.cantidad)
    if (isNaN(cant) || cant <= 0) {
      notifyError('Cantidad inválida')
      return
    }
    if (form.items.some(i => i.productoId === itemForm.productoId)) {
      notifyError('El producto ya está en el combo')
      return
    }
    const prod = productos.find(p => p.id === itemForm.productoId)
    setForm(prev => ({
      ...prev,
      items: [...prev.items, {
        productoId: itemForm.productoId,
        cantidad: cant,
        productoNombre: prod?.nombre,
        codigoBarra: prod?.codigoBarra,
      }],
    }))
    setItemForm({ productoId: 0, cantidad: '1' })
  }

  function quitarItem(idx: number) {
    setForm(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== idx),
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const precio = parseFloat(form.precio)
    if (isNaN(precio) || precio <= 0) { notifyError('Precio inválido'); return }
    if (!form.codCombo.trim()) { notifyError('Código requerido'); return }
    if (!form.descCombo.trim()) { notifyError('Descripción requerida'); return }
    if (form.items.length === 0) { notifyError('Agregá al menos un producto'); return }

    const dto: ComboUpsertDto = {
      codCombo: form.codCombo.trim(),
      descCombo: form.descCombo.trim(),
      precio,
      items: form.items.map(i => ({ productoId: i.productoId, cantidad: i.cantidad })),
    }

    try {
      if (editId !== null) {
        await api.combos.actualizar(editId, dto)
        notifySuccess('Combo actualizado')
      } else {
        await api.combos.crear(dto)
        notifySuccess('Combo creado')
      }
      resetForm()
      cargarCombos()
    } catch (e: any) { notifyError(e.message) }
  }

  async function handleEliminar(id: number) {
    try {
      await api.combos.eliminar(id)
      notifySuccess('Combo desactivado')
      cargarCombos()
    } catch (e: any) { notifyError(e.message) }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Combos</h2>
          <p className="text-sm text-gray-500 mt-0.5">{combos.length} combos activos</p>
        </div>
        <Button variant="primary" size="md" onClick={() => setShowForm(true)} icon={<Plus size={16} />}>
          Nuevo combo
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-800">
              {editId !== null ? 'Editar combo' : 'Nuevo combo'}
            </h3>
            <button type="button" onClick={resetForm} className="text-gray-400 hover:text-gray-600 text-sm">Cancelar</button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Código *</label>
              <input type="text" value={form.codCombo} onChange={e => setForm(f => ({ ...f, codCombo: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                placeholder="COMB4" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Descripción *</label>
              <input type="text" value={form.descCombo} onChange={e => setForm(f => ({ ...f, descCombo: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                placeholder="Combo Hamburguesa + Papas + Bebida" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Precio combo *</label>
              <input type="number" step="0.01" value={form.precio} onChange={e => setForm(f => ({ ...f, precio: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-mono"
                placeholder="2000" />
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Productos del combo</h4>
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">Producto</label>
                <select value={itemForm.productoId} onChange={e => setItemForm(f => ({ ...f, productoId: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none">
                  <option value={0}>Seleccionar...</option>
                  {productos.map(p => <option key={p.id} value={p.id}>{p.nombre} (${p.precio.toFixed(0)}) — {p.codigoBarra}</option>)}
                </select>
              </div>
              <div className="w-24">
                <label className="block text-xs text-gray-500 mb-1">Cantidad</label>
                <input type="number" min="1" value={itemForm.cantidad} onChange={e => setItemForm(f => ({ ...f, cantidad: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none" />
              </div>
              <button type="button" onClick={agregarItem}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
                + Agregar
              </button>
            </div>

            {form.items.length > 0 && (
              <div className="mt-3 space-y-1.5">
                {form.items.map((item, i) => {
                  const prod = productos.find(p => p.id === item.productoId)
                  const precioIndividual = prod?.precio ?? 0
                  const subtotal = precioIndividual * item.cantidad
                  return (
                    <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-lg px-3 py-2 text-sm">
                      <span className="flex-1 font-medium truncate">
                        {prod?.nombre ?? `ID ${item.productoId}`}
                      </span>
                      <span className="text-xs text-gray-400 font-mono whitespace-nowrap">${precioIndividual.toFixed(0)} c/u</span>
                      <span className="text-xs text-gray-400">x{item.cantidad}</span>
                      <span className="text-xs font-semibold text-gray-600 whitespace-nowrap">= ${subtotal.toFixed(0)}</span>
                      <button type="button" onClick={() => quitarItem(i)}
                        className="text-red-400 hover:text-red-600 text-xs font-medium shrink-0">Quitar</button>
                    </div>
                  )
                })}
                {(() => {
                  const suma = form.items.reduce((total, item) => {
                    const prod = productos.find(p => p.id === item.productoId)
                    return total + (prod?.precio ?? 0) * item.cantidad
                  }, 0)
                  const comboPrecio = parseFloat(form.precio) || 0
                  const ahorro = suma - comboPrecio
                  return (
                    <div className="flex items-center gap-3 bg-indigo-50 rounded-lg px-3 py-2 text-sm border border-indigo-100">
                      <span className="flex-1 font-semibold text-indigo-800">Suma productos individuales</span>
                      <span className="font-bold text-indigo-700">${suma.toFixed(0)}</span>
                      {comboPrecio > 0 && (
                        <>
                          <span className="text-indigo-400">→</span>
                          <span className="font-bold text-green-700">${comboPrecio.toFixed(0)}</span>
                          <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${ahorro > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                            {ahorro > 0 ? `-$${ahorro.toFixed(0)}` : ahorro < 0 ? `+$${Math.abs(ahorro).toFixed(0)}` : 'Sin descuento'}
                          </span>
                        </>
                      )}
                    </div>
                  )
                })()}
              </div>
            )}
          </div>

          <button type="submit"
            className="w-full py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-colors">
            {editId !== null ? 'Guardar cambios' : 'Crear combo'}
          </button>
        </form>
      )}

      {combos.length === 0 && !showForm && (
        <div className="text-center py-12">
          <p className="text-gray-500 font-medium text-sm">No hay combos activos</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {combos.map(combo => (
          <div key={combo.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:border-indigo-300 hover:shadow-md transition-all">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">{combo.descCombo}</p>
                <p className="text-xs text-gray-400 font-mono mt-0.5">{combo.codCombo}</p>
              </div>
              <span className="text-xl font-bold text-indigo-600 shrink-0 ml-3">
                ${combo.precio.toFixed(0)}
              </span>
            </div>

            {combo.items.length > 0 && (
              <div className="mt-3 space-y-1">
                {combo.items.map((item, j) => (
                  <div key={j} className="flex items-center gap-2 text-xs text-gray-500">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-300 shrink-0" />
                    <span className="truncate">{item.productoNombre ?? `ID ${item.productoId}`}</span>
                    <span className="text-gray-400 shrink-0">x{item.cantidad}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end gap-3 mt-4 pt-3 border-t border-gray-100">
              <button onClick={() => iniciarEdicion(combo)}
                className="text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors">
                Editar
              </button>
              <button onClick={() => handleEliminar(combo.id)}
                className="text-xs font-medium text-red-400 hover:text-red-600 transition-colors">
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
