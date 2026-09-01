import type { VentaDetalleDto, CompraDetalleDto } from '../types'

interface DetalleVentaCompraModalProps {
  tipo: 'venta' | 'compra'
  detalle: VentaDetalleDto | CompraDetalleDto
  onClose: () => void
}

export default function DetalleVentaCompraModal({ tipo, detalle, onClose }: DetalleVentaCompraModalProps) {
  const esVenta = tipo === 'venta'
  const d = detalle
  const titulo = esVenta
    ? `Detalle de Venta #${(d as VentaDetalleDto).ventaId}`
    : `Detalle de Compra #${(d as CompraDetalleDto).numeroComprobante}`
  const extra = esVenta
    ? (d as VentaDetalleDto).vendedor
    : (d as CompraDetalleDto).proveedorNombre

  return (
    <div className="fixed inset-0 bg-black/30 z-[60] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl p-6 max-w-2xl w-full max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">{titulo}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
          <div><span className="text-gray-500">Fecha:</span> <span className="font-medium">{new Date(d.fecha).toLocaleString('es-AR')}</span></div>
          <div><span className="text-gray-500">Sucursal:</span> <span className="font-medium">{d.sucursalNombre}</span></div>
          {extra && <div className="col-span-2"><span className="text-gray-500">{esVenta ? 'Vendedor' : 'Proveedor'}:</span> <span className="font-medium">{extra}</span></div>}
        </div>
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left pb-2">Código Barra</th>
              <th className="text-left pb-2">Producto</th>
              <th className="text-right pb-2">Cant.</th>
              <th className="text-right pb-2">P/U</th>
              <th className="text-right pb-2">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {d.items.map((item, idx) => (
              <tr key={idx} className="border-b border-gray-50">
                <td className="py-1.5 pr-2 font-mono text-gray-500">{item.codigoBarra}</td>
                <td className="py-1.5 pr-2 font-medium text-gray-800">{item.productoNombre}</td>
                <td className="py-1.5 text-right text-gray-700">{item.cantidad}</td>
                <td className="py-1.5 text-right text-gray-700">${item.precioUnitario.toFixed(2)}</td>
                <td className="py-1.5 text-right font-semibold text-gray-900">${item.subtotal.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="font-semibold text-gray-900 border-t-2 border-gray-300">
              <td colSpan={4} className="py-2 text-right text-sm">Total:</td>
              <td className="py-2 text-right text-sm">${d.total.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
        <div className="mt-4 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200">Cerrar</button>
        </div>
      </div>
    </div>
  )
}
