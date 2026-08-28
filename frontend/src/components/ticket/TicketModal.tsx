import { useRef, useState } from 'react'
import { Printer, X } from 'lucide-react'
import { buildTicketLines, type TicketData, type TicketWidth } from '../../lib/ticket'

interface TicketModalProps {
  data: TicketData
  onClose: () => void
}

export default function TicketModal({ data, onClose }: TicketModalProps) {
  const receiptRef = useRef<HTMLDivElement>(null)
  const [ancho, setAncho] = useState<TicketWidth>(80)

  const lines = buildTicketLines(data, ancho)

  const handlePrint = async () => {
    if ('__TAURI_INTERNALS__' in window) {
      localStorage.setItem('posweb-ticket-print', JSON.stringify({ ancho, lines }))
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
      ticketWindow.document.write(`<!doctype html>
<html><head><title>Ticket</title><style>
@page { size: ${ancho}mm auto; margin: 0; }
html, body { margin: 0; padding: 0; width: ${ancho}mm; }
.receipt { width: ${ancho}mm; padding: 2mm; box-sizing: border-box; font-family: 'Courier New', Courier, monospace; color: #000; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.receipt div { font-weight: 900; }
.text-[10px]{font-size:10px}.text-[11px]{font-size:11px}.text-[12px]{font-size:12px}.text-[13px]{font-size:13px}.text-[14px]{font-size:14px}.text-[15px]{font-size:15px}.text-[16px]{font-size:16px}
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

  const fontSize = ancho === 58 ? 'text-[11px]' : 'text-[12px]'

  return (
    <div className="fixed inset-0 bg-black/30 z-[60] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800">Ticket</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100">
            <X size={16} />
          </button>
        </div>

        <div ref={receiptRef} className="receipt bg-white mx-auto font-mono leading-[1.45] text-gray-900"
          style={{ fontFamily: "'Courier New', Courier, monospace", width: `${ancho}mm` }}>
          {lines.map((l, i) => {
            const sizeCls =
              l.size === 'lg' ? (ancho === 58 ? 'text-[14px]' : 'text-[16px]')
              : l.size === 'md' ? (ancho === 58 ? 'text-[12px]' : 'text-[14px]')
              : l.size === 'sm' ? 'text-[10px]'
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

        <div className="flex justify-center gap-3 mt-4 flex-wrap items-center">
          <div className="flex items-center gap-1 rounded-lg border border-gray-200 p-1 bg-white shadow-sm">
            <span className="text-[11px] text-gray-400 font-medium px-2">Ticket</span>
            <button
              onClick={() => setAncho(58)}
              className={`px-2.5 py-1 rounded-md text-[12px] font-semibold transition-colors ${ancho === 58 ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
            >
              58 mm
            </button>
            <button
              onClick={() => setAncho(80)}
              className={`px-2.5 py-1 rounded-md text-[12px] font-semibold transition-colors ${ancho === 80 ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
            >
              80 mm
            </button>
          </div>
          <button onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors">
            <Printer size={14} />
            Imprimir
          </button>
        </div>
      </div>
    </div>
  )
}
