import { Printer, X } from 'lucide-react'
import type { CompraDetalleDto } from '../../types'
import { formatCurrency } from '../../formats'
import './CompraResumenModal.css'

interface CompraResumenModalProps {
  data: CompraDetalleDto
  onClose: () => void
}

export default function CompraResumenModal({ data, onClose }: CompraResumenModalProps) {
  const fechaStr = new Date(data.fecha).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  const handlePrint = async () => {
    if ('__TAURI_INTERNALS__' in window) {
      localStorage.setItem('posweb-resumen-print', JSON.stringify({
        empresaNombre: data.empresaNombre,
        numeroComprobante: data.numeroComprobante,
        fecha: fechaStr,
        proveedorNombre: data.proveedorNombre,
        sucursalNombre: data.sucursalNombre,
        items: data.items.map(i => ({
          codigoBarra: i.codigoBarra,
          nombre: i.productoNombre,
          cantidad: i.cantidad,
          precioUnitario: i.precioUnitario,
          subtotal: i.subtotal,
        })),
        total: data.total,
      }))
      const { WebviewWindow } = await import('@tauri-apps/api/webviewWindow')
      new WebviewWindow(`resumen-print-${Date.now()}`, {
        url: 'resumen-print.html',
        title: 'Resumen de compra',
        width: 800,
        height: 700,
        resizable: false,
        center: true,
      })
      return
    }
    window.print()
  }

  return (
    <div className="fixed inset-0 bg-black/30 z-[60] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4 no-print">
          <h3 className="font-semibold text-gray-800">Resumen de compra</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100">
            <X size={16} />
          </button>
        </div>

        <div className="resumen bg-white">
          <div className="text-center font-bold text-gray-900">{data.empresaNombre || 'PosWeb'}</div>
          <div className="text-center font-bold text-gray-900 mb-4">RESUMEN DE COMPRA</div>
          <div className="text-sm text-gray-700 mb-4 space-y-1">
            <div>Fecha: {fechaStr}</div>
            <div>Comprobante #: {String(data.numeroComprobante).padStart(6, '0')}</div>
            {data.proveedorNombre && <div>Proveedor: {data.proveedorNombre}</div>}
            {data.sucursalNombre && <div>Sucursal: {data.sucursalNombre}</div>}
          </div>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr>
                <th className="border border-gray-400 px-2 py-1.5 bg-gray-100 font-semibold text-left">Código</th>
                <th className="border border-gray-400 px-2 py-1.5 bg-gray-100 font-semibold text-left">Producto</th>
                <th className="border border-gray-400 px-2 py-1.5 bg-gray-100 font-semibold text-right">Cant.</th>
                <th className="border border-gray-400 px-2 py-1.5 bg-gray-100 font-semibold text-right">P/U</th>
                <th className="border border-gray-400 px-2 py-1.5 bg-gray-100 font-semibold text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item, idx) => (
                <tr key={idx}>
                  <td className="border border-gray-400 px-2 py-1.5 font-mono text-gray-600">{item.codigoBarra}</td>
                  <td className="border border-gray-400 px-2 py-1.5 font-medium text-gray-800">{item.productoNombre}</td>
                  <td className="border border-gray-400 px-2 py-1.5 text-right text-gray-700">{item.cantidad}</td>
                  <td className="border border-gray-400 px-2 py-1.5 text-right text-gray-700">{formatCurrency(item.precioUnitario)}</td>
                  <td className="border border-gray-400 px-2 py-1.5 text-right font-semibold text-gray-900">{formatCurrency(item.subtotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-3 text-right font-bold text-gray-900">TOTAL: {formatCurrency(data.total)}</div>
        </div>

        <div className="flex justify-end gap-3 mt-4 no-print">
          <button onClick={onClose} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors">Cerrar</button>
          <button onClick={handlePrint} className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors">
            <Printer size={14} />
            Imprimir
          </button>
        </div>
      </div>
    </div>
  )
}
