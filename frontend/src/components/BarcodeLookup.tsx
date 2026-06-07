import { useState, type FormEvent } from 'react'
import { api } from '../api/client'
import type { ProductoDto, OpenFoodFactsResultDto } from '../types'

interface BarcodeLookupProps {
  onProductFound: (product: ProductoDto) => void
  onPrefillForm: (data: OpenFoodFactsResultDto) => void
  onNotFound: (codigo: string) => void
}

type LookupState = 'idle' | 'loading' | 'foundLocal' | 'foundRemote' | 'notFound' | 'error'

export default function BarcodeLookup({ onProductFound, onPrefillForm, onNotFound }: BarcodeLookupProps) {
  const [codigo, setCodigo] = useState('')
  const [state, setState] = useState<LookupState>('idle')
  const [localProduct, setLocalProduct] = useState<ProductoDto | null>(null)
  const [errorMsg, setErrorMsg] = useState('')

  async function handleLookup(e: FormEvent) {
    e.preventDefault()
    const trimmed = codigo.trim()
    if (!trimmed) return

    setState('loading')
    setErrorMsg('')
    setLocalProduct(null)

    try {
      const res = await api.productos.lookupOpenFoodFacts(trimmed)

      if (res.local && res.producto) {
        setLocalProduct(res.producto)
        setState('foundLocal')
        onProductFound(res.producto)
      } else if (res.encontrado && res.datos) {
        setState('foundRemote')
        onPrefillForm(res.datos)
      } else {
        setState('notFound')
        onNotFound(trimmed)
      }
    } catch (e: any) {
      setState('error')
      setErrorMsg(e.message || 'Error al buscar')
    }
  }

  function handleCrearManual() {
    const trimmed = codigo.trim()
    if (trimmed) {
      onNotFound(trimmed)
    }
  }

  return (
    <div className="space-y-3">
      <form onSubmit={handleLookup} className="flex gap-2">
        <input
          className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-mono"
          placeholder="Código de barras"
          value={codigo}
          onChange={(e) => setCodigo(e.target.value)}
          autoFocus
        />
        <button
          type="submit"
          disabled={state === 'loading'}
          className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {state === 'loading' ? (
            <>
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Buscando...
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
      </form>

      {/* Found locally */}
      {state === 'foundLocal' && localProduct && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
            <p className="font-semibold text-green-900 text-sm">Producto existente</p>
          </div>
          <p className="text-green-800 font-medium">{localProduct.nombre}</p>
          <p className="text-green-600 text-sm mt-1">${localProduct.precio.toFixed(2)}</p>
        </div>
      )}

      {/* Found in Open Food Facts */}
      {state === 'foundRemote' && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-800 flex items-center gap-2">
          <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
          </svg>
          Producto encontrado en Open Food Facts — completá los datos faltantes abajo.
        </div>
      )}

      {/* Not found */}
      {state === 'notFound' && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="font-medium text-amber-900 text-sm mb-3">Producto no encontrado</p>
          <button
            onClick={handleCrearManual}
            className="bg-amber-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-amber-700 transition-colors"
          >
            Crear manualmente
          </button>
        </div>
      )}

      {/* Error */}
      {state === 'error' && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="font-medium text-red-900 text-sm mb-1">Error al buscar</p>
          <p className="text-red-700 text-xs mb-3">{errorMsg}</p>
          <button
            onClick={handleCrearManual}
            className="bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-red-700 transition-colors"
          >
            Crear manualmente
          </button>
        </div>
      )}
    </div>
  )
}
