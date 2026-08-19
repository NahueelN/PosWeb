import { useEffect, useState } from 'react'
import Button from '../ui/Button'

export interface PrecioStockData {
  costo: number
  precio: number
  stock: number
  seguirStock: boolean
}

interface PrecioStockEditorProps {
  initialCosto: number
  initialPrecio: number
  initialStock?: number
  initialSeguirStock?: boolean
  onConfirm: (data: PrecioStockData) => void
  onCancel: () => void
}

/**
 * Reusable "Precios + Inventario" editor (right column of the product modal).
 * Manages costo → margen → precio de venta → ganancia, with the same margin
 * auto-calculation used in ProductFormModal.
 */
export default function PrecioStockEditor({
  initialCosto,
  initialPrecio,
  initialStock = 0,
  initialSeguirStock = true,
  onConfirm,
  onCancel,
}: PrecioStockEditorProps) {
  const [costo, setCosto] = useState(initialCosto > 0 ? String(initialCosto) : '')
  const [precio, setPrecio] = useState(initialPrecio > 0 ? String(initialPrecio) : '')
  const [margen, setMargen] = useState('')
  const [stock, setStock] = useState(initialStock > 0 ? String(initialStock) : '')
  const [seguirStock, setSeguirStock] = useState(initialSeguirStock)

  // Inicializar margen al abrir
  useEffect(() => {
    const c = parseFloat(costo)
    const p = parseFloat(precio)
    if (c > 0 && p > 0) {
      setMargen((Math.round(((p - c) / c) * 10000) / 100).toString())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // costo + margen → precio
  useEffect(() => {
    const c = parseFloat(costo)
    const m = parseFloat(margen)
    if (!isNaN(c) && c > 0 && !isNaN(m) && m > 0) {
      setPrecio((Math.round(c * (1 + m / 100) * 100) / 100).toString())
    }
  }, [costo, margen])

  // precio → margen
  useEffect(() => {
    const c = parseFloat(costo)
    const p = parseFloat(precio)
    if (!isNaN(c) && c > 0 && !isNaN(p) && p > 0) {
      setMargen((Math.round(((p - c) / c) * 10000) / 100).toString())
    }
  }, [precio])

  const precioNum = parseFloat(precio)
  const costoNum = parseFloat(costo)
  const gananciaEstimada = !isNaN(precioNum) && precioNum > 0 && !isNaN(costoNum) && costoNum >= 0 ? precioNum - costoNum : 0
  const precioInferiorCosto = !isNaN(precioNum) && precioNum > 0 && !isNaN(costoNum) && costoNum > 0 && precioNum < costoNum

  function confirmar() {
    onConfirm({
      costo: costoNum || 0,
      precio: precioNum || 0,
      stock: parseInt(stock) || 0,
      seguirStock,
    })
  }

  return (
    <div>
      {/* ── Precios ── */}
      <div className="mb-4">
        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Precios</h4>
        <div className="grid grid-cols-2 gap-1.5">
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Costo</label>
            <input type="number" step="0.01" min="0" value={costo} onChange={e => setCosto(e.target.value)}
              className="w-full h-7 px-2 border border-gray-300 rounded-md text-sm outline-none transition-all duration-150 focus:ring-2 focus:ring-[var(--color-primary-ring)] focus:border-[var(--color-primary)] hover:border-gray-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              placeholder="0.00" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Margen</label>
            <div className="relative">
              <input type="number" step="0.01" min="0" value={margen} onChange={e => setMargen(e.target.value)}
                className="w-full h-7 px-2 pr-7 border border-gray-300 rounded-md text-sm outline-none transition-all duration-150 focus:ring-2 focus:ring-[var(--color-primary-ring)] focus:border-[var(--color-primary)] hover:border-gray-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                placeholder="Auto" />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">%</span>
            </div>
          </div>
        </div>

        {/* Precio de venta */}
        <div className="mt-2.5">
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Precio de venta</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-2xl text-gray-300 select-none font-light">$</span>
            <input type="number" step="0.01" min="0" value={precio} onChange={e => setPrecio(e.target.value)}
              className={`w-full h-12 pl-9 pr-3 rounded-xl text-3xl font-bold outline-none transition-all duration-150 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                precioInferiorCosto
                  ? 'text-red-700 bg-red-50/50 border border-red-300 focus:ring-2 focus:ring-red-500/20 focus:bg-red-50'
                  : 'text-gray-900 bg-white border border-gray-300 focus:ring-2 focus:ring-[var(--color-primary-ring)] focus:border-[var(--color-primary)] focus:bg-white hover:border-gray-400'
              }`}
              placeholder="0,00" />
            {precioInferiorCosto && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500" title="Precio menor al costo">⚠</span>
            )}
          </div>
        </div>

        {/* Ganancia estimada */}
        <div className="flex items-center justify-between mt-2.5">
          <span className="text-[11px] font-medium text-gray-500">Ganancia estimada</span>
          <span className={`text-sm font-bold ${gananciaEstimada > 0 ? 'text-emerald-600' : gananciaEstimada < 0 ? 'text-red-500' : 'text-gray-400'}`}>
            ${gananciaEstimada > 0 ? gananciaEstimada.toFixed(2) : gananciaEstimada < 0 ? gananciaEstimada.toFixed(2) : '0.00'}
          </span>
        </div>
      </div>

      {/* ── Inventario ── */}
      <div className="mb-4">
        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Inventario</h4>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 select-none cursor-pointer">
            <input type="checkbox" checked={seguirStock} onChange={e => setSeguirStock(e.target.checked)}
              className="w-3.5 h-3.5 rounded border-gray-300 text-[var(--color-primary)] focus:ring-[var(--color-primary-ring)] transition-shadow" />
            <span className="text-sm font-medium text-gray-800">Controlar inventario</span>
          </label>
          <span className="text-[11px] text-gray-400 font-normal">— descuenta stock</span>
        </div>
        <div className="flex items-center gap-1.5 mt-1.5">
          <span className="text-sm font-medium whitespace-nowrap text-gray-800">Stock</span>
          <input type="number" min="0" step="1" value={seguirStock ? stock : ''} onChange={e => setStock(e.target.value)} disabled={!seguirStock}
            className="flex-1 h-7 px-1.5 border rounded-md text-sm outline-none transition-all duration-150 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none bg-white border-gray-200 focus:ring-2 focus:ring-[var(--color-primary-ring)] focus:border-[var(--color-primary)] hover:border-gray-400 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
            placeholder={seguirStock ? '0' : 'Sin control'} />
        </div>
      </div>

      {/* ── Acciones ── */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button variant="secondary" size="md" onClick={onCancel}>Cancelar</Button>
        <Button variant="primary" size="md" onClick={confirmar}>Guardar</Button>
      </div>
    </div>
  )
}
