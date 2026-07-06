import { useEffect } from 'react'
import Dialog from '../../components/ui/Dialog'
import Button from '../../components/ui/Button'
import type { ClienteDto } from '../../types'

export interface StockConflictItem {
  producto: { id: number; nombre: string; stock: number }
  cantidad: number
}

interface VentaDialogsProps {
  showStockConfirm: boolean
  stockConflictItems: StockConflictItem[]
  onStockCancel: (firstItem: StockConflictItem | null) => void
  onStockContinue: () => void
  stockCancelarRef: React.RefObject<HTMLButtonElement | null>

  showClientPopup: boolean
  clientesBusqueda: string
  clientesResultados: ClienteDto[]
  buscandoClientes: boolean
  onClientPopupClose: () => void
  onClientSearchChange: (q: string) => void
  onClientSelect: (c: ClienteDto) => void
  clientesResultsRef: React.RefObject<HTMLDivElement | null>
  total: number
  recibio: string

  showNuevoCliente: boolean
  nuevoClienteNombre: string
  esOcasional: boolean
  formCliente: { tipoDocumento: string; numeroDocumento: string; ivaCondicion: string; telefono: string; domicilio: string; mail: string }
  onNuevoClienteClose: () => void
  onNuevoClienteNombreChange: (n: string) => void
  onEsOcasionalChange: (v: boolean) => void
  onFormClienteChange: (f: { tipoDocumento: string; numeroDocumento: string; ivaCondicion: string; telefono: string; domicilio: string; mail: string }) => void
  onCrearCliente: () => void
  onAbrirNuevoCliente: () => void
}

export default function VentaDialogs({
  showStockConfirm, stockConflictItems, onStockCancel, onStockContinue, stockCancelarRef,
  showClientPopup, clientesBusqueda, clientesResultados, buscandoClientes, onClientPopupClose,
  onClientSearchChange, onClientSelect, clientesResultsRef, total, recibio,
  showNuevoCliente, nuevoClienteNombre, esOcasional, formCliente, onNuevoClienteClose,
  onNuevoClienteNombreChange, onEsOcasionalChange, onFormClienteChange, onCrearCliente, onAbrirNuevoCliente,
}: VentaDialogsProps) {
  useEffect(() => {
    if (showStockConfirm) {
      setTimeout(() => stockCancelarRef.current?.focus(), 50)
    }
  }, [showStockConfirm])

  return (
    <>
      <Dialog
        open={showStockConfirm}
        onClose={() => {
          onStockCancel(null)
        }}
        title="Stock insuficiente"
        description="Estos productos no tienen stock suficiente:"
        footer={
          <>
            <Button ref={stockCancelarRef} variant="secondary" size="sm" onClick={() => onStockCancel(stockConflictItems[0] ?? null)}>
              Cancelar
            </Button>
            <Button variant="primary" size="sm" onClick={onStockContinue}>
              Continuar
            </Button>
          </>
        }
      >
        <div className="bg-red-50 rounded-xl p-3 space-y-2 max-h-40 overflow-y-auto">
          {stockConflictItems.map(i => (
            <div key={i.producto.id} className="flex justify-between text-sm">
              <span className="text-gray-700 font-medium truncate mr-2">{i.producto.nombre}</span>
              <span className="text-gray-500 shrink-0">disp: {i.producto.stock} · pedido: {i.cantidad}</span>
            </div>
          ))}
        </div>
        <p className="text-sm text-gray-600 mt-4">¿Vender igual sin stock?</p>
      </Dialog>

      <Dialog
        open={showClientPopup}
        onClose={onClientPopupClose}
        title="Cobro pendiente"
        description="El pago recibido no cubre el total. Seleccioná un cliente para registrar la deuda."
      >
        <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm mb-3">
          <div className="flex justify-between">
            <span className="text-gray-500">Total</span>
            <span className="font-semibold text-gray-900">${total.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Pagado</span>
            <span className="font-semibold text-emerald-600">${(parseFloat(recibio) || 0).toFixed(2)}</span>
          </div>
          <hr className="border-gray-200" />
          <div className="flex justify-between">
            <span className="text-gray-500">Pendiente</span>
            <span className="font-semibold text-red-600">${(total - (parseFloat(recibio) || 0)).toFixed(2)}</span>
          </div>
        </div>
        <input
          autoFocus
          type="text"
          placeholder="Buscá por nombre o teléfono..."
          value={clientesBusqueda}
          onChange={e => onClientSearchChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown' && clientesResultados.length > 0) {
              e.preventDefault()
              clientesResultsRef.current?.querySelector<HTMLButtonElement>('button')?.focus()
            }
          }}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[oklch(0.52_0.255_278_/_0.30)] focus:border-[oklch(0.52_0.255_278_/_0.60)] outline-none mb-3"
        />

        {buscandoClientes && (
          <div className="space-y-2 py-4">
            {[1,2,3].map(i => (
              <div key={i} className="flex items-center gap-3 px-3 py-2.5 animate-pulse">
                <div className="w-8 h-8 rounded-full bg-gray-200" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 bg-gray-200 rounded w-3/5" />
                  <div className="h-2.5 bg-gray-100 rounded w-2/5" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!buscandoClientes && clientesResultados.length > 0 && (
          <p className="text-xs text-gray-400 mb-1 px-1">
            {clientesResultados.length} resultado{clientesResultados.length !== 1 ? 's' : ''}
          </p>
        )}

        {!buscandoClientes && clientesResultados.length === 0 && clientesBusqueda.trim().length >= 1 && (
          <p className="text-sm text-gray-400 text-center py-8">
            No se encontraron clientes con ese nombre
          </p>
        )}
        <div ref={clientesResultsRef} className="flex-1 overflow-y-auto space-y-1 min-h-0"
          onKeyDown={(e) => {
            if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
            const buttons = e.currentTarget.querySelectorAll<HTMLButtonElement>('button')
            if (buttons.length < 2) return
            const idx = Array.from(buttons).indexOf(document.activeElement as HTMLButtonElement)
            if (idx < 0) { buttons[0]?.focus(); return }
            e.preventDefault()
            const next = e.key === 'ArrowDown' ? Math.min(idx + 1, buttons.length - 1) : Math.max(idx - 1, 0)
            buttons[next]?.focus()
          }}
        >
          {clientesResultados.map(cl => (
            <button
              key={cl.id}
              onClick={() => onClientSelect(cl)}
              className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-indigo-50 transition-colors flex items-center gap-3"
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold shrink-0 ${
                ['bg-indigo-500','bg-emerald-500','bg-amber-500','bg-rose-500','bg-sky-500','bg-violet-500','bg-teal-500','bg-orange-500'][(cl.id ?? 0) % 8]
              }`}>
                {cl.nombre.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{cl.nombre}</p>
                <p className="text-xs text-gray-400 truncate">
                  {cl.tipoDocumento} {cl.numeroDocumento}
                  {cl.telefono && ` · ${cl.telefono}`}
                </p>
              </div>
            </button>
          ))}
        </div>

        <button onClick={onAbrirNuevoCliente} className="mt-3 w-full py-2 text-sm font-semibold text-[oklch(0.52_0.255_278)] border border-dashed border-[oklch(0.52_0.255_278_/_0.30)] rounded-lg hover:bg-[oklch(0.52_0.255_278_/_0.05)] transition-colors">
          + Nuevo cliente
        </button>
      </Dialog>

      <Dialog
        open={showNuevoCliente}
        onClose={onNuevoClienteClose}
        title="Nuevo cliente"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={onNuevoClienteClose}>
              Cancelar
            </Button>
            <Button variant="primary" size="sm" onClick={onCrearCliente} disabled={nuevoClienteNombre.trim().length < 2}>
              Crear y seleccionar
            </Button>
          </>
        }
      >
        <input
          autoFocus
          type="text"
          placeholder="Nombre del cliente"
          value={nuevoClienteNombre}
          onChange={e => onNuevoClienteNombreChange(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && nuevoClienteNombre.trim().length >= 2) {
              e.preventDefault()
              onCrearCliente()
            }
          }}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[oklch(0.52_0.255_278_/_0.30)] focus:border-[oklch(0.52_0.255_278_/_0.60)] outline-none mb-1"
        />
        {nuevoClienteNombre.trim().length < 2 && nuevoClienteNombre.length > 0 && (
          <p className="text-xs text-red-500 mb-2">Al menos 2 caracteres</p>
        )}

        <label className="flex items-center gap-2 cursor-pointer mt-2 mb-3">
          <input type="checkbox" checked={esOcasional} onChange={e => onEsOcasionalChange(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-[oklch(0.52_0.255_278)] focus:ring-[oklch(0.52_0.255_278_/_0.30)]" />
          <span className="text-sm text-gray-700">Cliente ocasional (solo nombre, sin DNI)</span>
        </label>

        {!esOcasional && (
          <div className="space-y-3 pt-2 border-t border-gray-100">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Tipo documento</label>
                <select value={formCliente.tipoDocumento}
                  onChange={e => onFormClienteChange({ ...formCliente, tipoDocumento: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
                  <option value="DNI">DNI</option>
                  <option value="CUIT">CUIT</option>
                  <option value="CUIL">CUIL</option>
                  <option value="ConsumidorFinal">Consumidor Final</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">N° documento</label>
                <input type="text" value={formCliente.numeroDocumento}
                  onChange={e => onFormClienteChange({ ...formCliente, numeroDocumento: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  disabled={formCliente.tipoDocumento === 'ConsumidorFinal'} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Condición IVA</label>
              <select value={formCliente.ivaCondicion}
                onChange={e => onFormClienteChange({ ...formCliente, ivaCondicion: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
                <option value="ResponsableInscripto">Responsable Inscripto</option>
                <option value="Monotributo">Monotributo</option>
                <option value="Exento">Exento</option>
                <option value="ConsumidorFinal">Consumidor Final</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Mail</label>
              <input type="email" value={formCliente.mail}
                onChange={e => onFormClienteChange({ ...formCliente, mail: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Teléfono</label>
                <input type="text" value={formCliente.telefono}
                  onChange={e => onFormClienteChange({ ...formCliente, telefono: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Domicilio</label>
                <input type="text" value={formCliente.domicilio}
                  onChange={e => onFormClienteChange({ ...formCliente, domicilio: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
              </div>
            </div>
          </div>
        )}
      </Dialog>
    </>
  )
}
