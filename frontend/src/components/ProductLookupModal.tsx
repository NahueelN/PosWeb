import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Barcode, Box, Search, Tag } from 'lucide-react'
import type { ProductoDto, ProductoDetailDto } from '../types'
import { api } from '../api/client'
import Dialog from './ui/Dialog'

function formatCurrency(n: number): string {
  return '$' + n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

interface Props {
  onClose: () => void
}

export default function ProductLookupModal({ onClose }: Props) {
  const [query, setQuery] = useState('')
  const [productos, setProductos] = useState<ProductoDto[]>([])
  const [loading, setLoading] = useState(false)
  const [highlightIdx, setHighlightIdx] = useState(-1)
  const [detailProd, setDetailProd] = useState<ProductoDetailDto | null>(null)
  const [listActive, setListActive] = useState(false)
  const hlRef = useRef(-1)
  const inputRef = useRef<HTMLInputElement>(null)

  const showDetail = async (prod: ProductoDto) => {
    try {
      setDetailProd(await api.productos.detalle(prod.id))
    } catch {
      setDetailProd({
        id: prod.id, codigoBarra: prod.codigoBarra, codProducto: prod.codigoBarra,
        nombre: prod.nombre, precio: prod.precio, costo: prod.costo, stock: prod.stock,
        tamano: prod.tamano, activo: prod.activo, fechaAlta: '', fechaUltimaMod: '',
      })
    }
  }

  useEffect(() => {
    const timeout = setTimeout(() => inputRef.current?.focus(), 100)
    return () => clearTimeout(timeout)
  }, [])

  useEffect(() => {
    if (!query.trim()) {
      return
    }

    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const byBarra = await api.productos.obtenerPorBarra(query.trim()).catch(() => null)
        if (byBarra) {
          setProductos([byBarra])
          showDetail(byBarra)
        } else {
          setProductos(await api.productos.buscar(query.trim()))
        }
      } catch {
        setProductos([])
      } finally {
        setLoading(false)
      }
    }, 250)

    return () => clearTimeout(timer)
  }, [query])

  const resultados = productos
  const margen = detailProd && detailProd.costo > 0
    ? ((detailProd.precio - detailProd.costo) / detailProd.costo * 100).toFixed(0) + '%'
    : '—'

  return (
    <Dialog
      open
      onClose={onClose}
      title="Búsqueda rápida"
      icon={Search}
      description="Consultá precio, stock y rentabilidad sin salir de la venta."
      width="xl"
      closeOnBackdrop={false}
      footer={
        <span className="text-xs text-gray-500">
          <kbd className="rounded border border-gray-300 bg-white px-1.5 py-0.5 font-semibold text-gray-600">↑ ↓</kbd> navegar · <kbd className="rounded border border-gray-300 bg-white px-1.5 py-0.5 font-semibold text-gray-600">Enter</kbd> consultar · <kbd className="rounded border border-gray-300 bg-white px-1.5 py-0.5 font-semibold text-gray-600">Esc</kbd> cerrar
        </span>
      }
    >
      <div className="space-y-3">
        <div className="relative">
          <Search size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={event => {
              const nextQuery = event.target.value
              setQuery(nextQuery)
              if (!nextQuery.trim()) setProductos([])
              setDetailProd(null)
              setHighlightIdx(-1)
              hlRef.current = -1
              setListActive(false)
            }}
            onKeyDown={event => {
              const index = hlRef.current
              if (listActive) {
                if (event.key === 'ArrowDown') {
                  event.preventDefault()
                  const next = Math.min(index + 1, resultados.length - 1)
                  hlRef.current = next
                  setHighlightIdx(next)
                  return
                }
                if (event.key === 'ArrowUp') {
                  event.preventDefault()
                  const previous = Math.max(index - 1, 0)
                  hlRef.current = previous
                  setHighlightIdx(previous)
                  return
                }
                if (event.key === 'Enter' && index >= 0) {
                  event.preventDefault()
                  showDetail(resultados[index])
                }
                return
              }
              if (event.key === 'ArrowDown' && resultados.length > 0) {
                event.preventDefault()
                hlRef.current = 0
                setHighlightIdx(0)
                setListActive(true)
              }
              if (event.key === 'Enter' && resultados.length === 1) {
                event.preventDefault()
                showDetail(resultados[0])
              }
            }}
            placeholder="Nombre, código interno o código de barras..."
            className="h-11 w-full rounded-lg border border-gray-300 bg-white py-3 pl-11 pr-4 text-sm text-gray-900 outline-none transition-all placeholder:text-gray-400 hover:border-gray-400 focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-ring)]"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-[0.85fr_1.15fr]">
          <section className="flex h-[300px] flex-col overflow-hidden rounded-xl border border-gray-200 bg-white">
            <div className="flex h-10 items-center justify-between border-b border-gray-200 bg-gray-50 px-3">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-600">Resultados</span>
              {productos.length > 0 && <span className="text-xs text-gray-400">{productos.length} resultados</span>}
            </div>

            {loading && <EmptyState icon={<span className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--color-primary)] border-t-transparent" />} text="Buscando productos..." />}
            {!loading && !query && <EmptyState icon={<Barcode size={32} strokeWidth={1.5} />} text="Listo para buscar" detail="Escribí un nombre o escaneá un código." />}
            {!loading && query && resultados.length === 0 && <EmptyState icon={<Box size={32} strokeWidth={1.5} />} text="No encontramos productos" detail="Probá con otro nombre o código." />}

            {!loading && resultados.length > 0 && (
              <div className="min-h-0 flex-1 divide-y divide-gray-100 overflow-y-auto">
                {resultados.map((producto, index) => (
                  <button
                    key={producto.id}
                    onClick={() => showDetail(producto)}
                    className={`flex h-8 w-full items-center justify-between gap-4 px-3 text-left transition-colors ${
                      index === highlightIdx && listActive
                        ? 'bg-[var(--color-primary-light)] text-[var(--color-primary)]'
                        : detailProd?.id === producto.id
                          ? 'bg-gray-50 text-gray-900'
                          : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span className="truncate text-sm font-medium">{producto.nombre}</span>
                    <span className="shrink-0 text-sm font-bold text-[var(--color-primary)]">{formatCurrency(producto.precio)}</span>
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="min-h-[300px]">
            {!detailProd ? (
              <div className="flex h-[300px] flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 text-center">
                <Tag size={34} strokeWidth={1.5} className="mb-3 text-gray-300" />
                <p className="text-sm font-semibold text-gray-600">Seleccioná un producto</p>
                <p className="mt-1 max-w-xs text-xs leading-5 text-gray-400">Su información comercial y de inventario aparecerá acá.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="border-b border-gray-200 pb-3">
                  <div className="flex items-center gap-2">
                    <h4 className="truncate text-lg font-bold text-gray-900">{detailProd.nombre}</h4>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${detailProd.activo ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                      {detailProd.activo ? 'ACTIVO' : 'INACTIVO'}
                    </span>
                  </div>
                  <p className="mt-1 font-mono text-xs text-gray-500">{detailProd.codigoBarra || 'Sin código de barras'}{detailProd.codProducto && detailProd.codProducto !== detailProd.codigoBarra ? ` · Cód. ${detailProd.codProducto}` : ''}</p>
                </div>

                <div>
                  <h5 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-700">Información</h5>
                  <div className="grid grid-cols-2 gap-x-5 gap-y-2 text-xs">
                    <Info label="Categoría" value={detailProd.categoria} />
                    <Info label="Unidad" value={detailProd.unidadMedida} />
                    <Info label="Tamaño" value={detailProd.tamano} />
                    <Info label="Contenido" value={detailProd.contenido != null ? String(detailProd.contenido) : undefined} />
                    <Info label="Alta" value={detailProd.fechaAlta ? new Date(detailProd.fechaAlta).toLocaleDateString('es-AR') : undefined} />
                    <Info label="Actualizado" value={detailProd.fechaUltimaMod ? new Date(detailProd.fechaUltimaMod).toLocaleDateString('es-AR') : undefined} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-[var(--color-primary-light)] px-4 py-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Precio de venta</p>
                    <p className="mt-1 text-2xl font-bold text-[var(--color-primary)]">{formatCurrency(detailProd.precio)}</p>
                  </div>
                  <div className={`rounded-xl px-4 py-3 ${detailProd.stock <= 5 ? 'bg-red-50' : 'bg-emerald-50'}`}>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Stock</p>
                    <p className={`mt-1 text-2xl font-bold ${detailProd.stock <= 5 ? 'text-red-600' : 'text-emerald-700'}`}>{detailProd.stock} un.</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 border-t border-gray-200 pt-3 text-xs">
                  <Info label="Costo" value={formatCurrency(detailProd.costo)} />
                  <Info label="Margen" value={margen} />
                  <Info label="Ganancia" value={formatCurrency(detailProd.precio - detailProd.costo)} />
                </div>

                {detailProd.descAdicional && <p className="rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600"><span className="font-semibold text-gray-500">Detalle: </span>{detailProd.descAdicional}</p>}
              </div>
            )}
          </section>
        </div>
      </div>
    </Dialog>
  )
}

function EmptyState({ icon, text, detail }: { icon: ReactNode; text: string; detail?: string }) {
  return (
    <div className="flex h-[260px] flex-col items-center justify-center text-center text-gray-400">
      <span className="mb-3">{icon}</span>
      <p className="text-sm font-medium text-gray-500">{text}</p>
      {detail && <p className="mt-1 text-xs">{detail}</p>}
    </div>
  )
}

function Info({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex min-w-0 justify-between gap-2">
      <span className="text-slate-400">{label}</span>
      <span className="truncate text-right font-medium text-slate-700">{value || '—'}</span>
    </div>
  )
}
