import { useRef, useState } from 'react'
import { Download, Printer } from 'lucide-react'
import Button from '../../components/ui/Button'
import type { VentaResultadoDto, UsuarioInfo } from '../../types'
import { buildTicketLines, TICKET_COLS, TICKET_DPI, type TicketWidth } from '../../lib/ticket'

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
  const descargarBtnRef = useRef<HTMLButtonElement>(null!)
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
  const handleDownload = () => {
    const dpi = TICKET_DPI[ancho]
    const targetW = ancho
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let fontSizePx = 12
    const measure = (size: number) => {
      ctx.font = `bold ${size}px 'Courier New', Courier, monospace`
      return ctx.measureText('M').width
    }
    for (let i = 0; i < 16; i++) {
      const w = measure(fontSizePx) * TICKET_COLS[ancho]
      const targetPx = targetW * (dpi / 25.4)
      fontSizePx *= targetPx / w
    }

    const charW = measure(fontSizePx)
    const contentW = Math.round(charW * TICKET_COLS[ancho])
    const lineH = Math.round(fontSizePx * 1.5)

    canvas.width = contentW
    canvas.height = lines.length * lineH

    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = '#000000'
    ctx.textBaseline = 'top'

    lines.forEach((entry, i) => {
      ctx.font = `${entry.bold ? 'bold ' : ''}${fontSizePx}px 'Courier New', Courier, monospace`
      const y = i * lineH
      const x = entry.center ? (contentW - ctx.measureText(entry.text).width) / 2 : 0
      ctx.fillText(entry.text, x, y)
    })

    // Metadatos DPI (pHYs): la impresora interpreta los píxeles como mm reales
    const blob = canvas.toDataURL('image/png')
    const bytes = Uint8Array.from(atob(blob.split(',')[1]), c => c.charCodeAt(0))
    const ppm = Math.round(dpi / 0.0254)
    const phy = new Uint8Array(9)
    new DataView(phy.buffer).setUint32(0, ppm, false)
    new DataView(phy.buffer).setUint32(4, ppm, false)
    phy[8] = 1
    const pHYsChunk = new Uint8Array(21)
    new DataView(pHYsChunk.buffer).setUint32(0, 9, false)
    pHYsChunk[4] = 0x70; pHYsChunk[5] = 0x48; pHYsChunk[6] = 0x59; pHYsChunk[7] = 0x73
    pHYsChunk.set(phy, 8)
    let crc = 0xFFFFFFFF
    for (let i = 4; i < 17; i++) {
      crc ^= pHYsChunk[i]
      for (let b = 0; b < 8; b++) crc = (crc >>> 1) ^ (0xEDB88320 & -(crc & 1))
    }
    new DataView(pHYsChunk.buffer).setUint32(17, (crc ^ 0xFFFFFFFF) >>> 0, false)

    const out = new Uint8Array(bytes.length + pHYsChunk.length)
    out.set(bytes.subarray(0, 8), 0)
    out.set(bytes.subarray(8, 33), 8)
    out.set(pHYsChunk, 33)
    out.set(bytes.subarray(33), 33 + pHYsChunk.length)

    const fileName = `ticket-${String(resultado.ventaId).padStart(6, '0')}.png`
    const isTauri = !!(window as unknown as { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__

    if (isTauri) {
      // Tauri: usar diálogo nativo "Guardar como" + plugin-fs
      Promise.all([import('@tauri-apps/plugin-dialog'), import('@tauri-apps/plugin-fs')])
        .then(async ([dialog, fs]) => {
          const path = await dialog.save({
            title: 'Guardar ticket',
            defaultPath: fileName,
            filters: [{ name: 'PNG', extensions: ['png'] }],
          })
          if (!path) return
          await fs.writeFile(path, out)
        })
        .catch(e => console.error('[Ticket] Failed to save file:', e))
      return
    }

    const blobFinal = new Blob([out.buffer as ArrayBuffer], { type: 'image/png' })
    const url = URL.createObjectURL(blobFinal)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
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
              descargarBtnRef.current?.focus()
            }
          }}
        >
          Imprimir
        </Button>
        <Button
          ref={descargarBtnRef}
          variant="secondary"
          size="md"
          icon={<Download size={14} />}
          onClick={handleDownload}
          onKeyDown={e => {
            if (e.key === 'ArrowLeft') {
              e.preventDefault()
              imprimirBtnRef.current?.focus()
            } else if (e.key === 'ArrowRight') {
              e.preventDefault()
              nuevaVentaBtnRef.current?.focus()
            }
          }}
        >
          Descargar
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
              descargarBtnRef.current?.focus()
            }
          }}
        >
          Nueva venta
        </Button>
      </div>
    </div>
  )
}
