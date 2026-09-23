import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { HelpCircle, Search, ChevronDown, ChevronRight, ZoomIn, ZoomOut, X, ChevronLeft, ChevronRight as ChevronRightIcon, Maximize } from 'lucide-react'
import { AYUDA_MODULOS, AYUDA_ITEMS, getAyudaItem, type AyudaEntrada, type AyudaItem } from '../help/content'

function CapturaPendiente() {
  return (
    <div className="rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center gap-2 py-10 text-center">
      <HelpCircle size={28} className="text-slate-300" strokeWidth={1.5} />
      <p className="text-sm font-medium text-slate-500">Captura pendiente</p>
      <p className="text-xs text-slate-400 max-w-[260px]">
        Agregá una imagen en <code className="text-slate-500">help/screenshots/</code> y asígnala en el item de
        <code className="text-slate-500"> content.ts</code>.
      </p>
    </div>
  )
}

function Lightbox({ srcs, index, onClose }: { srcs: string[]; index: number; onClose: () => void }) {
  const [idx, setIdx] = useState(index)
  const [zoom, setZoom] = useState(1)

  const siguiente = useCallback(() => setIdx(i => (i + 1) % srcs.length), [srcs.length])
  const anterior = useCallback(() => setIdx(i => (i - 1 + srcs.length) % srcs.length), [srcs.length])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowRight') siguiente()
      else if (e.key === 'ArrowLeft') anterior()
      else if (e.key === '+' || e.key === '=') setZoom(z => Math.min(4, z + 0.5))
      else if (e.key === '-') setZoom(z => Math.max(1, z - 0.5))
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose, siguiente, anterior])

  const src = srcs[idx]

  return (
    <div className="fixed inset-0 z-[70] bg-black/85 flex items-center justify-center p-4"
      onClick={onClose}>
      <div className="relative flex flex-col items-center w-full h-full"
        onClick={e => e.stopPropagation()}>
        {/* Toolbar */}
        <div className="flex items-center justify-between w-full shrink-0 mb-3">
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setZoom(z => Math.max(1, z - 0.5))}
              className="flex items-center justify-center w-9 h-9 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
              aria-label="Alejar">
              <ZoomOut size={17} />
            </button>
            <button type="button" onClick={() => setZoom(z => Math.min(4, z + 0.5))}
              className="flex items-center justify-center w-9 h-9 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
              aria-label="Acercar">
              <ZoomIn size={17} />
            </button>
            <span className="text-[11px] font-semibold text-white/70 px-2">
              {Math.round(zoom * 100)}%
            </span>
          </div>
          {srcs.length > 1 && (
            <div className="flex items-center gap-2">
              <button type="button" onClick={anterior}
                className="flex items-center justify-center w-9 h-9 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
                aria-label="Anterior">
                <ChevronLeft size={18} />
              </button>
              <span className="text-[12px] font-semibold text-white/80 min-w-[60px] text-center">
                {idx + 1} / {srcs.length}
              </span>
              <button type="button" onClick={siguiente}
                className="flex items-center justify-center w-9 h-9 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
                aria-label="Siguiente">
                <ChevronRightIcon size={18} />
              </button>
            </div>
          )}
          <button type="button" onClick={onClose}
            className="flex items-center justify-center w-9 h-9 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
            aria-label="Cerrar">
            <X size={18} />
          </button>
        </div>

        {/* Imagen con scroll + zoom */}
        <div className="flex-1 min-h-0 w-full overflow-auto rounded-xl bg-black/30 flex items-center justify-center p-3">
          <img
            src={src}
            alt={`Captura ${idx + 1}`}
            style={{ transform: `scale(${zoom})`, transformOrigin: 'center' }}
            className="max-h-full max-w-full rounded-lg object-contain"
          />
        </div>
      </div>
    </div>
  )
}

function DetalleItem({ item, onOpenImagen }: { item: AyudaEntrada; onOpenImagen: (index: number) => void }) {
  const categoriaLabel = item.tipo === 'modulo' ? 'Módulo' : item.tipo === 'solapa' ? 'Solapa' : 'Concepto'

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
          {categoriaLabel}
        </span>
        <span className="text-[10px] font-semibold text-gray-400">{item.modulo}</span>
      </div>
      <h2 className="text-xl font-bold text-gray-900 tracking-tight">{item.titulo}</h2>

      <p className="mt-3 text-sm leading-relaxed text-gray-700">{item.definicion}</p>

      {item.ejemplo && (
        <div className="mt-4 rounded-xl bg-slate-50 border border-slate-200 px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Ejemplo</p>
          <p className="text-sm leading-relaxed text-slate-700">{item.ejemplo}</p>
        </div>
      )}

      {item.imagenes && item.imagenes.length > 0 ? (
        <div className="mt-4 space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
            Capturas{item.imagenes.length > 1 ? ` (${item.imagenes.length})` : ''}
            <span className="ml-2 normal-case text-slate-400">— click para ampliar</span>
          </p>
          {item.imagenes.map((src, i) => (
            <button key={i} type="button" onClick={() => onOpenImagen(i)}
              aria-label={`Ampliar captura ${i + 1} de ${item.titulo}`}
              className="block w-full text-left group relative overflow-hidden rounded-xl border border-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[oklch(0.52_0.255_278)]">
              <img src={src} alt={`Captura ${i + 1} de ${item.titulo}`}
                className="w-full max-h-[560px] object-contain bg-slate-50" />
              <span className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 text-white text-[11px] font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1">
                  <Maximize size={13} /> Ampliar
                </span>
              </span>
            </button>
          ))}
        </div>
      ) : item.necesitaImagen ? (
        <div className="mt-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">Captura</p>
          <CapturaPendiente />
        </div>
      ) : null}

      {item.relacionados && item.relacionados.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">Relacionados</p>
          <div className="flex flex-wrap gap-2">
            {item.relacionados.map(key => {
              const rel = getAyudaItem(key)
              if (!rel) return null
              return (
                <Link key={key} to={`/ayuda?key=${key}`}
                  className="text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg transition-colors">
                  {rel.titulo}
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default function AyudaPage() {
  const [params, setParams] = useSearchParams()
  const [busqueda, setBusqueda] = useState('')
  const [modulosAbiertos, setModulosAbiertos] = useState<Record<string, boolean>>({})
  const [lightbox, setLightbox] = useState<{ srcs: string[]; index: number } | null>(null)
  const detalleRef = useRef<HTMLDivElement>(null)

  const keyActiva = params.get('key') ?? 'modulo-inicio'
  const itemActivo = getAyudaItem(keyActiva) ?? AYUDA_ITEMS[0]

  const modulosFiltrados = useMemo<{ modulo: (typeof AYUDA_MODULOS)[number]; coincide: boolean; items: AyudaItem[] }[]>(() => {
    const q = busqueda.trim().toLowerCase()
    if (!q) return AYUDA_MODULOS.map(modulo => ({ modulo, coincide: true, items: modulo.items }))
    return AYUDA_MODULOS.map(modulo => {
      const coincidencias = modulo.items.filter(i =>
        i.titulo.toLowerCase().includes(q) || i.definicion.toLowerCase().includes(q)
      )
      const moduloCoincide =
        modulo.titulo.toLowerCase().includes(q) || modulo.definicion.toLowerCase().includes(q)
      return {
        modulo,
        coincide: moduloCoincide || coincidencias.length > 0,
        items: coincidencias,
      }
    }).filter(m => m.coincide)
  }, [busqueda])

  // Al buscar, abrir todos los módulos que coinciden para que se vean los resultados.
  useEffect(() => {
    if (!busqueda.trim()) return
    setModulosAbiertos(prev => {
      const next = { ...prev }
      modulosFiltrados.forEach(m => { next[m.modulo.key] = true })
      return next
    })
  }, [busqueda, modulosFiltrados])

  useEffect(() => {
    detalleRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'start' })
  }, [keyActiva])

  function toggleModulo(key: string) {
    setModulosAbiertos(prev => ({ ...prev, [key]: !prev[key] }))
  }

  function seleccionar(key: string) {
    setParams({ key })
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-[22px] font-bold text-gray-900 tracking-tight">Ayuda</h1>
          <p className="text-[13px] text-gray-400 mt-0.5">
            Definiciones de los módulos, sus solapas y conceptos.
          </p>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex gap-5">
        {/* ── Índice lateral ── */}
        <aside className="w-72 shrink-0 flex flex-col min-h-0">
          <div className="relative mb-3">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              placeholder="Buscar..."
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
            />
          </div>

          <nav className="flex-1 overflow-y-auto pr-1 space-y-0.5">
            {modulosFiltrados.length === 0 && (
              <p className="text-xs text-gray-400 px-2 py-3">Sin resultados</p>
            )}
            {modulosFiltrados.map(({ modulo, items }) => {
              const abierto = modulosAbiertos[modulo.key]
              const hayItems = busqueda.trim() ? items.length > 0 : modulo.items.length > 0
              const estaActivo = modulo.key === keyActiva ||
                modulo.items.some(i => i.key === keyActiva)
              return (
                <div key={modulo.key} className="mb-0.5 rounded-lg overflow-hidden">
                  <div className={`flex items-center gap-1 ${estaActivo ? 'bg-[oklch(0.52_0.255_278_/_0.08)]' : ''}`}>
                    <button
                      onClick={() => seleccionar(modulo.key)}
                      className={`flex-1 flex items-center gap-1.5 px-2 py-1.5 rounded-md text-left transition-colors ${
                        keyActiva === modulo.key
                          ? 'bg-[oklch(0.52_0.255_278)] text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <span className="text-[12.5px] font-semibold">{modulo.titulo}</span>
                    </button>
                    {hayItems && (
                      <button
                        onClick={() => toggleModulo(modulo.key)}
                        className="p-1 mr-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                        aria-label={`Expandir ${modulo.titulo}`}
                      >
                        {abierto ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                      </button>
                    )}
                  </div>
                  {abierto && (
                    <ul className="mt-px space-y-px pl-3 border-l border-gray-100 ml-4">
                      {(busqueda.trim() ? items : modulo.items).map(item => (
                        <li key={item.key}>
                          <button onClick={() => seleccionar(item.key)}
                            className={`w-full text-left rounded-md px-2 py-1.5 text-[12px] font-medium transition-colors ${
                              item.key === keyActiva
                                ? 'bg-[oklch(0.52_0.255_278)] text-white'
                                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                            }`}>
                            {item.titulo}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )
            })}
          </nav>
        </aside>

        {/* ── Detalle ── */}
        <div ref={detalleRef} className="flex-1 min-w-0 overflow-y-auto scroll-mt-2">
          <DetalleItem item={itemActivo}
            onOpenImagen={index => {
              if (itemActivo.imagenes && itemActivo.imagenes.length > 0) {
                setLightbox({ srcs: itemActivo.imagenes, index })
              }
            }} />
        </div>
      </div>

      {lightbox && (
        <Lightbox srcs={lightbox.srcs} index={lightbox.index} onClose={() => setLightbox(null)} />
      )}
    </div>
  )
}