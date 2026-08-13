import { useRef, useState } from 'react'
import { Printer } from 'lucide-react'
import Button from '../../components/ui/Button'
import type { VentaResultadoDto, UsuarioInfo } from '../../types'
import { buildTicketLines, type TicketWidth } from '../../lib/ticket'

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
  const [ancho, setAncho] = useState<TicketWidth>(80)

  const lines = buildTicketLines({
    empresaNombre: resultado.empresaNombre,
    ventaId: resultado.ventaId,
    fecha: resultado.fecha,
    vendedor: user?.nombre,
    items: ultimosItems.map(i => ({ nombre: i.producto.nombre, cantidad: i.cantidad, precio: i.producto.precio })),
    total: resultado.total,
    pagos: resultado.pagos.map(p => ({ nombre: p.medioPagoNombre })),
    cambio: resultado.cambio,
  }, ancho)

  const handlePrint = () => {
    const styleId = 'ticket-print-size'
    const old = document.getElementById(styleId)
    if (old) old.remove()
    const style = document.createElement('style')
    style.id = styleId
    style.textContent = `:root { --ticket-width: ${ancho}mm; } @page { size: ${ancho}mm auto; margin: 0; }`
    document.head.appendChild(style)
    window.print()
    setTimeout(() => document.getElementById(styleId)?.remove(), 200)
  }
  const fontSize = ancho === 58 ? 'text-[10px]' : 'text-[11px]'

  return (
    <div className="max-w-3xl mx-auto mt-8 px-4">
      <div className="no-print text-center mb-6">
        <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-6 py-3 rounded-full text-lg font-semibold">
          VENTA REGISTRADA
        </div>
      </div>

      <div className="receipt bg-white py-6 px-4 mx-auto font-mono leading-[1.45] text-gray-900"
        style={{ fontFamily: "'Courier New', Courier, monospace", width: `${ancho}mm` }}>
        {lines.map((l, i) => {
          const sizeCls =
            l.size === 'lg' ? (ancho === 58 ? 'text-[13px]' : 'text-[15px]')
            : l.size === 'md' ? (ancho === 58 ? 'text-[11px]' : 'text-[13px]')
            : l.size === 'sm' ? 'text-[9px]'
            : fontSize
          return (
            <div
              key={i}
              className={`${sizeCls} ${l.bold ? 'font-bold' : ''} ${l.center ? 'text-center' : ''} ${l.space ? 'mt-2 mb-1' : ''}`}
            >
              {l.text}
            </div>
          )
        })}
      </div>

      <div className="no-print flex justify-center gap-3 mt-6 flex-wrap items-center">
        <div className="flex items-center gap-1 rounded-lg border border-gray-200 p-1 bg-white shadow-sm">
          <span className="text-[11px] text-gray-400 font-medium px-2">Ticket</span>
          <button
            onClick={() => setAncho(58)}
            className={`px-2.5 py-1 rounded-md text-[12px] font-semibold transition-colors ${ancho === 58 ? 'bg-[oklch(0.52_0.255_278)] text-white' : 'text-gray-500 hover:bg-gray-100'}`}
          >
            58 mm
          </button>
          <button
            onClick={() => setAncho(80)}
            className={`px-2.5 py-1 rounded-md text-[12px] font-semibold transition-colors ${ancho === 80 ? 'bg-[oklch(0.52_0.255_278)] text-white' : 'text-gray-500 hover:bg-gray-100'}`}
          >
            80 mm
          </button>
        </div>
        <Button
          ref={imprimirBtnRef}
          variant="secondary"
          size="md"
          icon={<Printer size={14} />}
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
