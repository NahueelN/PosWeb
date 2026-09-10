import { useState, useRef, useEffect, type ChangeEvent } from 'react'
import { api } from '../api/client'
import type { ProductoImportResponseDto, ProductoImportFilaDto } from '../types'
import Dialog from './ui/Dialog'
import Button from './ui/Button'
import { useNotification } from '../context/NotificationContext'
import { Upload, FileSpreadsheet, CheckCircle2, AlertTriangle, X, RotateCw } from 'lucide-react'

interface Props {
  open: boolean
  sucursalId?: number
  onClose: () => void
  onImported: () => void
}

interface EditableFila {
  fila: number
  motivo: string
  codigoBarras: string
  descripcion: string
  marca: string
  rubro: string
  precio: string
  costo: string
  stock: string
  seguirStock: boolean
}

const inputClass =
  'w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none bg-white'
const labelClass = 'block text-[10px] font-medium text-gray-500 uppercase tracking-wide mb-0.5'

function toEditable(e: { fila: number; motivo: string; datos?: ProductoImportFilaDto | null }): EditableFila {
  const d: ProductoImportFilaDto = e.datos ?? { codigoBarras: '', descripcion: '' }
  return {
    fila: e.fila,
    motivo: e.motivo,
    codigoBarras: d.codigoBarras ?? '',
    descripcion: d.descripcion ?? '',
    marca: d.marca ?? '',
    rubro: d.rubro ?? '',
    precio: d.precio != null ? String(d.precio) : '',
    costo: d.costo != null ? String(d.costo) : '',
    stock: d.stock != null ? String(d.stock) : '',
    seguirStock: d.seguirStock ?? true,
  }
}

function toFilaDto(e: EditableFila): ProductoImportFilaDto {
  return {
    codigoBarras: e.codigoBarras.trim(),
    descripcion: e.descripcion.trim(),
    marca: e.marca.trim() || null,
    rubro: e.rubro.trim() || null,
    precio: e.precio.trim() ? parseFloat(e.precio) : null,
    costo: e.costo.trim() ? parseFloat(e.costo) : null,
    stock: e.stock.trim() ? parseFloat(e.stock) : null,
    seguirStock: e.seguirStock,
  }
}

const MOTIVOS_DUPLICADOS = ['Código de barras ya existente', 'Código de barras duplicado en el archivo']
const esDuplicado = (motivo: string) => MOTIVOS_DUPLICADOS.includes(motivo)

export default function ImportarProductosModal({ open, sucursalId, onClose, onImported }: Props) {
  const [loading, setLoading] = useState(false)
  const [reimportLoading, setReimportLoading] = useState(false)
  const [resultado, setResultado] = useState<ProductoImportResponseDto | null>(null)
  const [creadosAcumulados, setCreadosAcumulados] = useState(0)
  const [editable, setEditable] = useState<EditableFila[]>([])
  const [duplicadosOcultos, setDuplicadosOcultos] = useState(0)
  const [nombreArchivo, setNombreArchivo] = useState('')
  const [importarSinCodigo, setImportarSinCodigo] = useState(true)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const { notifyError, notifySuccess } = useNotification()

  useEffect(() => {
    if (open) {
      setResultado(null)
      setCreadosAcumulados(0)
      setEditable([])
      setDuplicadosOcultos(0)
      setNombreArchivo('')
      setLoading(false)
      setReimportLoading(false)
    }
  }, [open])

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    const nombre = file.name.toLowerCase()
    if (!nombre.endsWith('.xls') && !nombre.endsWith('.xlsx')) {
      notifyError('El archivo debe ser .xls o .xlsx')
      return
    }

    setNombreArchivo(file.name)
    setLoading(true)
    setResultado(null)
    setEditable([])
    setCreadosAcumulados(0)
    try {
      const res = await api.productos.importar(file, sucursalId, importarSinCodigo)
      setResultado(res)
      setCreadosAcumulados(res.creados)
      const editables = res.errores.filter(e => !esDuplicado(e.motivo)).map(toEditable)
      setEditable(editables)
      setDuplicadosOcultos(res.errores.length - editables.length)
      if (res.creados > 0) {
        notifySuccess(`${res.creados} producto${res.creados !== 1 ? 's' : ''} importado${res.creados !== 1 ? 's' : ''}`)
        onImported()
      } else {
        notifyError('No se importaron productos. Revisá el detalle de filas salteadas.')
      }
    } catch (err: any) {
      notifyError(err?.message || 'Error al importar el archivo')
    } finally {
      setLoading(false)
    }
  }

  function updateField(index: number, field: keyof EditableFila, value: string) {
    setEditable(prev => prev.map((e, i) => (i === index ? { ...e, [field]: value } : e)))
  }

  function toggleSeguirStock(index: number) {
    setEditable(prev => prev.map((e, i) => (i === index ? { ...e, seguirStock: !e.seguirStock } : e)))
  }

  function descartarFila(index: number) {
    setEditable(prev => prev.filter((_, i) => i !== index))
  }

  async function handleReimport() {
    if (editable.length === 0) return
    setReimportLoading(true)
    try {
      const filas = editable.map(toFilaDto)
      const res = await api.productos.importarFilas(filas, sucursalId, importarSinCodigo)
      const nuevosCreados = creadosAcumulados + res.creados
      setResultado(res)
      setCreadosAcumulados(nuevosCreados)
      const editables = res.errores.filter(e => !esDuplicado(e.motivo)).map(toEditable)
      setEditable(editables)
      setDuplicadosOcultos(res.errores.length - editables.length)
      if (res.errores.length === 0) {
        notifySuccess('Todos los productos corregidos fueron importados.')
        onImported()
      } else if (res.creados > 0) {
        notifySuccess(`${res.creados} producto${res.creados !== 1 ? 's' : ''} corregido${res.creados !== 1 ? 's' : ''} e importado${res.creados !== 1 ? 's' : ''}`)
        onImported()
      } else {
        notifyError('No se importaron productos. Revisá las filas salteadas.')
      }
    } catch (err: any) {
      notifyError(err?.message || 'Error al importar las filas corregidas')
    } finally {
      setReimportLoading(false)
    }
  }

  const showEditable = editable.length > 0
  const dialogWidth = showEditable ? 'xl' : 'lg'

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Importar productos"
      description="Seleccioná un Excel (.xls/.xlsx) con el formato de articulos.xls. Se crean solo productos nuevos; los duplicados se saltean."
      width={dialogWidth}
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose} disabled={loading || reimportLoading}>
            Cancelar
          </Button>
          {showEditable && (
            <Button
              variant="confirm"
              size="sm"
              icon={<RotateCw size={14} />}
              loading={reimportLoading}
              onClick={handleReimport}
            >
              Importar corregidos
            </Button>
          )}
          <Button
            variant="primary"
            size="sm"
            icon={<Upload size={14} />}
            loading={loading}
            onClick={() => inputRef.current?.click()}
          >
            Seleccionar archivo
          </Button>
        </>
      }
    >
      <input
        ref={inputRef}
        type="file"
        accept=".xls,.xlsx"
        className="hidden"
        onChange={handleFileChange}
      />

      {loading ? (
        <div className="py-6 flex flex-col items-center gap-3">
          <FileSpreadsheet size={28} className="text-indigo-600 animate-pulse" />
          <p className="text-sm text-gray-600">
            Importando <span className="font-medium">{nombreArchivo}</span>…
          </p>
          <p className="text-xs text-gray-400">Esto puede tardar unos segundos.</p>
        </div>
      ) : reimportLoading ? (
        <div className="py-6 flex flex-col items-center gap-3">
          <RotateCw size={28} className="text-indigo-600 animate-spin" />
          <p className="text-sm text-gray-600">Importando filas corregidas…</p>
        </div>
      ) : resultado ? (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-gray-900">{resultado.total}</p>
              <p className="text-[11px] text-gray-500 mt-0.5">Total</p>
            </div>
            <div className="bg-emerald-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-emerald-700">{creadosAcumulados}</p>
              <p className="text-[11px] text-emerald-600 mt-0.5">Creados</p>
            </div>
            <div className="bg-amber-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-amber-700">{resultado.saltados}</p>
              <p className="text-[11px] text-amber-600 mt-0.5">Salteados</p>
            </div>
          </div>

          {duplicadosOcultos > 0 && (
            <p className="text-xs text-gray-400">
              {duplicadosOcultos} producto{duplicadosOcultos !== 1 ? 's' : ''} ya existían y se omitieron.
            </p>
          )}

          {showEditable ? (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <AlertTriangle size={14} className="text-amber-500" />
                <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                  Filas salteadas ({editable.length}
                  {editable.length >= 200 ? ', mostrando las primeras 200' : ''})
                </h4>
              </div>
              <div className="max-h-[55vh] overflow-y-auto space-y-2">
                {editable.map((e, i) => (
                  <div key={i} className="border border-gray-200 rounded-xl p-3 space-y-2 relative">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono text-[11px] text-gray-400 shrink-0">Fila {e.fila}</span>
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
                          <AlertTriangle size={10} />
                          {e.motivo}
                        </span>
                      </div>
                      <button
                        type="button"
                        title="Descartar fila"
                        onClick={() => descartarFila(i)}
                        className="text-gray-300 hover:text-red-500 transition-colors shrink-0"
                      >
                        <X size={14} />
                      </button>
                    </div>
                    <div className="flex items-end gap-2 flex-wrap">
                      <div className="min-w-[150px] flex-1">
                        <label className={labelClass} htmlFor={`cb-${i}`}>Código de barras</label>
                        <input
                          id={`cb-${i}`}
                          className={inputClass}
                          value={e.codigoBarras}
                          onChange={ev => updateField(i, 'codigoBarras', ev.target.value)}
                        />
                      </div>
                      <div className="min-w-[180px] flex-[2]">
                        <label className={labelClass} htmlFor={`de-${i}`}>Descripción</label>
                        <input
                          id={`de-${i}`}
                          className={inputClass}
                          value={e.descripcion}
                          onChange={ev => updateField(i, 'descripcion', ev.target.value)}
                        />
                      </div>
                      <div className="min-w-[110px] flex-1">
                        <label className={labelClass} htmlFor={`ma-${i}`}>Marca</label>
                        <input
                          id={`ma-${i}`}
                          className={inputClass}
                          value={e.marca}
                          onChange={ev => updateField(i, 'marca', ev.target.value)}
                        />
                      </div>
                      <div className="w-[90px]">
                        <label className={labelClass} htmlFor={`pr-${i}`}>Precio</label>
                        <input
                          id={`pr-${i}`}
                          className={inputClass}
                          inputMode="decimal"
                          value={e.precio}
                          onChange={ev => updateField(i, 'precio', ev.target.value)}
                        />
                      </div>
                      <div className="w-[90px]">
                        <label className={labelClass} htmlFor={`co-${i}`}>Costo</label>
                        <input
                          id={`co-${i}`}
                          className={inputClass}
                          inputMode="decimal"
                          value={e.costo}
                          onChange={ev => updateField(i, 'costo', ev.target.value)}
                        />
                      </div>
                      <div className="w-[90px]">
                        <label className={labelClass} htmlFor={`st-${i}`}>Stock</label>
                        <input
                          id={`st-${i}`}
                          className={inputClass}
                          inputMode="decimal"
                          value={e.stock}
                          onChange={ev => updateField(i, 'stock', ev.target.value)}
                        />
                      </div>
                      <label className="flex items-center gap-1.5 h-8 px-2.5 border border-gray-200 rounded-lg cursor-pointer select-none whitespace-nowrap">
                        <input
                          type="checkbox"
                          className="accent-indigo-600"
                          checked={e.seguirStock}
                          onChange={() => toggleSeguirStock(i)}
                        />
                        <span className="text-[11px] font-medium text-gray-700">Controlar stock</span>
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : duplicadosOcultos > 0 ? (
            <div className="flex items-center gap-2 text-gray-500 text-sm">
              <CheckCircle2 size={16} />
              <span>Los productos restantes ya existían y se omitieron.</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-emerald-700 text-sm">
              <CheckCircle2 size={16} />
              <span>No quedan filas salteadas. Todos los productos fueron importados.</span>
            </div>
          )}
        </div>
      ) : (
        <div className="py-6 text-center">
          <FileSpreadsheet size={28} className="mx-auto text-gray-300 mb-2" />
          <p className="text-sm text-gray-500">Elegí el archivo Excel para comenzar.</p>
          <label className="mt-4 inline-flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none">
            <input
              type="checkbox"
              className="accent-indigo-600"
              checked={importarSinCodigo}
              onChange={(e) => setImportarSinCodigo(e.target.checked)}
            />
            <span>Si el código tiene letras, importar sin código (con código interno)</span>
          </label>
        </div>
      )}
    </Dialog>
  )
}
