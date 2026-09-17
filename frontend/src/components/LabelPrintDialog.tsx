import { useEffect, useRef, useState } from 'react'
import { Printer } from 'lucide-react'
import Dialog from './ui/Dialog'
import Button from './ui/Button'
import { renderBarcode } from '../lib/barcode'
import { api } from '../api/client'
import { useNotification } from '../context/NotificationContext'

interface LabelPrintDialogProps {
  /** Nombre a imprimir en la etiqueta */
  nombre: string
  /** Precio a imprimir */
  precio: number
  /** Código de barras (EAN). Opcional */
  codigoBarra?: string
  /** Código interno. Opcional */
  codigoInterno?: string
  onClose: () => void
}

export default function LabelPrintDialog({
  nombre,
  precio,
  codigoBarra = '',
  codigoInterno = '',
  onClose,
}: LabelPrintDialogProps) {
  const { notifyError } = useNotification()
  const [cantidad, setCantidad] = useState('1')
  const [ancho, setAncho] = useState<58 | 80>(80)
  const [incluirCodigo, setIncluirCodigo] = useState(false)
  const [tipoCodigo, setTipoCodigo] = useState<'ean' | 'interno'>(codigoBarra.trim() ? 'ean' : 'interno')
  const codigoRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    let mounted = true
    api.preferencias.obtener().then(res => {
      if (!mounted) return
      const etiqueta = res.preferencias?.etiquetaProducto
      if (!etiqueta) return
      if (etiqueta.ancho === '58' || etiqueta.ancho === '80') setAncho(Number(etiqueta.ancho) as 58 | 80)
      if (etiqueta.incluirCodigo === 'true' || etiqueta.incluirCodigo === 'false') setIncluirCodigo(etiqueta.incluirCodigo === 'true')
      if (etiqueta.tipoCodigo === 'ean' || etiqueta.tipoCodigo === 'interno') setTipoCodigo(etiqueta.tipoCodigo)
    }).catch(() => {})
    return () => { mounted = false }
  }, [])

  const hayEan = !!codigoBarra.trim()
  const hayInterno = !!codigoInterno.trim()
  const tipoEfectivo: 'ean' | 'interno' = tipoCodigo === 'ean' && !hayEan ? 'interno' : tipoCodigo === 'interno' && !hayInterno ? 'ean' : tipoCodigo
  const codigoParaEtiqueta = tipoEfectivo === 'ean' ? codigoBarra.trim() : codigoInterno.trim()
  // Si solo hay un tipo de código disponible, el selector queda bloqueado
  const bloqueoSinAlternativa = !hayEan || !hayInterno

  useEffect(() => {
    if (!incluirCodigo || !codigoParaEtiqueta || !codigoRef.current) return
    renderBarcode(codigoRef.current, codigoParaEtiqueta, ancho, ancho === 80 ? 45 : 36)
  }, [incluirCodigo, codigoParaEtiqueta, ancho])

  function persistir(nuevoAncho: 58 | 80, incluir: boolean, tipo: 'ean' | 'interno') {
    setAncho(nuevoAncho)
    setIncluirCodigo(incluir)
    setTipoCodigo(tipo)
    api.preferencias.guardar({ etiquetaProducto: { ancho: String(nuevoAncho), incluirCodigo: String(incluir), tipoCodigo: tipo } }).catch(() => {})
  }

  async function imprimir() {
    const cantidadNumero = Math.floor(Number(cantidad))
    const codigo = codigoBarra.trim() || codigoInterno.trim()
    if (!Number.isFinite(cantidadNumero) || cantidadNumero < 1) {
      notifyError('Ingresá una cantidad de etiquetas válida')
      return
    }
    if (!codigo || !nombre.trim() || !Number.isFinite(precio) || precio <= 0) {
      notifyError('Se necesita nombre, precio y código para imprimir una etiqueta')
      return
    }

    const codigoDeBarras = incluirCodigo ? codigoParaEtiqueta : ''
    const barcodeSvg = codigoDeBarras
      ? (() => {
          const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
          renderBarcode(svg, codigoDeBarras, ancho, ancho === 80 ? 45 : 36)
          return svg.outerHTML
        })()
      : null
    const etiqueta = {
      nombre: nombre.trim(),
      precio,
      codigo,
      cantidad: cantidadNumero,
      barcodeSvg,
      codigoDeBarras,
      ancho,
      altoMinimo: barcodeSvg ? (ancho === 80 ? 42 : 34) : (ancho === 80 ? 35 : 30),
    }
    onClose()

    if ('__TAURI_INTERNALS__' in window) {
      const printWindowLabel = `label-print-${Date.now()}`
      localStorage.setItem('posweb-label-print', JSON.stringify(etiqueta))
      const { WebviewWindow } = await import('@tauri-apps/api/webviewWindow')
      new WebviewWindow(printWindowLabel, {
        url: `label-print.html?print=${Date.now()}`,
        title: 'Imprimir etiquetas',
        width: 1200,
        height: 700,
        resizable: false,
        center: true,
        decorations: false,
      })
      return
    }

    const escapeHtml = (value: string) => value.replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char]!)
    const etiquetaHtml = Array.from({ length: cantidadNumero }, () => `
      <article class="label">
        <div class="name">${escapeHtml(etiqueta.nombre)}</div>
        <div class="price">$${etiqueta.precio.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        ${etiqueta.barcodeSvg ? `<div class="barcode">${etiqueta.barcodeSvg}</div><div class="code">${escapeHtml(etiqueta.codigoDeBarras)}</div>` : ''}
      </article>`).join('')
    const printWindow = window.open('', 'posweb-label', 'width=420,height=340')
    if (!printWindow) {
      notifyError('No se pudo abrir la ventana de impresión')
      return
    }
    printWindow.document.write(`<!doctype html><html><head><title>Imprimir etiquetas</title><style>
      @page { size: ${etiqueta.ancho}mm auto; margin: 0; }
      html, body { margin: 0; padding: 0; width: ${etiqueta.ancho}mm; font-family: Arial, sans-serif; color: #000; }
      .label { box-sizing: border-box; width: ${etiqueta.ancho}mm; min-height: ${etiqueta.altoMinimo}mm; padding: 3mm; border: .2mm solid #000; display: flex; flex-direction: column; justify-content: space-between; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .name { font-size: ${etiqueta.ancho === 80 ? 16 : 14}px; font-weight: 700; text-align: center; text-transform: uppercase; line-height: 1.1; }
      .price { font-size: ${etiqueta.ancho === 80 ? 48 : 36}px; font-weight: 900; text-align: center; line-height: 1; white-space: nowrap; }
      .code { font-size: ${etiqueta.ancho === 80 ? 14 : 12}px; letter-spacing: 1px; }
      .barcode svg { display: block; width: 100%; height: auto; }
    </style></head><body>${etiquetaHtml}<script>window.onload = () => { window.focus(); window.print(); }; window.onafterprint = () => window.close();</script></body></html>`)
    printWindow.document.close()
  }

  return (
    <Dialog
      open
      onClose={onClose}
      title="Imprimir etiquetas"
      highlight={nombre}
      description={`Formato térmico de ${ancho} mm.`}
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
              <button
                key={valor}
                type="button"
                onClick={() => persistir(valor as 58 | 80, incluirCodigo, tipoCodigo)}
                className={`flex-1 rounded-md px-3 py-1.5 text-sm font-semibold transition-colors ${ancho === valor ? 'bg-[var(--color-primary)] text-white shadow-sm' : 'text-gray-500 hover:bg-white'}`}
              >
                {valor} mm
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <input type="checkbox" checked={incluirCodigo} onChange={e => persistir(ancho, e.target.checked, tipoCodigo)}
              disabled={!codigoBarra.trim() && !codigoInterno.trim()}
              className="h-4 w-4 rounded border-gray-300 text-[var(--color-primary)] focus:ring-[var(--color-primary-ring)]" />
            Incluir código
          </label>
          <select value={tipoEfectivo} onChange={e => persistir(ancho, incluirCodigo, e.target.value as 'ean' | 'interno')}
            disabled={!incluirCodigo || bloqueoSinAlternativa}
            className="h-8 flex-1 rounded-lg border border-gray-300 bg-white px-2 text-xs font-medium disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400">
            <option value="ean" disabled={!hayEan}>EAN / código de barras</option>
            <option value="interno" disabled={!hayInterno}>Código interno</option>
          </select>
        </div>
        <div className={`mx-auto border border-dashed border-gray-300 bg-gray-50 p-3 ${ancho === 80 ? 'w-[360px]' : 'w-[290px]'}`}>
          <div className="border border-black bg-white px-3 py-2.5 text-black">
            <p className={`text-center font-bold uppercase leading-tight line-clamp-2 ${ancho === 80 ? 'text-base' : 'text-sm'}`}>{nombre || 'Sin nombre'}</p>
            <p className={`my-2 text-center font-black leading-none whitespace-nowrap ${ancho === 80 ? 'text-5xl' : 'text-4xl'}`}>${Number(precio || 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            {incluirCodigo && codigoParaEtiqueta && (
              <>
                <svg ref={codigoRef} className="mt-2 w-full h-auto" aria-label={`Código de barras ${codigoParaEtiqueta}`} />
                <p className={`mt-1 text-center font-mono tracking-wider ${ancho === 80 ? 'text-sm' : 'text-xs'}`}>{codigoParaEtiqueta}</p>
              </>
            )}
          </div>
        </div>
      </div>
    </Dialog>
  )
}
