import type { VentaDetalleDto } from '../../types'
import { formatCurrency } from '../../formats'

interface VentaDetalleModalProps {
  venta: VentaDetalleDto
  onClose: () => void
}

function fechaHora(iso: string): string {
  return new Date(iso).toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function VentaDetalleModal({ venta, onClose }: VentaDetalleModalProps) {
  const cantidadTotal = venta.items.reduce((s, i) => s + i.cantidad, 0)

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between p-6 pb-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Venta #{venta.ventaId}</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {fechaHora(venta.fecha)}{venta.vendedor ? ` · ${venta.vendedor}` : ''}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Artículos ({cantidadTotal})
          </p>
          <ul className="divide-y-2 divide-gray-200">
            {venta.items.map((item, i) => (
              <li key={i} className="flex items-start gap-3 py-2.5">
                <span className="shrink-0 min-w-8 h-8 px-1.5 rounded-lg bg-gray-100 text-gray-600 text-sm font-semibold flex items-center justify-center tabular-nums">
                  {item.cantidad}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-800">{item.productoNombre}</p>
                  {item.codigoBarra && (
                    <p className="text-[11px] text-gray-400 font-mono">
                      {item.codigoBarra} · {formatCurrency(item.precioUnitario)} c/u
                    </p>
                  )}
                </div>
                <span className="shrink-0 text-sm font-semibold text-gray-900 tabular-nums">
                  {formatCurrency(item.subtotal)}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-4 bg-gray-50 rounded-xl p-4">
            <dl className="space-y-2">
              {venta.pagos.map((p, i) => (
                <div key={i} className="flex justify-between items-center text-sm">
                  <dt className="text-gray-500">
                    Forma de pago: <span className="font-medium text-gray-700">{p.medioPagoNombre}</span>
                  </dt>
                  <dd className="text-gray-800 tabular-nums">{formatCurrency(p.monto)}</dd>
                </div>
              ))}
              {venta.cambio > 0 && (
                <div className="flex justify-between items-center text-sm">
                  <dt className="text-gray-500">Cambio</dt>
                  <dd className="text-gray-800 tabular-nums">{formatCurrency(venta.cambio)}</dd>
                </div>
              )}
              <hr className="border-gray-200" />
              <div className="flex justify-between items-center">
                <dt className="text-sm font-semibold text-gray-800">Total</dt>
                <dd className="text-base font-bold text-gray-900 tabular-nums">{formatCurrency(venta.total)}</dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="p-4 border-t border-gray-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
