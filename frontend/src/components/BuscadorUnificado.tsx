import { useState, useRef, type KeyboardEvent } from 'react'
import { api } from '../api/client'
import type { ProductoDto } from '../types'
import { Search, Loader2, Check, AlertTriangle } from 'lucide-react'

type LookupStatus = 'idle' | 'loading' | 'found' | 'notfound'

export interface BuscadorUnificadoProps {
  /** Valor actual del input (filtro local) */
  value: string
  /** Se llama en cada cambio de texto */
  onChange: (q: string) => void
  /**
   * Se llama cuando se hace clic en Buscar o Enter y el código de barras
   * existe en la base de datos local.
   */
  onSelect: (producto: ProductoDto) => void
  /**
   * Se llama cuando se hace clic en Buscar o Enter y el código NO existe.
   */
  onNotFound: (codigo: string) => void
  /** Placeholder del input */
  placeholder?: string
  /** Input deshabilitado */
  disabled?: boolean
  /** Ref externo para manejo de foco */
  inputRef?: React.RefObject<HTMLInputElement | null>
  /** Se llama cuando se presiona ArrowDown (para navegar a la grilla) */
  onArrowDown?: () => void
}

/**
 * Barra de búsqueda unificada con botón Buscar.
 *
 * - Mientras escribís → onChange(query) para filtro local.
 * - Al presionar Enter o hacer clic en Buscar → `obtenerPorBarra()`:
 *   - Si existe → onSelect(producto)
 *   - Si no → onNotFound(codigo)
 */
export default function BuscadorUnificado({
  value,
  onChange,
  onSelect,
  onNotFound,
  placeholder = 'Buscá producto por código de barra o nombre…',
  disabled = false,
  inputRef: externalRef,
  onArrowDown,
}: BuscadorUnificadoProps) {
  const internalRef = useRef<HTMLInputElement>(null!)
  const inputRef = externalRef ?? internalRef
  const [status, setStatus] = useState<LookupStatus>('idle')

  async function buscar() {
    const q = value.trim()
    if (!q || disabled) return

    setStatus('loading')

    try {
      const producto = await api.productos.obtenerPorBarra(q)
      if (producto) {
        setStatus('found')
        onSelect(producto)
      } else {
        setStatus('notfound')
        onNotFound(q)
      }
    } catch {
      setStatus('notfound')
      onNotFound(q)
    }

    setTimeout(() => setStatus('idle'), 1000)
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      onArrowDown?.()
    } else if (e.key === 'Enter') {
      e.preventDefault()
      buscar()
    }
  }

  return (
    <div className="flex gap-2">
      <div className="relative flex-1">
        <Search
          size={20}
          strokeWidth={2}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
        />

        <input
          ref={inputRef}
          type="text"
          className="w-full pl-11 pr-10 py-3 bg-white border border-gray-200 rounded-xl shadow-sm text-base placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all disabled:opacity-50"
          placeholder={placeholder}
          value={value}
          onChange={e => { onChange(e.target.value); if (status !== 'idle') setStatus('idle') }}
          onKeyDown={handleKeyDown}
          disabled={disabled}
        />

        {/* Status icon */}
        <span className="absolute right-3 top-1/2 -translate-y-1/2">
          {status === 'loading' && (
            <Loader2 size={20} strokeWidth={2} className="text-gray-400 animate-spin" />
          )}
          {status === 'found' && (
            <Check size={20} strokeWidth={2.5} className="text-green-500" />
          )}
          {status === 'notfound' && (
            <AlertTriangle size={20} strokeWidth={2} className="text-amber-500" />
          )}
        </span>
      </div>

      <button
        type="button"
        onClick={buscar}
        disabled={status === 'loading' || disabled || !value.trim()}
        className="px-5 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 shrink-0"
      >
        {status === 'loading' ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Buscando…
          </>
        ) : (
          <>
            <Search size={16} />
            Buscar
          </>
        )}
      </button>
    </div>
  )
}
