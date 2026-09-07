import { useEffect, useRef, useState } from 'react'
import { Printer } from 'lucide-react'
import Dialog from './ui/Dialog'
import Button from './ui/Button'
import { getBarcodeFormat, renderBarcode } from '../lib/barcode'
import { api } from '../api/client'

interface BarcodePrintDialogProps {
  codigo: string
  origen: string
  onClose: () => void
}

export default function BarcodePrintDialog({ codigo, origen, onClose }: BarcodePrintDialogProps) {
  const [cantidad, setCantidad] = useState('1')
  const [ancho, setAncho] = useState<58 | 80>(80)
  const previewRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    let mounted = true
    api.preferencias.obtener().then(res => {
      const etiqueta = res.preferencias?.etiquetaCodigo
      if (mounted && (etiqueta?.ancho === '58' || etiqueta?.ancho === '80')) setAncho(Number(etiqueta.ancho) as 58 | 80)
    }).catch(() => {})
    return () => { mounted = false }
  }, [])

  useEffect(() => {
    if (!previewRef.current) return
    renderBarcode(previewRef.current, codigo, ancho)
  }, [codigo, ancho])

  async function imprimir() {
    const cantidadNumero = Math.floor(Number(cantidad))
    if (!Number.isFinite(cantidadNumero) || cantidadNumero < 1) return

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    renderBarcode(svg, codigo, ancho)
    const data = { codigo, origen, cantidad: cantidadNumero, ancho, svg: svg.outerHTML }

    if ('__TAURI_INTERNALS__' in window) {
      const printWindowLabel = `barcode-print-${Date.now()}`
      localStorage.setItem('posweb-barcode-print', JSON.stringify(data))
      const { WebviewWindow } = await import('@tauri-apps/api/webviewWindow')
      new WebviewWindow(printWindowLabel, {
        url: `barcode-print.html?print=${Date.now()}`,
        title: 'Imprimir códigos de barras',
        width: 1200,
        height: 700,
        resizable: false,
        center: true,
        decorations: false,
      })
    } else {
      localStorage.setItem('posweb-barcode-print', JSON.stringify(data))
      window.open(`/barcode-print.html?print=${Date.now()}`, 'posweb-barcode-print', 'width=1200,height=700')
    }
    onClose()
  }

  function persistirAncho(nuevoAncho: 58 | 80) {
    setAncho(nuevoAncho)
    api.preferencias.guardar({ etiquetaCodigo: { ancho: String(nuevoAncho) } }).catch(() => {})
  }

  return (
    <Dialog
      open
      onClose={onClose}
      title="Imprimir código de barras"
      highlight={origen}
      description={`${getBarcodeFormat(codigo)} · ${codigo}`}
      width="sm"
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" size="sm" icon={<Printer size={14} />} onClick={() => void imprimir()}>Imprimir</Button>
        </>
      }
    >
      <div className="space-y-4">
        <label className="block text-sm font-semibold text-gray-700">
          Cantidad de etiquetas
          <input
            autoFocus
            type="number"
            min="1"
            step="1"
            value={cantidad}
            onChange={e => setCantidad(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); void imprimir() } }}
            className="mt-1.5 w-full h-10 px-3 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary-ring)] focus:border-[var(--color-primary)]"
          />
        </label>
        <div>
          <p className="mb-1.5 text-sm font-semibold text-gray-700">Ancho del rollo</p>
          <div className="flex rounded-lg border border-gray-200 bg-gray-50 p-1">
            {[58, 80].map(valor => (
              <button key={valor} type="button" onClick={() => persistirAncho(valor as 58 | 80)}
                className={`flex-1 rounded-md px-3 py-1.5 text-sm font-semibold transition-colors ${ancho === valor ? 'bg-[var(--color-primary)] text-white shadow-sm' : 'text-gray-500 hover:bg-white'}`}>
                {valor} mm
              </button>
            ))}
          </div>
        </div>
        <div className="border border-dashed border-gray-300 bg-gray-50 p-3">
          <div className="bg-white p-3">
            <svg ref={previewRef} className="w-full h-auto" aria-label={`Código de barras ${codigo}`} />
            <p className="mt-1 text-center font-mono text-sm tracking-wider">{codigo}</p>
          </div>
        </div>
      </div>
    </Dialog>
  )
}
