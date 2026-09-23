import { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { HelpCircle } from 'lucide-react'
import { HELP_KEYS } from '../help/content'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useNotification } from '../context/NotificationContext'
import { COMBO_PREFIX } from '../lib/constants'
import { normalizarCodigoBarra } from '../lib/codigoBarra'
import DiasSemanaSelector from '../components/shared/DiasSemanaSelector'
import type { ComboDto, ProductoDto, ComboUpsertDto, ComboItemDto, OfertaDto, OfertaUpsertDto, SucursalDto } from '../types'
import { Plus, Minus, Search, AlertTriangle, Trash2, Sandwich, Check, Printer, Tag } from 'lucide-react'
import Button from '../components/ui/Button'
import Dialog from '../components/ui/Dialog'
import PrefixedCodeInput from '../components/ui/PrefixedCodeInput'
import BarcodePrintDialog from '../components/BarcodePrintDialog'
import LabelPrintDialog from '../components/LabelPrintDialog'

type Tab = 'combos' | 'ofertas'

export default function CombosPage() {
  const navigate = useNavigate()
  const { notifyError, notifySuccess } = useNotification()
  const { user } = useAuth()
  const { sucursal } = useOutletContext<{ sucursal: SucursalDto | null }>()
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
    descuento: '0',
    diasSemana: [] as string[],
  })

  useEffect(() => {
    cargarCombos()
    cargarOfertas()
    api.productos.listar(sucursal?.id).then(setProductos).catch(() => {})
  }, [sucursal?.id])

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
  function siguienteCodigoCombo(): string {
    const numeros = combos
      .map(c => /^COMB(\d+)$/i.exec((c.codCombo ?? '').trim()))
      .filter((m): m is RegExpExecArray => m !== null)
      .map(m => Number(m[1]))
    const siguiente = (numeros.length > 0 ? Math.max(...numeros) : 0) + 1
    return `${COMBO_PREFIX}${siguiente}`
  }

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
      setComboForm({ codCombo: siguienteCodigoCombo(), descCombo: '', precio: '0', fechaInicio: '', fechaFin: '', diasSemana: [], items: [] })
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

    const codigo = comboForm.codCombo.trim().toUpperCase()
    const duplicado = combos.find(c => c.codCombo.toUpperCase() === codigo && c.id !== comboEditId)
    if (duplicado) {
      notifyError(`Ya existe el combo «${duplicado.descCombo}» con el código ${duplicado.codCombo}`)
      return
    }

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
      setOfertaForm({ fechaInicio: '', fechaFin: '', productoId: 0, productoNombre: '', descuento: '0', diasSemana: [] })
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
          <h2 className="text-xl font-bold text-black">Combos y Ofertas</h2>
          <p className="text-sm text-black mt-0.5">
            {tab === 'combos' ? `${combos.length} combos` : `${ofertas.length} ofertas`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate(`/ayuda?key=${HELP_KEYS.ofertas}`)}
            className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:text-[oklch(0.52_0.255_278)] hover:bg-gray-100 transition-colors"
            aria-label="Ayuda"
            title="Ayuda"
          >
            <HelpCircle size={17} />
          </button>
          <Button variant="primary" size="md"
            onClick={() => tab === 'combos' ? abrirComboModal() : abrirOfertaModal()}
            icon={<Plus size={16} />}
          >
            {tab === 'combos' ? 'Nuevo combo' : 'Nueva oferta'}
          </Button>
        </div>
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
          <label className="flex items-center gap-2 text-sm text-black cursor-pointer select-none">
            <input type="checkbox" checked={mostrarCombosInactivos}
              onChange={e => setMostrarCombosInactivos(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
            Mostrar desactivados
          </label>

          {filteredCombos.length === 0 && (
            <div className="text-center py-12">
              <p className="text-black font-medium text-sm">
                {comboSearch.trim() ? 'No se encontraron combos' : 'No hay combos activos'}
              </p>
            </div>
          )}

          <div className="flex flex-col gap-1">
            <div className="grid grid-cols-[110px_minmax(0,1fr)_100px_170px] items-center gap-x-2 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-black">
              <span className="truncate">Código</span>
              <span className="truncate">Descripción</span>
              <span className="text-right truncate">Precio</span>
              <span className="text-right truncate">Acciones</span>
            </div>
            {filteredCombos.map(combo => (
              <div
                key={combo.id}
                onClick={() => abrirComboModal(combo)}
                className={`grid grid-cols-[110px_minmax(0,1fr)_100px_170px] items-center gap-x-2 w-full px-3 py-2 rounded-lg border-2 transition-colors bg-white cursor-pointer ${
                  combo.activo
                    ? 'border-gray-300 hover:bg-indigo-50/50 hover:border-indigo-200'
                    : 'border-gray-200 opacity-60'
                }`}
              >
                <span className="font-mono text-[12px] text-black truncate">{combo.codCombo}</span>
                <span className="flex items-center gap-2 min-w-0">
                  <span className="font-medium text-black truncate">{combo.descCombo}</span>
                  {!combo.activo && (
                    <span className="shrink-0 rounded-full bg-gray-200 px-2 py-0.5 text-[10px] font-semibold text-black">Desactivado</span>
                  )}
                </span>
                <span className="text-right font-bold tabular-nums text-black">${combo.precio.toFixed(2)}</span>
                <span className="flex items-center justify-end gap-3" onClick={e => e.stopPropagation()}>
                  <button type="button" onClick={() => abrirComboModal(combo)} className="text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors">Editar</button>
                  {combo.activo
                    ? <button type="button" onClick={() => handleEliminarCombo(combo.id)} className="text-xs font-medium text-red-400 hover:text-red-600 transition-colors">Desactivar</button>
                    : <button type="button" onClick={() => handleReactivarCombo(combo.id)} className="text-xs font-medium text-green-600 hover:text-green-800 transition-colors">Reactivar</button>
                  }
                  <button type="button" onClick={() => handleEliminarDefinitivoCombo(combo.id)} className="text-gray-300 hover:text-red-500 transition-colors" title="Eliminar permanentemente">
                    <Trash2 size={14} />
                  </button>
                </span>
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
          <label className="flex items-center gap-2 text-sm text-black cursor-pointer select-none">
            <input type="checkbox" checked={mostrarOfertasInactivas}
              onChange={e => setMostrarOfertasInactivas(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
            Mostrar desactivadas
          </label>

          {filteredOfertas.length === 0 && (
            <div className="text-center py-12">
              <p className="text-black font-medium text-sm">
                {ofertaSearch.trim() ? 'No se encontraron ofertas' : 'No hay ofertas activas'}
              </p>
            </div>
          )}

          <div className="flex flex-col gap-1">
            <div className="grid grid-cols-[110px_minmax(0,1fr)_170px_170px] items-center gap-x-2 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-black">
              <span className="truncate">Código</span>
              <span className="truncate">Producto</span>
              <span className="text-right truncate">Precio</span>
              <span className="text-right truncate">Acciones</span>
            </div>
            {filteredOfertas.map(oferta => {
              const prod = productos.find(p => p.id === oferta.productoId)
              const precioOriginal = prod?.precio ?? 0
              const precioOferta = precioOriginal * (1 - oferta.descuento / 100)
              const ahora = new Date()
              const fin = new Date(oferta.fechaFin)
              const vigente = fin > ahora

              return (
                <div
                  key={oferta.id}
                  onClick={() => abrirOfertaModal(oferta)}
                  className={`grid grid-cols-[110px_minmax(0,1fr)_170px_170px] items-center gap-x-2 w-full px-3 py-2 rounded-lg border-2 transition-colors bg-white cursor-pointer ${
                    !oferta.activo
                      ? 'border-gray-200 opacity-60'
                      : vigente
                        ? 'border-amber-200 hover:bg-amber-50/50 hover:border-amber-300'
                        : 'border-gray-300 hover:bg-indigo-50/50 hover:border-indigo-200'
                  }`}
                >
                  <span className="font-mono text-[12px] text-black truncate">{oferta.codigoBarra}</span>
                  <span className="flex items-center gap-2 min-w-0">
                    <span className="font-medium text-black truncate">{oferta.productoNombre ?? `ID ${oferta.productoId}`}</span>
                    {!oferta.activo
                      ? <span className="shrink-0 rounded-full bg-gray-200 px-2 py-0.5 text-[10px] font-semibold text-black">Desactivada</span>
                      : <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${vigente ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{vigente ? 'Vigente' : 'Expirada'}</span>
                    }
                  </span>
                  <span className="flex items-center justify-end gap-1.5 tabular-nums">
                    <span className="text-[11px] text-black line-through">${precioOriginal.toFixed(0)}</span>
                    <span className="rounded bg-green-100 px-1.5 py-0.5 text-[10px] font-semibold text-green-700">-{oferta.descuento}%</span>
                    <span className="font-bold text-black">${precioOferta.toFixed(2)}</span>
                  </span>
                  <span className="flex items-center justify-end gap-3" onClick={e => e.stopPropagation()}>
                    <button type="button" onClick={() => abrirOfertaModal(oferta)} className="text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors">Editar</button>
                    {oferta.activo
                      ? <button type="button" onClick={() => handleEliminarOferta(oferta.id)} className="text-xs font-medium text-red-400 hover:text-red-600 transition-colors">Desactivar</button>
                      : <button type="button" onClick={() => handleReactivarOferta(oferta.id)} className="text-xs font-medium text-green-600 hover:text-green-800 transition-colors">Reactivar</button>
                    }
                    <button type="button" onClick={() => handleEliminarDefinitivoOferta(oferta.id)} className="text-gray-300 hover:text-red-500 transition-colors" title="Eliminar permanentemente">
                      <Trash2 size={14} />
                    </button>
                  </span>
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
        combos={combos}
        onSubmit={handleComboSubmit}
        onClose={cerrarComboModal}
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
            className="px-4 py-2 bg-gray-100 text-black rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors"
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
  form, setForm, editId, productos, combos, onSubmit, onClose,
}: {
  form: { codCombo: string; descCombo: string; precio: string; fechaInicio: string; fechaFin: string; diasSemana: string[]; items: ComboItemDto[] }
  setForm: React.Dispatch<React.SetStateAction<typeof form>>
  editId: number | null
  productos: ProductoDto[]
  combos: ComboDto[]
  onSubmit: (e: React.FormEvent) => void
  onClose: () => void
}) {
  const [prodSearch, setProdSearch] = useState('')
  const [codigoAImprimir, setCodigoAImprimir] = useState<{ codigo: string; origen: string } | null>(null)
  const [showLabelPrint, setShowLabelPrint] = useState(false)
  const descManual = useRef(editId !== null)

  const comboConMismoCodigo = useMemo(() => {
    const cod = form.codCombo.trim().toUpperCase()
    if (!cod) return null
    return combos.find(c => c.codCombo.toUpperCase() === cod && c.id !== editId) ?? null
  }, [form.codCombo, combos, editId])

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

  const productosDisponibles = useMemo(() =>
    productos.filter(p => !p.esBulto),
    [productos])

  const productosLista = useMemo(() => {
    const seleccionados = new Set(form.items.map(i => i.productoId))
    const base = productosDisponibles.filter(p => !seleccionados.has(p.id))
    const q = prodSearch.trim().toLowerCase()
    if (!q) return base
    return base.filter(p =>
      p.nombre.toLowerCase().includes(q) ||
      (p.codigoBarra ?? '').toLowerCase().includes(q)
    )
  }, [productosDisponibles, prodSearch, form.items])

  const totalVenta = useMemo(() => form.items.reduce((t, i) => {
    const p = productos.find(x => x.id === i.productoId)
    return t + (p?.precio ?? 0) * i.cantidad
  }, 0), [form.items, productos])

  const totalCosto = useMemo(() => form.items.reduce((t, i) => {
    const p = productos.find(x => x.id === i.productoId)
    return t + (p?.costo ?? 0) * i.cantidad
  }, 0), [form.items, productos])

  const precioCombo = parseFloat(form.precio) || 0
  const descuento = precioCombo > 0 ? totalVenta - precioCombo : 0

  function agregarProducto(p: ProductoDto) {
    setForm(prev => prev.items.some(i => i.productoId === p.id)
      ? prev
      : {
          ...prev,
          items: [...prev.items, {
            productoId: p.id,
            cantidad: 1,
            productoNombre: p.nombre,
            codigoBarra: p.codigoBarra,
          }],
        })
    setProdSearch('')
  }

  function quitarProducto(productoId: number) {
    setForm(prev => ({ ...prev, items: prev.items.filter(i => i.productoId !== productoId) }))
  }

  function setCantidad(productoId: number, cantidad: number) {
    if (cantidad <= 0) { quitarProducto(productoId); return }
    setForm(prev => ({
      ...prev,
      items: prev.items.map(i => i.productoId === productoId ? { ...i, cantidad } : i),
    }))
  }

  function limpiarTodo() {
    setForm(prev => ({ ...prev, items: [] }))
  }

  function handleSearchChange(valor: string) {
    setProdSearch(valor)
    const buscado = normalizarCodigoBarra(valor).toLowerCase()
    if (!buscado) return
    const match = productosDisponibles.find(p =>
      (p.codigoBarra ?? '').trim() !== '' &&
      normalizarCodigoBarra(p.codigoBarra).toLowerCase() === buscado
    )
    if (!match) return
    agregarProducto(match)
  }

  return (
    <>
    <Dialog
      open
      onClose={onClose}
      closeOnBackdrop={false}
      title="COMBO"
      icon={Sandwich}
      highlight={form.descCombo.trim() || (editId !== null ? 'Editar combo' : 'Nuevo combo')}
      description="Editá la información del combo y seleccioná los productos que lo componen."
      width="2xl"
      fillHeight
      footer={
        <div className="flex items-center justify-end gap-3 w-full">
          <Button variant="secondary" size="md" icon={<Printer size={16} />} type="button" onClick={() => setShowLabelPrint(true)}>
            Imprimir etiqueta
          </Button>
          <Button variant="destructive" size="md" className="min-w-[128px]" icon={<Trash2 size={16} />} type="button" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" size="md" className="min-w-[128px]" icon={<Check size={18} />} type="submit" form="combo-form" disabled={comboConMismoCodigo !== null}>
            {editId !== null ? 'Guardar cambios' : 'Crear combo'}
          </Button>
        </div>
      }
    >
      <form id="combo-form" className="lg:flex-1 lg:min-h-0 lg:flex lg:flex-col" onSubmit={onSubmit} onKeyDown={e => {
        const target = e.target as HTMLElement
        if (e.key === 'Enter' && target.tagName !== 'TEXTAREA') {
          e.preventDefault()
        }
      }}>
        <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_1fr] gap-4 items-start lg:items-stretch lg:flex-1 lg:min-h-0">
          {/* ── Columna izquierda ── */}
          <div className="min-w-0 flex flex-col gap-4 lg:min-h-0">
            {/* Información general */}
            <div className="shrink-0">
              <h3 className="text-xs font-semibold text-black uppercase tracking-wider mb-2">Información general</h3>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-black mb-1">Código *</label>
                  <PrefixedCodeInput
                    prefix={COMBO_PREFIX}
                    value={form.codCombo}
                    onChange={codCombo => setForm(f => ({ ...f, codCombo }))}
                    size="lg"
                    placeholder="Auto-generado"
                    trailing={form.codCombo ? (
                      <button type="button" title="Imprimir código de barras" onClick={() => setCodigoAImprimir({ codigo: form.codCombo, origen: 'Código de combo' })}
                        className="text-gray-400 hover:text-[var(--color-primary)] transition-colors">
                        <Printer size={13} />
                      </button>
                    ) : undefined}
                  />
                  {comboConMismoCodigo && (
                    <p className="mt-0.5 text-[11px] font-medium text-red-600">
                      Ya existe «{comboConMismoCodigo.descCombo}» con este código
                    </p>
                  )}
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-black mb-1">Nombre / Descripción *</label>
                  <input type="text" value={form.descCombo}
                    onChange={e => { descManual.current = true; setForm(f => ({ ...f, descCombo: e.target.value })) }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-black focus:ring-2 focus:ring-[var(--color-primary-ring)] focus:border-[var(--color-primary)] outline-none"
                    placeholder="Combo Hamburguesa + Papas + Bebida" />
                </div>
              </div>
            </div>

            {/* Recurrencia */}
            <div className="shrink-0">
              <h3 className="text-xs font-semibold text-black uppercase tracking-wider mb-2">Recurrencia (opcional)</h3>
              <div className="grid grid-cols-2 gap-3 mb-2">
                <div>
                  <label className="block text-xs font-medium text-black mb-1">Fecha inicio</label>
                  <input type="datetime-local" value={form.fechaInicio}
                    onChange={e => setForm(f => ({ ...f, fechaInicio: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-black focus:ring-2 focus:ring-[var(--color-primary-ring)] focus:border-[var(--color-primary)] outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-black mb-1">Fecha fin</label>
                  <input type="datetime-local" value={form.fechaFin}
                    onChange={e => setForm(f => ({ ...f, fechaFin: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-black focus:ring-2 focus:ring-[var(--color-primary-ring)] focus:border-[var(--color-primary)] outline-none" />
                </div>
              </div>
              <DiasSemanaSelector selected={form.diasSemana}
                onChange={dias => setForm(f => ({ ...f, diasSemana: dias }))} />
            </div>

            {/* Productos disponibles */}
            <div className="border border-gray-300 bg-white overflow-hidden lg:flex-1 lg:min-h-0 lg:flex lg:flex-col">
              <div className="flex items-center justify-between gap-3 px-3 py-2 border-b border-gray-300 shrink-0">
                <h3 className="text-xs font-semibold text-black">PRODUCTOS DISPONIBLES</h3>
                <div className="relative w-64 max-w-[60%]">
                  <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="text" value={prodSearch}
                    onChange={e => handleSearchChange(e.target.value)}
                    placeholder="Buscar producto..."
                    className="w-full pl-8 pr-2 py-1 border border-gray-300 text-sm text-black outline-none focus:border-[var(--color-primary)]" />
                </div>
              </div>
              <div className="max-h-[380px] lg:max-h-none lg:flex-1 lg:min-h-0 overflow-y-auto">
                <table className="w-full text-sm border-collapse">
                  <thead className="sticky top-0 z-10 bg-gray-100">
                    <tr className="text-left text-[11px] font-semibold uppercase tracking-wide text-black border-b border-gray-300">
                      <th className="px-2 py-1.5">Producto</th>
                      <th className="px-1 py-1.5 text-right w-[72px] xl:w-[92px]">Precio</th>
                      <th className="px-1 py-1.5 text-right w-[56px]">Stock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productosLista.map(p => (
                      <tr key={p.id} onClick={() => agregarProducto(p)}
                        className="cursor-pointer border-b border-gray-200 last:border-0 hover:bg-gray-50">
                        <td className="px-2 py-1.5">
                          <span className="text-black">{p.nombre}</span>
                          <span className="block font-mono text-[11px] text-black">{p.codigoBarra || p.codigoProducto || ''}</span>
                        </td>
                        <td className="px-1 py-1.5 text-right tabular-nums text-black whitespace-nowrap">${p.precio.toFixed(2)}</td>
                        <td className="px-1 py-1.5 text-right tabular-nums whitespace-nowrap">
                          <span className={p.stock > 0 ? 'text-emerald-600' : 'text-red-500'}>●</span> {p.stock}
                        </td>
                      </tr>
                    ))}
                    {productosLista.length === 0 && (
                      <tr>
                        <td colSpan={3} className="px-3 py-10 text-center text-sm text-black">Sin productos para mostrar</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* ── Columna derecha ── */}
          <div className="min-w-0 flex flex-col gap-3 lg:min-h-0">
            {/* Productos del combo */}
            <div className="border border-gray-300 bg-white overflow-hidden lg:flex-1 lg:min-h-0 lg:flex lg:flex-col">
              <div className="flex items-center justify-between gap-3 px-3 py-2 border-b border-gray-300 shrink-0">
                <h3 className="text-xs font-semibold text-black">PRODUCTOS DEL COMBO ({form.items.length})</h3>
                {form.items.length > 0 && (
                  <button type="button" onClick={limpiarTodo}
                    className="inline-flex items-center gap-1 px-2 py-0.5 border border-gray-300 text-[12px] text-black hover:border-red-400 hover:text-red-600 transition-colors">
                    <Trash2 size={13} /> Limpiar todo
                  </button>
                )}
              </div>
              {form.items.length === 0 ? (
                <div className="px-3 py-12 text-center text-sm text-black lg:flex-1 lg:flex lg:items-center lg:justify-center">Agregá productos desde la lista de la izquierda</div>
              ) : (
                <div className="max-h-[420px] lg:max-h-none lg:flex-1 lg:min-h-0 overflow-y-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead className="sticky top-0 z-10 bg-gray-100">
                      <tr className="text-left text-[11px] font-semibold uppercase tracking-wide text-black border-b border-gray-300">
                        <th className="px-2 py-1.5">Producto</th>
                        <th className="px-1 py-1.5 text-right w-[68px] xl:w-[90px]">P. unit.</th>
                        <th className="px-1 py-1.5 text-center w-[86px]">Cant.</th>
                        <th className="px-1 py-1.5 text-right w-[72px] xl:w-[90px]">Subtotal</th>
                        <th className="px-1 py-1.5 w-[24px]"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {form.items.map(i => {
                        const p = productos.find(x => x.id === i.productoId)
                        const precio = p?.precio ?? 0
                        const esPesable = p?.esPesable ?? false
                        const step = esPesable ? 0.1 : 1
                        return (
                          <tr key={i.productoId} className="border-b border-gray-200 last:border-0 hover:bg-gray-50">
                            <td className="px-2 py-1.5">
                              <span className="text-black">{i.productoNombre ?? p?.nombre ?? `#${i.productoId}`}</span>
                              {(i.codigoBarra || p?.codigoBarra) && (
                                <span className="block font-mono text-[11px] text-black">{i.codigoBarra || p?.codigoBarra}</span>
                              )}
                            </td>
                            <td className="px-1 py-1.5 text-right tabular-nums text-black whitespace-nowrap">${precio.toFixed(2)}</td>
                            <td className="px-1 py-1.5">
                              <div className="flex items-center justify-center gap-0.5">
                                <button type="button" onClick={() => setCantidad(i.productoId, i.cantidad - step)}
                                  className="w-5 h-5 border border-gray-300 flex items-center justify-center text-black hover:bg-gray-100">
                                  <Minus size={11} />
                                </button>
                                <input type="number" min={0} step={step} value={i.cantidad}
                                  onChange={e => setCantidad(i.productoId, parseFloat(e.target.value) || 0)}
                                  className="w-10 py-0.5 text-center border border-gray-300 font-mono text-xs tabular-nums outline-none focus:border-[var(--color-primary)]" />
                                <button type="button" onClick={() => setCantidad(i.productoId, i.cantidad + step)}
                                  className="w-5 h-5 border border-gray-300 flex items-center justify-center text-black hover:bg-gray-100">
                                  <Plus size={11} />
                                </button>
                              </div>
                            </td>
                            <td className="px-1 py-1.5 text-right font-semibold tabular-nums text-black whitespace-nowrap">${(precio * i.cantidad).toFixed(2)}</td>
                            <td className="px-1 py-1.5 text-center">
                              <button type="button" onClick={() => quitarProducto(i.productoId)} title="Quitar"
                                className="text-black hover:text-red-500 transition-colors">
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* RESUMEN — pegado abajo del carrito, como en Ventas */}
              <div className="shrink-0 border-t border-gray-300">
                <div className="flex items-center justify-between gap-2 px-3 py-1.5">
                  <h3 className="text-xs font-bold text-black">RESUMEN</h3>
                  <span className="text-[13px] font-medium text-black tabular-nums">{form.items.length} prod. · ${totalVenta.toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-2 px-3 pb-2">
                  <label className="text-[13px] font-medium text-black whitespace-nowrap">Precio combo</label>
                  <div className="flex-1 flex items-center gap-1 bg-gray-50 border border-gray-300 px-2 py-1">
                    <span className="text-[13px] text-black select-none">$</span>
                    <input type="number" step="0.01" min="0" value={form.precio}
                      onChange={e => setForm(f => ({ ...f, precio: e.target.value }))}
                      placeholder="0,00"
                      className="flex-1 w-full bg-transparent text-right text-base font-bold text-black font-mono tabular-nums outline-none" />
                  </div>
                </div>
                <div className="px-3 pb-2 space-y-1">
                  <div className={`flex items-center justify-between px-2.5 py-1.5 border ${descuento >= 0 ? 'bg-emerald-50 border-emerald-300' : 'bg-red-50 border-red-300'}`}>
                    <span className={`text-[13px] font-semibold ${descuento >= 0 ? 'text-emerald-800' : 'text-red-800'}`}>Descuento</span>
                    <span className={`inline-flex items-center gap-1 text-[15px] font-bold tabular-nums ${descuento >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                      <Tag size={14} strokeWidth={2.5} />
                      {descuento < 0 ? '-' : ''}${Math.abs(descuento).toFixed(2)}
                      {totalVenta > 0 && ` (${Math.round(descuento / totalVenta * 100)}%)`}
                    </span>
                  </div>
                  {totalCosto > 0 && precioCombo > 0 && precioCombo < totalCosto && (
                    <p className="flex items-center gap-1 text-[11px] font-medium text-red-700">
                      <AlertTriangle size={12} strokeWidth={2.5} />
                      Menor al costo (${totalCosto.toFixed(2)})
                    </p>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      </form>
    </Dialog>

    {codigoAImprimir && (
      <BarcodePrintDialog codigo={codigoAImprimir.codigo} origen={codigoAImprimir.origen} onClose={() => setCodigoAImprimir(null)} />
    )}

    {showLabelPrint && (
      <LabelPrintDialog
        nombre={form.descCombo}
        precio={Number(form.precio) || 0}
        codigoInterno={form.codCombo}
        onClose={() => setShowLabelPrint(false)}
      />
    )}
    </>
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
  const [modoDescuento, setModoDescuento] = useState<'porcentaje' | 'precio'>('porcentaje')
  const [precioFinalInput, setPrecioFinalInput] = useState('0')

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
    <Dialog
      open
      onClose={onClose}
      closeOnBackdrop={false}
      title="OFERTA"
      icon={Tag}
      highlight={form.productoNombre.trim() || (editId !== null ? 'Editar oferta' : 'Nueva oferta')}
      width="md"
      footer={
        <div className="flex justify-end gap-2 w-full">
          <Button variant="secondary" size="md" type="button" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" size="md" type="submit" form="oferta-form">
            {editId !== null ? 'Guardar' : 'Crear'}
          </Button>
        </div>
      }
    >
      <form id="oferta-form" className="space-y-3" onSubmit={onSubmit} onKeyDown={e => {
        const target = e.target as HTMLElement
        if (e.key === 'Enter' && target.tagName !== 'TEXTAREA') e.preventDefault()
      }}>
        <div>
          <label className="block text-xs font-medium text-black mb-1">Producto</label>
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
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
              className="w-full pl-8 pr-2 py-1.5 border border-gray-300 text-sm text-black outline-none focus:border-[var(--color-primary)]" />
            {showProdDropdown && productosFiltrados.length > 0 && (
              <ul className="absolute z-30 w-full mt-1 bg-white border border-gray-300 shadow-lg max-h-48 overflow-y-auto text-[13px]">
                {productosFiltrados.map((p, i) => (
                  <li key={p.id}
                    onMouseDown={() => seleccionarProducto(p.id)}
                    onMouseEnter={() => setProdHighIdx(i)}
                    className={`px-3 py-2 cursor-pointer flex items-center justify-between gap-2 ${i === prodHighIdx ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-gray-50'}`}>
                    <span className="truncate text-black">{p.nombre}</span>
                    <span className="text-black shrink-0 font-mono text-[11px]">{p.codigoBarra}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-black mb-1">Descuento</label>
          <div className="flex">
            <select value={modoDescuento}
              onChange={e => {
                const m = e.target.value as 'porcentaje' | 'precio'
                if (m === 'precio') setPrecioFinalInput(precioOriginal > 0 ? precioOferta.toFixed(2) : '')
                setModoDescuento(m)
              }}
              className="px-2 py-1.5 border border-gray-300 border-r-0 bg-white text-sm text-black outline-none focus:border-[var(--color-primary)]">
              <option value="porcentaje">Porcentaje</option>
              <option value="precio">Precio final</option>
            </select>
            {modoDescuento === 'porcentaje' ? (
              <input type="number" step="0.01" min="0" max="100" value={form.descuento}
                onChange={e => setForm(f => ({ ...f, descuento: e.target.value }))}
                className="flex-1 min-w-0 px-2 py-1.5 border border-gray-300 text-sm text-black text-right font-mono outline-none focus:border-[var(--color-primary)]"
                placeholder="15" />
            ) : (
              <input type="number" step="0.01" min="0" value={precioFinalInput}
                onChange={e => {
                  const v = e.target.value
                  setPrecioFinalInput(v)
                  if (precioOriginal <= 0) return
                  const p = parseFloat(v)
                  if (isNaN(p)) { setForm(f => ({ ...f, descuento: '' })); return }
                  const pct = Math.max(0, Math.min(100, (1 - p / precioOriginal) * 100))
                  setForm(f => ({ ...f, descuento: String(Math.round(pct * 100) / 100) }))
                }}
                className="flex-1 min-w-0 px-2 py-1.5 border border-gray-300 text-sm text-black text-right font-mono outline-none focus:border-[var(--color-primary)]"
                placeholder="0,00" />
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-black mb-1">Desde</label>
            <input type="datetime-local" value={form.fechaInicio}
              onChange={e => setForm(f => ({ ...f, fechaInicio: e.target.value }))}
              className="w-full px-2 py-1.5 border border-gray-300 text-sm text-black outline-none focus:border-[var(--color-primary)]" />
          </div>
          <div>
            <label className="block text-xs font-medium text-black mb-1">Hasta</label>
            <input type="datetime-local" value={form.fechaFin}
              onChange={e => setForm(f => ({ ...f, fechaFin: e.target.value }))}
              className="w-full px-2 py-1.5 border border-gray-300 text-sm text-black outline-none focus:border-[var(--color-primary)]" />
          </div>
        </div>

        <DiasSemanaSelector selected={form.diasSemana}
          onChange={dias => setForm(f => ({ ...f, diasSemana: dias }))} />

        <div className="border border-gray-300">
          <div className="flex items-center justify-between px-3 py-1.5 border-b border-gray-200 text-[13px]">
            <span className="text-black">Precio anterior</span>
            <span className="text-black tabular-nums">${precioOriginal.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between px-3 py-1.5 border-b border-gray-200 text-[13px]">
            <span className="text-black">Descuento</span>
            <span className="font-semibold text-red-600 tabular-nums">-${(precioOriginal - precioOferta).toFixed(2)} ({desc > 0 ? desc : 0}%)</span>
          </div>
          <div className="flex items-center justify-between px-3 py-1.5 bg-emerald-50 text-[13px]">
            <span className="font-semibold text-black">Precio final</span>
            <span className="font-bold text-emerald-700 tabular-nums">${precioOferta.toFixed(2)}</span>
          </div>
        </div>
      </form>
    </Dialog>
  )
}
