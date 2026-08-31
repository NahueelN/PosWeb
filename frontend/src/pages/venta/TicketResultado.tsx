import { useEffect, useRef, useState } from 'react'
import { Printer } from 'lucide-react'
import Button from '../../components/ui/Button'
import { api } from '../../api/client'
import type { VentaResultadoDto, UsuarioInfo } from '../../types'
import { buildTicketLines, type TicketLine, type TicketWidth } from '../../lib/ticket'
import './TicketResultado.css'

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

type Letra = 'chica' | 'mediana' | 'grande'

const LETRAS: { id: Letra; label: string }[] = [
  { id: 'chica', label: 'Chica' },
  { id: 'mediana', label: 'Mediana' },
  { id: 'grande', label: 'Grande' },
]

const LETRA_PX: Record<Letra, Record<TicketWidth, { base: number; lg: number; md: number; sm: number }>> = {
  chica: {
    58: { base: 11, lg: 14, md: 12, sm: 10 },
    80: { base: 12, lg: 16, md: 14, sm: 10 },
  },
  mediana: {
    58: { base: 13, lg: 17, md: 14, sm: 12 },
    80: { base: 14, lg: 19, md: 17, sm: 12 },
  },
  grande: {
    58: { base: 15, lg: 20, md: 17, sm: 14 },
    80: { base: 17, lg: 22, md: 20, sm: 14 },
  },
}

const TXT: Record<number, string> = {
  10: 'text-[10px]',
  11: 'text-[11px]',
  12: 'text-[12px]',
  13: 'text-[13px]',
  14: 'text-[14px]',
  15: 'text-[15px]',
  16: 'text-[16px]',
  17: 'text-[17px]',
  19: 'text-[19px]',
  20: 'text-[20px]',
  22: 'text-[22px]',
}

export default function TicketResultado({ resultado, ultimosItems, user, onNuevaVenta }: TicketResultadoProps) {
  const imprimirBtnRef = useRef<HTMLButtonElement>(null!)
  const nuevaVentaBtnRef = useRef<HTMLButtonElement>(null!)
  const receiptRef = useRef<HTMLDivElement>(null)
  const [ancho, setAncho] = useState<TicketWidth>(() => {
    const saved = localStorage.getItem('posweb-ticket-ancho')
    return saved === '58' ? 58 : 80
  })
  const [letra, setLetra] = useState<Letra>(() => {
    const saved = localStorage.getItem('posweb-ticket-letra')
    return saved === 'chica' || saved === 'mediana' || saved === 'grande' ? saved : 'chica'
  })

  const persistirTicket = (nuevoAncho: TicketWidth, nuevaLetra: Letra) => {
    localStorage.setItem('posweb-ticket-ancho', String(nuevoAncho))
    localStorage.setItem('posweb-ticket-letra', nuevaLetra)
    api.preferencias.guardar({ ticket: { ancho: String(nuevoAncho), letra: nuevaLetra } }).catch(() => {})
  }

  useEffect(() => {
    let mounted = true
    api.preferencias.obtener()
      .then(res => {
        if (!mounted) return
        const t = res.preferencias?.ticket
        if (!t) return
        if (t.ancho === '58' || t.ancho === '80') setAncho(Number(t.ancho) as TicketWidth)
        if (t.letra === 'chica' || t.letra === 'mediana' || t.letra === 'grande') setLetra(t.letra as Letra)
        localStorage.setItem('posweb-ticket-ancho', String(t.ancho))
        localStorage.setItem('posweb-ticket-letra', t.letra)
      })
      .catch(() => {})
    return () => { mounted = false }
  }, [])

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

  const sizeClsFor = (l: TicketLine) => {
    const px = LETRA_PX[letra][ancho]
    return l.size === 'lg' ? TXT[px.lg] : l.size === 'md' ? TXT[px.md] : l.size === 'sm' ? TXT[px.sm] : TXT[px.base]
  }

  const handlePrint = async () => {
    if ('__TAURI_INTERNALS__' in window) {
      localStorage.setItem('posweb-ticket-print', JSON.stringify({ ancho, letra, lines }))
      const { WebviewWindow } = await import('@tauri-apps/api/webviewWindow')
      new WebviewWindow(`ticket-print-${Date.now()}`, {
        url: 'ticket-print.html',
        title: 'Imprimir ticket',
        width: 1200,
        height: 700,
        resizable: false,
        center: true,
      })
      return
    }

    const ticketWindow = window.open('', 'posweb-ticket', `width=${ancho === 58 ? 360 : 460},height=700`)
    const ticketHtml = receiptRef.current?.outerHTML

    if (ticketWindow && ticketHtml) {
      const pxCss = Array.from({ length: 13 }, (_, i) => `.text-[${i + 10}px]{font-size:${i + 10}px}`).join('')
      ticketWindow.document.write(`<!doctype html>
<html><head><title>Ticket</title><style>
@page { size: ${ancho}mm auto; margin: 0; }
html, body { margin: 0; padding: 0; width: ${ancho}mm; }
.receipt { width: ${ancho}mm; padding: 2mm; box-sizing: border-box; font-family: 'Courier New', Courier, monospace; color: #000; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.receipt div { font-weight: 900; }
.text-center{text-align:center}.mt-2{margin-top:8px}.mb-1{margin-bottom:4px}
${pxCss}
</style></head><body>${ticketHtml}<script>window.onload = () => { window.focus(); window.print(); }; window.onafterprint = () => window.close();</script></body></html>`)
      ticketWindow.document.close()
      return
    }

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

  return (
    <div className="max-w-3xl mx-auto mt-8 px-4">
      <div className="no-print text-center mb-6">
        <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-6 py-3 rounded-full text-lg font-semibold">
          VENTA REGISTRADA
        </div>
      </div>

      <div className="no-print flex justify-center gap-3 mt-6 flex-wrap items-center">
        <div className="flex items-center gap-1 rounded-lg border border-gray-200 p-1 bg-white shadow-sm">
          <span className="text-[11px] text-gray-400 font-medium px-2">Ticket</span>
          <button
            onClick={() => { setAncho(58); persistirTicket(58, letra) }}
            className={`px-2.5 py-1 rounded-md text-[12px] font-semibold transition-colors ${ancho === 58 ? 'bg-[oklch(0.52_0.255_278)] text-white' : 'text-gray-500 hover:bg-gray-100'}`}
          >
            58 mm
          </button>
          <button
            onClick={() => { setAncho(80); persistirTicket(80, letra) }}
            className={`px-2.5 py-1 rounded-md text-[12px] font-semibold transition-colors ${ancho === 80 ? 'bg-[oklch(0.52_0.255_278)] text-white' : 'text-gray-500 hover:bg-gray-100'}`}
          >
            80 mm
          </button>
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-gray-200 p-1 bg-white shadow-sm">
          <span className="text-[11px] text-gray-400 font-medium px-2">Letra</span>
          {LETRAS.map(l => (
            <button
              key={l.id}
              onClick={() => {
                setLetra(l.id)
                persistirTicket(ancho, l.id)
              }}
              className={`px-2.5 py-1 rounded-md text-[12px] font-semibold transition-colors ${letra === l.id ? 'bg-[oklch(0.52_0.255_278)] text-white' : 'text-gray-500 hover:bg-gray-100'}`}
            >
              {l.label}
            </button>
          ))}
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

      <div ref={receiptRef} className="receipt bg-white py-6 px-4 mx-auto font-mono leading-[1.45] text-gray-900"
        style={{ fontFamily: "'Courier New', Courier, monospace", width: `${ancho}mm`, overflowX: 'hidden' }}>
        {lines.map((l, i) => {
          const sizeCls = sizeClsFor(l)
          return (
            <div
              key={i}
              className={`${sizeCls} ${l.bold ? 'font-bold' : ''} ${l.center ? 'text-center' : ''} ${l.space ? 'mt-2 mb-1' : ''}`}
              style={l.center ? { textAlign: 'center' } : undefined}
            >
              {l.text}
            </div>
          )
        })}
      </div>
    </div>
  )
}
