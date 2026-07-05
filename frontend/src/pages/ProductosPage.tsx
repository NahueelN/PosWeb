import { useState, useEffect, useMemo, useRef } from 'react'
import { useOutletContext } from 'react-router-dom'
import { api } from '../api/client'
import { useNotification } from '../context/NotificationContext'
import ProductCardPanel from '../components/ProductCardPanel'
import ProductFormModal from '../components/ProductFormModal'
import MargenesTab from '../components/MargenesTab'
import StockTab from '../components/StockTab'
import type { ProductoDto, OpenFoodFactsResultDto, SucursalDto } from '../types'
import Dialog from '../components/ui/Dialog'
import Button from '../components/ui/Button'
import PageShell from '../components/shared/PageShell'

export default function ProductosPage() {
  const { sucursal } = useOutletContext<{ sucursal: SucursalDto | null }>()
  const [productos, setProductos] = useState<ProductoDto[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { notifyError, notifySuccess } = useNotification()
  const [tab, setTab] = useState<'productos' | 'margenes' | 'stock' | 'actualizacion-masiva'>('productos')

  const [modalOpen, setModalOpen] = useState(false)
  const [modalPrefill, setModalPrefill] = useState<OpenFoodFactsResultDto | null>(null)
  const [modalCodigo, setModalCodigo] = useState('')
  const [editingProduct, setEditingProduct] = useState<ProductoDto | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)
  const searchRef = useRef<HTMLInputElement | null>(null)

  const [ajusteMarca, setAjusteMarca] = useState('')
  const [ajustePorcentaje, setAjustePorcentaje] = useState('')
  const [ajusteLoading, setAjusteLoading] = useState(false)
  const [marcas, setMarcas] = useState<string[]>([])
  const [marcaBusqueda, setMarcaBusqueda] = useState('')
  const [marcaDropdown, setMarcaDropdown] = useState(false)
  const [gruposMarcas, setGruposMarcas] = useState<{ marcas: string[] }[]>([])

  const marcasFiltradas = marcaBusqueda
    ? marcas.filter(m => m.toLowerCase().includes(marcaBusqueda.toLowerCase()))
    : marcas

  const [query, setQuery] = useState('')

  const filteredProductos = useMemo(() => {
    if (!query.trim()) return productos
    const q = query.toLowerCase()
    return productos.filter(p =>
      p.nombre.toLowerCase().includes(q) ||
      p.codigoBarra.toLowerCase().includes(q)
    )
  }, [productos, query])

  useEffect(() => { listar() }, [sucursal?.id])

  useEffect(() => {
    if (tab === 'actualizacion-masiva' && marcas.length === 0) {
      api.productos.marcas().then(setMarcas).catch(() => setMarcas([]))
      api.productos.marcasSimilares().then(setGruposMarcas).catch(() => setGruposMarcas([]))
    }
  }, [tab])

  async function listar() {
    setLoading(true)
    setError('')
    try {
      setProductos(await api.productos.listar(sucursal?.id))
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }

  function handleProductCreated(product: ProductoDto) {
    setModalOpen(false)
    setModalPrefill(null)
    setModalCodigo('')
    if (editingProduct) {
      setProductos(prev => prev.map(p => p.id === product.id ? product : p))
      setEditingProduct(null)
    } else {
      listar()
    }
    searchRef.current?.focus()
  }

  function handleCloseModal() {
    setModalOpen(false)
    setModalPrefill(null)
    setModalCodigo('')
    setEditingProduct(null)
    searchRef.current?.focus()
  }

  async function handleBarcodeLookup(codigo: string) {
    try {
      const prod = await api.productos.obtenerPorBarra(codigo)
      if (prod) {
        setQuery('')
        focusCard(prod.id)
        return
      }
    } catch {}
    const localMatch = productos.find(
      p => p.codigoBarra.toLowerCase() === codigo.toLowerCase()
    )
    if (localMatch) {
      setQuery('')
      focusCard(localMatch.id)
      return
    }
    try {
      const res = await api.productos.lookupOpenFoodFacts(codigo)
      if (res.encontrado && res.datos) {
        setModalPrefill(res.datos)
        setModalCodigo('')
        setModalOpen(true)
        setQuery('')
      } else {
        notifyError(`Producto no encontrado: "${codigo}"`)
        setModalPrefill(null)
        setModalCodigo(codigo)
        setModalOpen(true)
      }
    } catch {
      notifyError(`Error al buscar producto: "${codigo}"`)
      setModalPrefill(null)
      setModalCodigo(codigo)
      setModalOpen(true)
    }
  }

  function handleOpenForm() {
    setEditingProduct(null)
    setModalPrefill(null)
    setModalCodigo('')
    setModalOpen(true)
    setError('')
  }

  function handleEditProduct(p: ProductoDto) {
    setEditingProduct(p)
    setModalPrefill(null)
    setModalCodigo('')
    setModalOpen(true)
  }

  async function confirmarEliminar() {
    if (confirmDeleteId == null) return
    try {
      await api.productos.eliminar(confirmDeleteId)
      setConfirmDeleteId(null)
      await listar()
    } catch (e: any) { notifyError(e.message) }
  }

  async function handleAjusteSubmit() {
    if (!ajusteMarca || !ajustePorcentaje) {
      notifyError('Seleccioná una marca y un porcentaje')
      return
    }
    const pct = parseFloat(ajustePorcentaje)
    if (isNaN(pct) || pct <= 0) {
      notifyError('El porcentaje debe ser mayor a 0')
      return
    }
    setAjusteLoading(true)
    try {
      const res = await api.productos.ajusteMarca(ajusteMarca, pct)
      notifySuccess(`${res.afectados} productos actualizados`)
      setAjusteMarca('')
      setAjustePorcentaje('')
      listar()
    } catch (e: any) {
      notifyError(e.message || 'Error al aplicar ajuste')
    } finally {
      setAjusteLoading(false)
    }
  }

  function focusCard(id: number) {
    setTimeout(() => {
      document.querySelector<HTMLElement>(`[data-card-id="${id}"]`)?.focus()
    }, 0)
  }

  return (
    <PageShell
      title="Productos"
      subtitle={`${productos.length} productos activos`}
      actions={tab === 'productos' ? (
        <Button onClick={handleOpenForm} variant="primary" size="sm">
          Nuevo producto
        </Button>
      ) : undefined}
      tabs={
        <div className="flex border-b border-slate-200">
          <button onClick={() => setTab('productos')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === 'productos'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}>Productos</button>
          <button onClick={() => setTab('margenes')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === 'margenes'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}>Márgenes</button>
          <button onClick={() => setTab('stock')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === 'stock'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}>Stock</button>
          <button onClick={() => setTab('actualizacion-masiva')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === 'actualizacion-masiva'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}>Actualización masiva</button>
        </div>
      }
      error={error}
      onErrorClose={() => setError('')}
      loading={loading}
    >
      <ProductFormModal
        open={modalOpen}
        prefillData={modalPrefill}
        initialCodigo={modalCodigo}
        editingProduct={editingProduct}
        sucursalId={sucursal?.id}
        onCreated={handleProductCreated}
        onClose={handleCloseModal}
      />

      {tab === 'productos' ? (
        <ProductCardPanel
          searchQuery={query}
          onSearchChange={setQuery}
          showHints={true}
          onBarcodeLookup={handleBarcodeLookup}
          searchInputRef={searchRef}
        >
          {filteredProductos.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                </svg>
              </div>
              <p className="text-gray-500 font-medium text-sm">No hay productos</p>
            </div>
          ) : filteredProductos.map((p) => (
                <button key={p.id} type="button" data-card data-card-id={p.id}
                  onClick={() => handleEditProduct(p)}
                  className="bg-white rounded-lg border border-gray-200 p-1.5 text-left hover:border-indigo-300 hover:shadow-sm transition-all active:scale-[0.98] focus:ring-2 focus:ring-indigo-500/30 focus:outline-none group"
                  title={p.nombre}>
                  <div className="flex items-start justify-between gap-1.5">
                    <p className="font-bold text-gray-900 text-base leading-tight truncate">{p.nombre}</p>
                    {p.tamano && (
                      <span className="text-[11px] font-medium text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded shrink-0 mt-0.5">{p.tamano}</span>
                    )}
                  </div>
                  <div className="text-[11px] text-gray-400 font-mono truncate mt-0.5">{p.codigoBarra}</div>
                  <div className="flex items-end justify-between mt-1 gap-1.5">
                    <p className="text-xl font-bold text-indigo-600">${p.precio.toFixed(2)}</p>
                    {p.seguirStock === false ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium rounded-full px-2 py-0.5 bg-slate-100 text-slate-500">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />sin control
                      </span>
                    ) : (
                      <span className={`inline-flex items-center gap-1 text-xs font-medium rounded-full px-2 py-0.5 ${
                        p.stock === 0 ? 'bg-red-50 text-red-600' : p.stock <= 5 ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${p.stock === 0 ? 'bg-red-500' : p.stock <= 5 ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                        {p.stock === 0 ? 'sin stock' : `${p.stock}`}
                      </span>
                    )}
                  </div>
                  <div className="flex justify-end gap-3 mt-1 opacity-0 group-hover:opacity-100 transition-opacity -mb-0.5">
                    <span className="text-[10px] font-medium text-gray-400 cursor-default">{p.costo > 0 ? `Costo $${p.costo.toFixed(2)}` : ''}</span>
                    <span role="button" tabIndex={0}
                      onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(p.id) }}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); setConfirmDeleteId(p.id) } }}
                      className="text-[10px] font-medium text-red-400 hover:text-red-600 transition-colors cursor-pointer">Eliminar</span>
                  </div>
                </button>
              ))}
        </ProductCardPanel>
      ) : tab === 'margenes' ? (
        <MargenesTab notifyError={notifyError} />
      ) : tab === 'stock' ? (
        <StockTab notifyError={notifyError} />
      ) : (
        <div className="bg-white rounded-xl p-6 shadow-xl space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Actualización masiva</h2>
            <p className="text-sm text-slate-500">Ajustá precios por marca aplicando un porcentaje de aumento.</p>
          </div>
          {gruposMarcas.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Marcas similares detectadas ({gruposMarcas.length} grupo{gruposMarcas.length !== 1 ? 's' : ''})
              </h3>
              <div className="space-y-2">
                {gruposMarcas.map((g, i) => (
                  <div key={i} className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-amber-600 font-medium">⚠ Posibles variantes:</span>
                    {g.marcas.map(m => (
                      <button key={m} type="button"
                        onClick={() => { setAjusteMarca(m); setMarcaBusqueda(m) }}
                        className={`text-xs px-2 py-1 rounded-full border transition-colors ${
                          ajusteMarca === m
                            ? 'bg-amber-100 border-amber-400 text-amber-800'
                            : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-amber-50 hover:border-amber-300'
                        }`}>{m}</button>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="space-y-4 max-w-sm">
            <div>
              <label className="text-xs font-semibold text-gray-700 mb-1 block">Marca</label>
              <div className="relative">
                <input type="text" value={marcaBusqueda}
                  onChange={e => { setMarcaBusqueda(e.target.value); setAjusteMarca(e.target.value); setMarcaDropdown(true) }}
                  onFocus={() => setMarcaDropdown(true)}
                  onBlur={() => setTimeout(() => setMarcaDropdown(false), 150)}
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                  placeholder="Buscar marca..." />
                {marcaDropdown && marcasFiltradas.length > 0 && (
                  <div className="absolute z-10 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {marcasFiltradas.map(m => (
                      <button key={m} type="button"
                        onMouseDown={() => { setAjusteMarca(m); setMarcaBusqueda(m); setMarcaDropdown(false) }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-amber-50 transition-colors">{m}</button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-700 mb-1 block">% de aumento</label>
              <div className="relative">
                <input type="number" step="0.01" min="0.01" value={ajustePorcentaje}
                  onChange={e => setAjustePorcentaje(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                  placeholder="ej: 15" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">%</span>
              </div>
              <p className="text-[11px] text-gray-400 mt-1">Se aplica sobre costo y precio de venta. Las marcas similares se ajustan juntas.</p>
            </div>
            <button onClick={handleAjusteSubmit} disabled={ajusteLoading || !ajusteMarca || !ajustePorcentaje}
              className="w-full py-2.5 bg-amber-600 text-white font-medium rounded-xl hover:bg-amber-700 disabled:opacity-50 transition-colors text-sm">
              {ajusteLoading ? 'Aplicando...' : `Aplicar aumento del ${ajustePorcentaje || '...'}%`}
            </button>
          </div>
        </div>
      )}

      <Dialog
        open={confirmDeleteId != null}
        onClose={() => setConfirmDeleteId(null)}
        title="Eliminar producto"
        description="¿Estás seguro? Esta acción no se puede deshacer."
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setConfirmDeleteId(null)}>Cancelar</Button>
            <Button variant="primary" size="sm" onClick={confirmarEliminar}>Continuar</Button>
          </>
        }
      >
        <></>
      </Dialog>
    </PageShell>

    {/* Delete confirmation */}
    <Dialog
      open={confirmDeleteId != null}
      onClose={() => setConfirmDeleteId(null)}
      title="Eliminar producto"
      description="¿Estás seguro? Esta acción no se puede deshacer."
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={() => setConfirmDeleteId(null)}>Cancelar</Button>
          <Button variant="primary" size="sm" onClick={confirmarEliminar}>Continuar</Button>
        </>
      }
    />
    </>
  )
}
