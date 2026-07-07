import { useState, useEffect, useMemo, useRef } from 'react'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useNotification } from '../context/NotificationContext'
import { COMBO_PREFIX } from '../lib/constants'
import DiasSemanaSelector from '../components/shared/DiasSemanaSelector'
import type { ComboDto, ProductoDto, ComboUpsertDto, ComboItemDto, OfertaDto, OfertaUpsertDto } from '../types'
import { Plus, Search, X, AlertTriangle, Trash2 } from 'lucide-react'
import Button from '../components/ui/Button'
import Dialog from '../components/ui/Dialog'

type Tab = 'combos' | 'ofertas'

export default function CombosPage() {
  const { notifyError, notifySuccess } = useNotification()
  const { user } = useAuth()
  const [tab, setTab] = useState<Tab>('combos')

  const [productos, setProductos] = useState<ProductoDto[]>([])

  // ---- confirm dialog ----
  const [confirmDelete, setConfirmDelete] = useState<{ type: 'combo' | 'oferta'; id: number } | null>(null)

  // ---- combos ----
  const [combos, setCombos] = useState<ComboDto[]>([])
  const [showComboModal, setShowComboModal] = useState(false)
  const [comboEditId, setComboEditId] = useState<number | null>(null)
  const [comboSearch, setComboSearch] = useState('')
  const [mostrarCombosInactivos, setMostrarCombosInactivos] = useState(false)

  const [comboForm, setComboForm] = useState({
    codCombo: '',
    descCombo: '',
    precio: '',
    fechaInicio: '',
    fechaFin: '',
    diasSemana: [] as string[],
    items: [] as ComboItemDto[],
  })

  // ---- ofertas ----
  const [ofertas, setOfertas] = useState<OfertaDto[]>([])
  const [showOfertaModal, setShowOfertaModal] = useState(false)
  const [ofertaEditId, setOfertaEditId] = useState<number | null>(null)
  const [ofertaSearch, setOfertaSearch] = useState('')
  const [mostrarOfertasInactivas, setMostrarOfertasInactivas] = useState(false)

  const [ofertaForm, setOfertaForm] = useState({
    fechaInicio: '',
    fechaFin: '',
    productoId: 0,
    productoNombre: '',
    descuento: '',
    diasSemana: [] as string[],
  })

  useEffect(() => {
    cargarCombos()
    cargarOfertas()
    api.productos.listar().then(setProductos).catch(() => {})
  }, [])

  async function cargarCombos() {
    try { setCombos(await api.combos.listar()) }
    catch (e: any) { notifyError(e.message) }
  }

  async function cargarOfertas() {
    try { setOfertas(await api.ofertas.listar()) }
    catch (e: any) { notifyError(e.message) }
  }

  // ---- search filters ----
  const filteredCombos = useMemo(() => {
    let list = mostrarCombosInactivos ? combos : combos.filter(c => c.activo)
    if (comboSearch.trim()) {
      const q = comboSearch.toLowerCase()
      list = list.filter(c =>
        c.descCombo.toLowerCase().includes(q) ||
        c.codCombo.toLowerCase().includes(q)
      )
    }
    return list
  }, [combos, comboSearch, mostrarCombosInactivos])

  const filteredOfertas = useMemo(() => {
    let list = mostrarOfertasInactivas ? ofertas : ofertas.filter(o => o.activo)
    if (ofertaSearch.trim()) {
      const q = ofertaSearch.toLowerCase()
      list = list.filter(o =>
        (o.productoNombre ?? '').toLowerCase().includes(q) ||
        (o.codigoBarra ?? '').toLowerCase().includes(q)
      )
    }
    return list
  }, [ofertas, ofertaSearch, mostrarOfertasInactivas])

  // ===================================================================
  // COMBO FORM
  // ===================================================================
  function abrirComboModal(combo?: ComboDto) {
    if (combo) {
      setComboForm({
        codCombo: combo.codCombo,
        descCombo: combo.descCombo,
        precio: combo.precio.toString(),
        fechaInicio: combo.fechaInicio?.slice(0, 16) ?? '',
        fechaFin: combo.fechaFin?.slice(0, 16) ?? '',
        diasSemana: combo.diasSemana ? combo.diasSemana.split(',').map(d => d.trim()) : [],
        items: combo.items.map(i => ({
          productoId: i.productoId,
          cantidad: i.cantidad,
          productoNombre: i.productoNombre,
          codigoBarra: i.codigoBarra,
        })),
      })
      setComboEditId(combo.id)
    } else {
      setComboForm({ codCombo: '', descCombo: '', precio: '', fechaInicio: '', fechaFin: '', diasSemana: [], items: [] })
      setComboEditId(null)
    }
    setShowComboModal(true)
  }

  function cerrarComboModal() {
    setShowComboModal(false)
    setComboEditId(null)
  }

  async function handleComboSubmit(e: React.FormEvent) {
    e.preventDefault()
    const precio = parseFloat(comboForm.precio)
    if (isNaN(precio) || precio <= 0) { notifyError('Precio inválido'); return }
    if (!comboForm.codCombo.trim()) { notifyError('Código requerido'); return }
    if (!comboForm.descCombo.trim()) { notifyError('Descripción requerida'); return }
    if (comboForm.items.length === 0) { notifyError('Agregá al menos un producto'); return }

    const dto: ComboUpsertDto = {
      codCombo: comboForm.codCombo.trim(),
      descCombo: comboForm.descCombo.trim(),
      precio,
      fechaInicio: comboForm.fechaInicio ? comboForm.fechaInicio + ':00' : null,
      fechaFin: comboForm.fechaFin ? comboForm.fechaFin + ':00' : null,
      diasSemana: comboForm.diasSemana.length > 0 ? comboForm.diasSemana.join(',') : null,
      items: comboForm.items.map(i => ({ productoId: i.productoId, cantidad: i.cantidad })),
    }

    try {
      if (comboEditId !== null) {
        await api.combos.actualizar(comboEditId, dto)
        notifySuccess('Combo actualizado')
      } else {
        await api.combos.crear(dto)
        notifySuccess('Combo creado')
      }
      cerrarComboModal()
      cargarCombos()
    } catch (e: any) { notifyError(e.message) }
  }

  async function handleEliminarCombo(id: number) {
    try {
      await api.combos.eliminar(id)
      notifySuccess('Combo desactivado')
      cargarCombos()
    } catch (e: any) { notifyError(e.message) }
  }

  async function handleReactivarCombo(id: number) {
    try {
      await api.combos.reactivar(id)
      notifySuccess('Combo reactivado')
      cargarCombos()
    } catch (e: any) { notifyError(e.message) }
  }

  async function handleEliminarDefinitivoCombo(id: number) {
    setConfirmDelete({ type: 'combo', id })
  }

  async function confirmarEliminarCombo() {
    if (!confirmDelete || confirmDelete.type !== 'combo') return
    try {
      await api.combos.eliminarDefinitivo(confirmDelete.id)
      notifySuccess('Combo eliminado')
      cargarCombos()
    } catch (e: any) { notifyError(e.message) }
    setConfirmDelete(null)
  }

  // ===================================================================
  // OFERTA FORM
  // ===================================================================
  function abrirOfertaModal(oferta?: OfertaDto) {
    if (oferta) {
      const prod = productos.find(p => p.id === oferta.productoId)
      setOfertaForm({
        fechaInicio: oferta.fechaInicio.slice(0, 16),
        fechaFin: oferta.fechaFin.slice(0, 16),
        productoId: oferta.productoId,
        productoNombre: oferta.productoNombre ?? prod?.nombre ?? '',
        descuento: oferta.descuento.toString(),
        diasSemana: oferta.diasSemana ? oferta.diasSemana.split(',').map(d => d.trim()) : [],
      })
      setOfertaEditId(oferta.id)
    } else {
      setOfertaForm({ fechaInicio: '', fechaFin: '', productoId: 0, productoNombre: '', descuento: '', diasSemana: [] })
      setOfertaEditId(null)
    }
    setShowOfertaModal(true)
  }

  function cerrarOfertaModal() {
    setShowOfertaModal(false)
    setOfertaEditId(null)
  }

  async function handleOfertaSubmit(e: React.FormEvent) {
    e.preventDefault()
    const descuento = parseFloat(ofertaForm.descuento)
    if (isNaN(descuento) || descuento <= 0 || descuento > 100) { notifyError('Descuento inválido (1-100%)'); return }
    if (!ofertaForm.fechaInicio || !ofertaForm.fechaFin) { notifyError('Fechas requeridas'); return }
    if (ofertaForm.productoId <= 0) { notifyError('Seleccioná un producto'); return }

    const dto: OfertaUpsertDto = {
      fechaInicio: ofertaForm.fechaInicio ? ofertaForm.fechaInicio + ':00' : '',
      fechaFin: ofertaForm.fechaFin ? ofertaForm.fechaFin + ':00' : '',
      productoId: ofertaForm.productoId,
      descuento,
      diasSemana: ofertaForm.diasSemana.length > 0 ? ofertaForm.diasSemana.join(',') : null,
    }

    try {
      if (ofertaEditId !== null) {
        await api.ofertas.actualizar(ofertaEditId, dto)
        notifySuccess('Oferta actualizada')
      } else {
        await api.ofertas.crear(dto)
        notifySuccess('Oferta creada')
      }
      cerrarOfertaModal()
      cargarOfertas()
    } catch (e: any) { notifyError(e.message) }
  }

  async function handleEliminarOferta(id: number) {
    try {
      await api.ofertas.eliminar(id)
      notifySuccess('Oferta desactivada')
      cargarOfertas()
    } catch (e: any) { notifyError(e.message) }
  }

  async function handleReactivarOferta(id: number) {
    try {
      await api.ofertas.reactivar(id)
      notifySuccess('Oferta reactivada')
      cargarOfertas()
    } catch (e: any) { notifyError(e.message) }
  }

  async function handleEliminarDefinitivoOferta(id: number) {
    setConfirmDelete({ type: 'oferta', id })
  }

  async function confirmarEliminarOferta() {
    if (!confirmDelete || confirmDelete.type !== 'oferta') return
    try {
      await api.ofertas.eliminarDefinitivo(confirmDelete.id)
      notifySuccess('Oferta eliminada')
      cargarOfertas()
    } catch (e: any) { notifyError(e.message) }
    setConfirmDelete(null)
  }

  return (
    <>
      <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Combos y Ofertas</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {tab === 'combos' ? `${combos.length} combos` : `${ofertas.length} ofertas`}
          </p>
        </div>
        <Button variant="primary" size="md"
          onClick={() => tab === 'combos' ? abrirComboModal() : abrirOfertaModal()}
          icon={<Plus size={16} />}
        >
          {tab === 'combos' ? 'Nuevo combo' : 'Nueva oferta'}
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button onClick={() => setTab('combos')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === 'combos' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
          Combos
        </button>
        {user?.rol !== 'UsuarioComun' && (
        <button onClick={() => setTab('ofertas')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === 'ofertas' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
          Ofertas
        </button>
        )}
      </div>

      {/* ---- COMBOS TAB ---- */}
      {tab === 'combos' && (
        <>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" value={comboSearch}
              onChange={e => setComboSearch(e.target.value)}
              placeholder="Buscar combo por nombre o código..."
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none" />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-500 cursor-pointer select-none">
            <input type="checkbox" checked={mostrarCombosInactivos}
              onChange={e => setMostrarCombosInactivos(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
            Mostrar desactivados
          </label>

          {filteredCombos.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 font-medium text-sm">
                {comboSearch.trim() ? 'No se encontraron combos' : 'No hay combos activos'}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCombos.map(combo => (
              <div key={combo.id} className={`bg-white rounded-xl border p-5 transition-all ${combo.activo ? 'border-gray-200 hover:border-indigo-300 hover:shadow-md' : 'border-gray-200 opacity-50'}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{combo.descCombo}</p>
                    <p className="text-xs text-gray-400 font-mono mt-0.5">{combo.codCombo}</p>
                  </div>
                  <span className="text-xl font-bold text-indigo-600 shrink-0 ml-3">${combo.precio.toFixed(0)}</span>
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
                  <button onClick={() => abrirComboModal(combo)} className="text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors">Editar</button>
                  {combo.activo
                    ? <button onClick={() => handleEliminarCombo(combo.id)} className="text-xs font-medium text-red-400 hover:text-red-600 transition-colors">Desactivar</button>
                    : <button onClick={() => handleReactivarCombo(combo.id)} className="text-xs font-medium text-green-600 hover:text-green-800 transition-colors">Reactivar</button>
                  }
                  <button onClick={() => handleEliminarDefinitivoCombo(combo.id)} className="text-gray-300 hover:text-red-500 transition-colors" title="Eliminar permanentemente">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ---- OFERTAS TAB ---- */}
      {tab === 'ofertas' && (
        <>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" value={ofertaSearch}
              onChange={e => setOfertaSearch(e.target.value)}
              placeholder="Buscar oferta por producto o código..."
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none" />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-500 cursor-pointer select-none">
            <input type="checkbox" checked={mostrarOfertasInactivas}
              onChange={e => setMostrarOfertasInactivas(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
            Mostrar desactivadas
          </label>

          {filteredOfertas.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 font-medium text-sm">
                {ofertaSearch.trim() ? 'No se encontraron ofertas' : 'No hay ofertas activas'}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredOfertas.map(oferta => {
              const prod = productos.find(p => p.id === oferta.productoId)
              const precioOriginal = prod?.precio ?? 0
              const precioOferta = precioOriginal * (1 - oferta.descuento / 100)
              const ahora = new Date()
              const fin = new Date(oferta.fechaFin)
              const vigente = fin > ahora

              return (
                <div key={oferta.id} className={`bg-white rounded-xl border p-5 transition-all ${!oferta.activo ? 'border-gray-200 opacity-50' : vigente ? 'border-amber-200 hover:border-amber-400 hover:shadow-md' : 'border-gray-200 opacity-60'}`}>
                  <div className="flex items-start justify-between">


                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{oferta.productoNombre ?? `ID ${oferta.productoId}`}</p>
                      <p className="text-xs text-gray-400 font-mono mt-0.5">{oferta.codigoBarra}</p>
                    </div>
                    <span className="text-xl font-bold text-amber-600 shrink-0 ml-3">${precioOferta.toFixed(0)}</span>
                  </div>

                  <div className="mt-3 space-y-1">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-gray-400 line-through font-mono">${precioOriginal.toFixed(0)}</span>
                      <span className="px-1.5 py-0.5 rounded bg-green-100 text-green-700 font-semibold">-{oferta.descuento}%</span>
                      <span className="text-gray-400">→</span>
                      <span className="text-green-700 font-semibold font-mono">${precioOferta.toFixed(0)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      {!oferta.activo
                        ? <span className="text-red-500 font-medium">Desactivada</span>
                        : <span className={vigente ? 'text-green-600 font-medium' : 'text-red-500 font-medium'}>{vigente ? 'Vigente' : 'Expirada'}</span>
                      }
                      <span>·</span>
                      <span>{new Date(oferta.fechaInicio).toLocaleDateString()}</span>
                      <span>→</span>
                      <span>{fin.toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 mt-4 pt-3 border-t border-gray-100">
                    <button onClick={() => abrirOfertaModal(oferta)} className="text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors">Editar</button>
                    {oferta.activo
                      ? <button onClick={() => handleEliminarOferta(oferta.id)} className="text-xs font-medium text-red-400 hover:text-red-600 transition-colors">Desactivar</button>
                      : <button onClick={() => handleReactivarOferta(oferta.id)} className="text-xs font-medium text-green-600 hover:text-green-800 transition-colors">Reactivar</button>
                    }
                    <button onClick={() => handleEliminarDefinitivoOferta(oferta.id)} className="text-gray-300 hover:text-red-500 transition-colors" title="Eliminar permanentemente">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* ---- COMBO MODAL ---- */}
      {showComboModal && <ComboFormModal
        form={comboForm}
        setForm={setComboForm}
        editId={comboEditId}
        productos={productos}
        onSubmit={handleComboSubmit}
        onClose={cerrarComboModal}
        notifyError={notifyError}
      />}

      {/* ---- OFERTA MODAL ---- */}
      {showOfertaModal && <OfertaFormModal
        form={ofertaForm}
        setForm={setOfertaForm}
        editId={ofertaEditId}
        productos={productos}
        onSubmit={handleOfertaSubmit}
        onClose={cerrarOfertaModal}
      />}
    </div>

    <Dialog
      open={confirmDelete !== null}
      onClose={() => setConfirmDelete(null)}
      title={confirmDelete?.type === 'combo' ? 'Eliminar combo' : 'Eliminar oferta'}
      description="¿Eliminar permanentemente? Esta acción no se puede deshacer."
      footer={
        <div className="flex items-center justify-end gap-3 w-full">
          <button
            onClick={() => setConfirmDelete(null)}
            className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() => {
              if (confirmDelete?.type === 'combo') confirmarEliminarCombo()
              else if (confirmDelete?.type === 'oferta') confirmarEliminarOferta()
            }}
            className="px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition-colors"
          >
            Eliminar
          </button>
        </div>
      }
    />
    </>
  )
}

// ===================================================================
// COMBO FORM MODAL
// ===================================================================
function ComboFormModal({
  form, setForm, editId, productos, onSubmit, onClose, notifyError,
}: {
  form: { codCombo: string; descCombo: string; precio: string; fechaInicio: string; fechaFin: string; diasSemana: string[]; items: ComboItemDto[] }
  setForm: React.Dispatch<React.SetStateAction<typeof form>>
  editId: number | null
  productos: ProductoDto[]
  onSubmit: (e: React.FormEvent) => void
  onClose: () => void
  notifyError: (msg: string) => void
}) {
  const [prodSearch, setProdSearch] = useState('')
  const [cantidad, setCantidad] = useState('1')
  const [showProdDropdown, setShowProdDropdown] = useState(false)
  const [prodHighIdx, setProdHighIdx] = useState(-1)
  const [selectedProductId, setSelectedProductId] = useState(0)
  const prodInputRef = useRef<HTMLInputElement>(null)
  const cantInputRef = useRef<HTMLInputElement>(null)
  const descManual = useRef(editId !== null)

  // Auto-generar descripción concatenando nombres de productos
  useEffect(() => {
    if (descManual.current) return
    const nombres = form.items
      .map(i => i.productoNombre)
      .filter((n): n is string => !!n)
    if (nombres.length > 0) {
      setForm(prev => ({ ...prev, descCombo: nombres.join(' + ') }))
    } else if (form.items.length === 0 && editId === null) {
      setForm(prev => ({ ...prev, descCombo: '' }))
    }
  }, [form.items, editId])

  const itemsYaAgregados = useMemo(() =>
    new Set(form.items.map(i => i.productoId)),
    [form.items])

  const productosFiltrados = useMemo(() => {
    if (!prodSearch.trim()) return productos
    const q = prodSearch.toLowerCase()
    return productos.filter(p =>
      p.nombre.toLowerCase().includes(q) ||
      p.codigoBarra.toLowerCase().includes(q)
    )
  }, [productos, prodSearch])

  function seleccionarDelDropdown(id: number) {
    if (itemsYaAgregados.has(id)) {
      notifyError('El producto ya está en el combo')
      setProdSearch('')
      setSelectedProductId(0)
      setShowProdDropdown(false)
      return
    }
    const prod = productos.find(p => p.id === id)!
    setProdSearch(prod.nombre)
    setSelectedProductId(id)
    setShowProdDropdown(false)
    setProdHighIdx(-1)
    setTimeout(() => cantInputRef.current?.focus(), 50)
  }

  function agregarProductoSeleccionado() {
    if (selectedProductId <= 0) {
      if (!prodSearch.trim() && productosFiltrados.length > 0) {
        seleccionarDelDropdown(productosFiltrados[0].id)
        return
      }
      const match = productos.find(p =>
        p.nombre.toLowerCase() === prodSearch.trim().toLowerCase() ||
        p.codigoBarra === prodSearch.trim()
      )
      if (match) {
        setSelectedProductId(match.id)
        setProdSearch(match.nombre)
        return
      }
      notifyError('Seleccioná un producto de la lista')
      return
    }
    if (itemsYaAgregados.has(selectedProductId)) {
      notifyError('El producto ya está en el combo')
      setProdSearch('')
      setSelectedProductId(0)
      return
    }
    const cant = parseFloat(cantidad)
    if (isNaN(cant) || cant <= 0) {
      notifyError('Cantidad inválida')
      return
    }
    const prod = productos.find(p => p.id === selectedProductId)
    if (!prod) return
    setForm(prev => ({
      ...prev,
      items: [...prev.items, {
        productoId: selectedProductId,
        cantidad: cant,
        productoNombre: prod.nombre,
        codigoBarra: prod.codigoBarra,
      }],
    }))
    setProdSearch('')
    setCantidad('1')
    setSelectedProductId(0)
    prodInputRef.current?.focus()
  }

  function quitarItem(idx: number) {
    setForm(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== idx) }))
  }

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <form onSubmit={onSubmit} onClick={e => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-800">
            {editId !== null ? 'Editar combo' : 'Nuevo combo'}
          </h3>
          <button type="button" onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100">
            <X size={16} />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Código *</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-mono text-gray-400 select-none">{COMBO_PREFIX}</span>
              <input type="text"
                value={form.codCombo.startsWith(COMBO_PREFIX) ? form.codCombo.substring(COMBO_PREFIX.length) : form.codCombo}
                onChange={e => {
                  const val = e.target.value.trim()
                  setForm(f => ({ ...f, codCombo: val ? COMBO_PREFIX + val : '' }))
                }}
                className="w-full pl-14 pr-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                placeholder="4" />
            </div>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-1">Descripción *</label>
            <input type="text" value={form.descCombo}
              onChange={e => { descManual.current = true; setForm(f => ({ ...f, descCombo: e.target.value })) }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
              placeholder="Combo Hamburguesa + Papas + Bebida" />
          </div>
        </div>

        {/* Recurrencia */}
        <div className="border-t border-gray-100 pt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Recurrencia (opcional)</h4>
          <div className="grid grid-cols-2 gap-3 mb-2">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Fecha inicio</label>
              <input type="datetime-local" value={form.fechaInicio}
                onChange={e => setForm(f => ({ ...f, fechaInicio: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Fecha fin</label>
              <input type="datetime-local" value={form.fechaFin}
                onChange={e => setForm(f => ({ ...f, fechaFin: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none" />
            </div>
          </div>
          <DiasSemanaSelector selected={form.diasSemana}
            onChange={dias => setForm(f => ({ ...f, diasSemana: dias }))} />
        </div>

        {/* Productos del combo — searchable select */}
        <div className="border-t border-gray-100 pt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Productos del combo</h4>
          <div className="flex gap-2 items-end">
            <div className="flex-1 relative">
              <label className="block text-xs text-gray-500 mb-1">Producto</label>
              <input ref={prodInputRef} type="text" value={prodSearch}
                onChange={e => { setProdSearch(e.target.value); setShowProdDropdown(true); setProdHighIdx(-1); setSelectedProductId(0) }}
                onFocus={() => { if (prodSearch) setShowProdDropdown(true) }}
                onBlur={() => setTimeout(() => setShowProdDropdown(false), 200)}
                onKeyDown={e => {
                  if (!showProdDropdown || productosFiltrados.length === 0) return
                  if (e.key === 'ArrowDown') { e.preventDefault(); setProdHighIdx(Math.min(prodHighIdx + 1, productosFiltrados.length - 1)) }
                  else if (e.key === 'ArrowUp') { e.preventDefault(); setProdHighIdx(Math.max(prodHighIdx - 1, 0)) }
                  else if (e.key === 'Enter' && prodHighIdx >= 0) {
                    e.preventDefault()
                    seleccionarDelDropdown(productosFiltrados[prodHighIdx].id)
                  }
                }}
                placeholder="Buscar producto..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none" />
              {showProdDropdown && productosFiltrados.length > 0 && (
                <ul className="absolute z-30 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto text-[13px]">
                  {productosFiltrados.map((p, i) => (
                    <li key={p.id}
                      onMouseDown={() => seleccionarDelDropdown(p.id)}
                      onMouseEnter={() => setProdHighIdx(i)}
                      className={`px-3 py-2 cursor-pointer flex items-center justify-between gap-2 ${i === prodHighIdx ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-gray-50'} ${itemsYaAgregados.has(p.id) ? 'opacity-40' : ''}`}>
                      <span className="truncate">{p.nombre}</span>
                      <span className="text-gray-400 shrink-0 font-mono text-[11px]">${p.precio.toFixed(0)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="w-24">
              <label className="block text-xs text-gray-500 mb-1">Cantidad</label>
              <input ref={cantInputRef} type="number" min="0.001" step="0.001" value={cantidad}
                onChange={e => setCantidad(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none" />
            </div>
            <button type="button" onClick={agregarProductoSeleccionado}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
              + Agregar
            </button>
          </div>

          {form.items.length > 0 && (
            <div className="mt-3">
              <div className="grid grid-cols-[1fr_56px_72px_72px_40px] gap-1.5 px-2 mb-1">
                <span className="text-[11px] text-gray-400 font-medium">Producto</span>
                <span className="text-[11px] text-gray-400 font-medium text-center">Cant</span>
                <span className="text-[11px] text-gray-400 font-medium text-right">Costo u.</span>
                <span className="text-[11px] text-gray-400 font-medium text-right">Vta. u.</span>
                <span />
              </div>
              {form.items.map((item, i) => {
                const prod = productos.find(p => p.id === item.productoId)
                const costoUnit = prod?.costo ?? 0
                const ventaUnit = prod?.precio ?? 0
                return (
                  <div key={i} className="grid grid-cols-[1fr_56px_72px_72px_40px] gap-1.5 items-center bg-gray-50 rounded-lg px-2 py-1.5 text-sm mb-1">
                    <span className="truncate font-medium">{item.productoNombre ?? prod?.nombre ?? `ID ${item.productoId}`}</span>
                    <span className="text-center font-mono text-xs tabular-nums">{item.cantidad}</span>
                    <span className="text-right font-mono text-xs tabular-nums text-gray-500">${costoUnit.toFixed(0)}</span>
                    <span className="text-right font-mono text-xs tabular-nums text-gray-500">${ventaUnit.toFixed(0)}</span>
                    <button type="button" onClick={() => quitarItem(i)} className="flex justify-center text-red-400 hover:text-red-600">
                      <X size={14} />
                    </button>
                  </div>
                )
              })}
              {(() => {
                const costoTotal = form.items.reduce((t, i) => { const p = productos.find(x => x.id === i.productoId); return t + (p?.costo ?? 0) * i.cantidad }, 0)
                const ventaTotal = form.items.reduce((t, i) => { const p = productos.find(x => x.id === i.productoId); return t + (p?.precio ?? 0) * i.cantidad }, 0)
                const comboPrecio = parseFloat(form.precio) || 0
                const ahorro = ventaTotal - comboPrecio
                const descuento = ventaTotal > 0 ? (ahorro / ventaTotal * 100).toFixed(0) : '0'
                return (
                  <div className="mt-2 space-y-1.5">
                    <div className="flex items-center justify-between bg-amber-50 rounded-lg px-3 py-2 text-sm border border-amber-200">
                      <span className="text-xs text-gray-500">Costo total</span>
                      <span className="font-mono font-semibold tabular-nums text-gray-700">${costoTotal.toFixed(0)}</span>
                    </div>
                    <div className="flex items-center justify-between bg-indigo-50 rounded-lg px-3 py-2 text-sm border border-indigo-100">
                      <span className="text-xs text-gray-500">Suma venta individual</span>
                      <span className="font-mono font-semibold tabular-nums text-indigo-600">${ventaTotal.toFixed(0)}</span>
                    </div>
                    <div className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm border ${comboPrecio > 0 && comboPrecio < costoTotal ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'}`}>
                      <label className="text-xs text-gray-500">Precio combo</label>
                      <div className="flex items-center gap-1.5">
                        {costoTotal > 0 && comboPrecio > 0 && comboPrecio < costoTotal && (
                          <AlertTriangle size={15} className="text-red-500 shrink-0" strokeWidth={2.5} />
                        )}
                        <input type="number" step="0.01" value={form.precio}
                          onChange={e => setForm(f => ({ ...f, precio: e.target.value }))}
                          className="w-24 text-right px-2 py-1 border border-gray-300 rounded text-sm font-mono font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                          placeholder="2000" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between rounded-lg px-3 py-2 text-sm border"
                      style={{ backgroundColor: ahorro >= 0 ? '#f0fdf4' : '#fef2f2', borderColor: ahorro >= 0 ? '#bbf7d0' : '#fecaca' }}>
                      <span className="text-xs" style={{ color: ahorro >= 0 ? '#166534' : '#991b1b' }}>
                        {ahorro >= 0 ? 'Ahorro' : 'Pérdida'} ({descuento}%)
                      </span>
                      <span className="font-mono font-bold tabular-nums" style={{ color: ahorro >= 0 ? '#15803d' : '#dc2626' }}>
                        {ahorro >= 0 ? '-' : '+'}${Math.abs(ahorro).toFixed(0)}
                      </span>
                    </div>
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
    </div>
  )
}

// ===================================================================
// OFERTA FORM MODAL
// ===================================================================
function OfertaFormModal({
  form, setForm, editId, productos, onSubmit, onClose,
}: {
  form: { fechaInicio: string; fechaFin: string; productoId: number; productoNombre: string; descuento: string; diasSemana: string[] }
  setForm: React.Dispatch<React.SetStateAction<typeof form>>
  editId: number | null
  productos: ProductoDto[]
  onSubmit: (e: React.FormEvent) => void
  onClose: () => void
}) {
  const [prodSearch, setProdSearch] = useState('')
  const [showProdDropdown, setShowProdDropdown] = useState(false)
  const [prodHighIdx, setProdHighIdx] = useState(-1)
  const prodInputRef = useRef<HTMLInputElement>(null)

  const productosFiltrados = useMemo(() => {
    if (!prodSearch.trim()) return productos
    const q = prodSearch.toLowerCase()
    return productos.filter(p =>
      p.nombre.toLowerCase().includes(q) ||
      p.codigoBarra.toLowerCase().includes(q)
    )
  }, [productos, prodSearch])

  function seleccionarProducto(id: number) {
    const prod = productos.find(p => p.id === id)!
    setForm(f => ({ ...f, productoId: id, productoNombre: prod.nombre }))
    setProdSearch(prod.nombre)
    setShowProdDropdown(false)
    setProdHighIdx(-1)
  }

  const precioOriginal = (() => {
    if (form.productoId > 0) {
      const prod = productos.find(p => p.id === form.productoId)
      return prod?.precio ?? 0
    }
    return 0
  })()
  const desc = parseFloat(form.descuento) || 0
  const precioOferta = precioOriginal * (1 - desc / 100)

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <form onSubmit={onSubmit} onClick={e => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-800">
            {editId !== null ? 'Editar oferta' : 'Nueva oferta'}
          </h3>
          <button type="button" onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100">
            <X size={16} />
          </button>
        </div>

        {/* Searchable product select */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Producto *</label>
          <div className="relative">
            <input ref={prodInputRef} type="text" value={form.productoId > 0 ? form.productoNombre : prodSearch}
              onFocus={() => {
                if (form.productoId > 0) {
                  setProdSearch('')
                  setForm(f => ({ ...f, productoId: 0, productoNombre: '' }))
                }
                setShowProdDropdown(true)
              }}
              onChange={e => {
                setProdSearch(e.target.value)
                if (form.productoId > 0) setForm(f => ({ ...f, productoId: 0, productoNombre: '' }))
                setShowProdDropdown(true)
                setProdHighIdx(-1)
              }}
              onBlur={() => setTimeout(() => setShowProdDropdown(false), 200)}
              onKeyDown={e => {
                if (!showProdDropdown || productosFiltrados.length === 0) return
                if (e.key === 'ArrowDown') { e.preventDefault(); setProdHighIdx(Math.min(prodHighIdx + 1, productosFiltrados.length - 1)) }
                else if (e.key === 'ArrowUp') { e.preventDefault(); setProdHighIdx(Math.max(prodHighIdx - 1, 0)) }
                else if (e.key === 'Enter' && prodHighIdx >= 0) {
                  e.preventDefault()
                  seleccionarProducto(productosFiltrados[prodHighIdx].id)
                }
              }}
              placeholder="Buscar producto..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none" />
            {showProdDropdown && productosFiltrados.length > 0 && (
              <ul className="absolute z-30 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto text-[13px]">
                {productosFiltrados.map((p, i) => (
                  <li key={p.id}
                    onMouseDown={() => seleccionarProducto(p.id)}
                    onMouseEnter={() => setProdHighIdx(i)}
                    className={`px-3 py-2 cursor-pointer flex items-center justify-between gap-2 ${i === prodHighIdx ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-gray-50'}`}>
                    <span className="truncate">{p.nombre}</span>
                    <span className="text-gray-400 shrink-0 font-mono text-[11px]">{p.codigoBarra}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Descuento (%) *</label>
          <input type="number" step="0.01" min="0.01" max="100" value={form.descuento}
            onChange={e => setForm(f => ({ ...f, descuento: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-mono"
            placeholder="15" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Fecha inicio *</label>
            <input type="datetime-local" value={form.fechaInicio}
              onChange={e => setForm(f => ({ ...f, fechaInicio: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Fecha fin *</label>
            <input type="datetime-local" value={form.fechaFin}
              onChange={e => setForm(f => ({ ...f, fechaFin: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none" />
          </div>
        </div>

        <DiasSemanaSelector selected={form.diasSemana}
          onChange={dias => setForm(f => ({ ...f, diasSemana: dias }))} />

        {form.productoId > 0 && form.descuento && (
          <div className="bg-amber-50 rounded-lg px-4 py-3 border border-amber-200">
            <p className="text-sm text-amber-800">
              <span className="font-semibold">{form.productoNombre || 'Producto'}</span>
              {' '}— Precio original: <span className="font-mono font-semibold">${precioOriginal.toFixed(0)}</span>
              {' → '}
              <span className="font-mono font-bold text-green-700">${precioOferta.toFixed(0)}</span>
              {' '}(-{desc}%)
            </p>
          </div>
        )}

        <button type="submit"
          className="w-full py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-colors">
          {editId !== null ? 'Guardar cambios' : 'Crear oferta'}
        </button>
      </form>
    </div>
  )
}
