import { useRef } from 'react'
import Button from '../../components/ui/Button'
import type { VentaResultadoDto, UsuarioInfo } from '../../types'

interface ItemEmitido {
  producto: { id: number; nombre: string; precio: number }
  cantidad: number
}

interface TicketResultadoProps {
  resultado: VentaResultadoDto
  ultimosItems: ItemEmitido[]
  user: UsuarioInfo | null
  onNuevaVenta: () => void
}

export default function TicketResultado({ resultado, ultimosItems, user, onNuevaVenta }: TicketResultadoProps) {
  const imprimirBtnRef = useRef<HTMLButtonElement>(null!)
  const nuevaVentaBtnRef = useRef<HTMLButtonElement>(null!)

  const COL = 40
  const fmtPeso = (n: number) => '$' + n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const padFmt = (n: number) => fmtPeso(n).padStart(14)
  const LR = (left: string, right: string) => {
    const avail = COL - left.length
    return left + (avail > 0 ? right.padStart(avail) : ' ' + right)
  }
  const f = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleDateString('es-AR') + ' ' + d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
  }

  const line = '─'.repeat(COL)
  const dline = '═'.repeat(COL)
  const totalItems = ultimosItems.reduce((s, i) => s + i.cantidad, 0)

  const handlePrint = () => window.print()

  return (
    <div className="max-w-3xl mx-auto mt-8 px-4">
      <div className="no-print text-center mb-6">
        <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-6 py-3 rounded-full text-lg font-semibold">
          VENTA REGISTRADA
        </div>
      </div>

      <div className="receipt bg-white py-6 px-4 max-w-[80mm] mx-auto font-mono text-[11px] leading-[1.45] text-gray-900"
        style={{ fontFamily: "'Courier New', Courier, monospace" }}>
        <div className="text-center font-bold text-[13px]">{resultado.empresaNombre ?? 'PosWeb'}</div>
        <div className="text-center font-bold text-[12px] mt-2 mb-3">TICKET DE COMPRA</div>

        <div>Fecha: {f(resultado.fecha)}</div>
        <div>Ticket #: {String(resultado.ventaId).padStart(6, '0')}</div>
        <div>Vendedor: {user?.nombre ?? '—'}</div>
        <div className="mb-2">{line}</div>

        {ultimosItems.map((item, i) => {
          const name = item.producto.nombre.length > 26 ? item.producto.nombre.slice(0, 23) + '...' : item.producto.nombre
          return (
            <div key={i}>
              <div>{String(item.cantidad).padStart(2)}   {name}</div>
              <div>{LR(padFmt(item.producto.precio) + ' c/u', padFmt(item.producto.precio * item.cantidad))}</div>
            </div>
          )
        })}

        <div className="mt-1 mb-1">{line}</div>
        <div>Artículos: {totalItems}</div>
        <div className="mt-2 mb-1">{dline}</div>

        <div className="font-bold text-[15px] py-1">{LR('TOTAL', padFmt(resultado.total))}</div>
        <div className="mt-1 mb-2">{dline}</div>

        {resultado.pagos.map((p, i) => (
          <div key={i}>{LR('Pago:', p.medioPagoNombre.toUpperCase())}</div>
        ))}
        {resultado.cambio > 0 && (
          <>
            <div>{LR('Pagó:', padFmt(resultado.total + resultado.cambio))}</div>
            <div>{LR('Cambio:', padFmt(resultado.cambio))}</div>
          </>
        )}

        <div className="text-center mt-4 font-bold">¡GRACIAS POR SU COMPRA!</div>
        <div className="text-center text-[9px] mt-1">NO VÁLIDO COMO FACTURA</div>
      </div>

      <div className="no-print flex justify-center gap-3 mt-6 flex-wrap">
        <Button
          ref={imprimirBtnRef}
          variant="secondary"
          size="md"
          onClick={handlePrint}
          onKeyDown={e => {
            if (e.key === 'ArrowRight') {
              e.preventDefault()
              nuevaVentaBtnRef.current?.focus()
            }
          }}
        >
          Imprimir
        </Button>
        <Button
          ref={nuevaVentaBtnRef}
          variant="primary"
          size="md"
          onClick={onNuevaVenta}
          autoFocus
          onKeyDown={e => {
            if (e.key === 'ArrowLeft') {
              e.preventDefault()
              imprimirBtnRef.current?.focus()
            }
          }}
        >
          Nueva venta
        </Button>
      </div>
    </div>
  )
}
