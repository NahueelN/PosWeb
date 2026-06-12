import { useState, useRef, type KeyboardEvent } from 'react'
import { api } from '../api/client'
import type { ProductoDto } from '../types'

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
        <svg
          className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none"
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
        </svg>

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
            <svg className="w-5 h-5 text-gray-400 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          )}
          {status === 'found' && (
            <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
          )}
          {status === 'notfound' && (
            <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
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
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Buscando…
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
            Buscar
          </>
        )}
      </button>
    </div>
  )
}
