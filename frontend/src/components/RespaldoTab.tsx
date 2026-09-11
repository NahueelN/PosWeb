import { useRef, useState, type ChangeEvent } from 'react'
import { Download, RotateCcw, ShieldAlert, Upload } from 'lucide-react'
import { api, clearStoredSession } from '../api/client'
import { useNotification } from '../context/NotificationContext'
import Button from './ui/Button'
import Dialog from './ui/Dialog'

type RespaldoInfo = {
  nombre: string
  documento: string
  direccion: string
  fechaExportacion?: string
}

export default function RespaldoTab() {
  const { notifyError, notifySuccess } = useNotification()
  const fileInput = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [respaldo, setRespaldo] = useState<RespaldoInfo | null>(null)
  const [checking, setChecking] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [restoring, setRestoring] = useState(false)

  async function exportar() {
    setExporting(true)
    try {
      const fileName = crearNombreRespaldo()
      const nativeSave = await guardarConDialogoNativo(fileName)
      if (nativeSave === 'saved') {
        notifySuccess('Respaldo exportado correctamente.')
        return
      }
      if (nativeSave === 'cancelled') return
      const { blob, fileName: responseFileName } = await api.respaldos.exportar()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = responseFileName
      link.click()
      URL.revokeObjectURL(url)
      notifySuccess('Respaldo exportado correctamente.')
    } catch (error) {
      notifyError(error instanceof Error ? error.message : 'No se pudo exportar el respaldo.')
    } finally {
      setExporting(false)
    }
  }

  function seleccionarArchivo(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0] ?? null
    event.target.value = ''
    if (!selected) return
    if (!selected.name.toLowerCase().endsWith('.posweb-backup')) {
      notifyError('Seleccioná un archivo .posweb-backup.')
      return
    }
    setFile(selected)
  }

  async function restaurar() {
    if (!file) return
    setRestoring(true)
    try {
      const result = await api.respaldos.importar(file)
      notifySuccess(`Se restauró el respaldo de ${result.empresaNombre}. PosWeb se reiniciará.`)
      clearStoredSession()
      window.setTimeout(() => { void reiniciarAplicacion() }, 300)
    } catch (error) {
      notifyError(error instanceof Error ? error.message : 'No se pudo restaurar el respaldo.')
      setRestoring(false)
    }
  }

  async function revisarRespaldo() {
    if (!file) return
    setChecking(true)
    try {
      const info = await api.respaldos.validar(file)
      setRespaldo({ ...info, fechaExportacion: obtenerFechaExportacion(file.name) })
      setConfirmOpen(true)
    } catch (error) {
      notifyError(error instanceof Error ? error.message : 'No se pudo validar el respaldo.')
    } finally {
      setChecking(false)
    }
  }

  return (
    <div className="space-y-6">
      <section className="bg-white rounded-xl p-6 shadow-xl space-y-4">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600"><Download size={20} /></div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Exportar respaldo</h2>
            <p className="mt-1 text-sm text-slate-500">Descargá una copia de todos los datos locales de PosWeb.</p>
          </div>
        </div>
        <Button variant="primary" icon={<Download size={15} />} loading={exporting} onClick={() => { void exportar() }}>
          Exportar respaldo
        </Button>
      </section>

      <section className="bg-white rounded-xl p-6 shadow-xl space-y-4">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-red-50 p-2 text-red-600"><RotateCcw size={20} /></div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Importar respaldo</h2>
            <p className="mt-1 text-sm text-slate-500">Reemplaza todos los datos locales por los contenidos en el respaldo.</p>
          </div>
        </div>
        <input ref={fileInput} type="file" accept=".posweb-backup" className="hidden" onChange={seleccionarArchivo} />
        <div className="flex items-center gap-3">
          <Button variant="secondary" icon={<Upload size={15} />} onClick={() => fileInput.current?.click()}>Seleccionar archivo</Button>
          <span className="text-sm text-slate-500 truncate">{file?.name ?? 'No seleccionaste un archivo'}</span>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 flex gap-2">
          <ShieldAlert size={18} className="shrink-0" />
          <span><strong>Atención:</strong> al restaurar se eliminan todos los datos locales actuales. PosWeb cerrará la sesión y tendrás que ingresar con un usuario del respaldo.</span>
        </div>
        <Button variant="destructive" icon={<RotateCcw size={15} />} loading={checking} disabled={!file} onClick={() => { void revisarRespaldo() }}>
          Restaurar y reemplazar datos
        </Button>
      </section>

      <Dialog
        open={confirmOpen}
        onClose={() => !restoring && setConfirmOpen(false)}
        title="Confirmar restauración"
        description="Estos datos reemplazarán por completo los datos locales actuales. Revisalos antes de continuar."
        width="md"
        closeOnBackdrop={!restoring}
        footer={
          <>
            <Button variant="secondary" size="sm" disabled={restoring} onClick={() => setConfirmOpen(false)}>Cancelar</Button>
            <Button variant="destructive" size="sm" loading={restoring} onClick={() => { void restaurar() }}>Restaurar datos</Button>
          </>
        }
      >
        {respaldo && (
          <div className="space-y-3">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Empresa del respaldo</p>
              <p className="mt-1 text-lg font-semibold text-slate-900">{respaldo.nombre}</p>
              <p className="mt-2 text-sm text-slate-600">Documento: {respaldo.documento || 'No informado'}</p>
              <p className="text-sm text-slate-600">Dirección: {respaldo.direccion || 'No informada'}</p>
              {respaldo.fechaExportacion && <p className="text-sm text-slate-600">Exportado: {respaldo.fechaExportacion}</p>}
            </div>
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 flex gap-2">
              <ShieldAlert size={18} className="shrink-0" />
              <span>Esta acción elimina todos los datos locales actuales y cierra la sesión.</span>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  )
}

function crearNombreRespaldo() {
  const date = new Date()
  const pad = (value: number) => String(value).padStart(2, '0')
  return `posweb-${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}.posweb-backup`
}

export function obtenerFechaExportacion(fileName: string): string | undefined {
  const match = /^posweb-(\d{4})(\d{2})(\d{2})-(\d{2})(\d{2})\.posweb-backup$/i.exec(fileName)
  if (!match) return undefined

  const [, year, month, day, hours, minutes] = match
  return `${day}/${month}/${year} ${hours}:${minutes}`
}

async function guardarConDialogoNativo(fileName: string): Promise<'saved' | 'cancelled' | 'unavailable'> {
  if (!('__TAURI__' in window)) return 'unavailable'

  const [{ save }, { downloadDir, join }] = await Promise.all([
    import('@tauri-apps/plugin-dialog'),
    import('@tauri-apps/api/path'),
  ])
  const ruta = await save({
    defaultPath: await join(await downloadDir(), fileName),
    filters: [{ name: 'Respaldo PosWeb', extensions: ['posweb-backup'] }],
  })
  if (!ruta) return 'cancelled'

  await api.respaldos.exportarAArchivo(ruta)
  return 'saved'
}

async function reiniciarAplicacion() {
  try {
    if ('__TAURI__' in window) {
      const { invoke } = await import('@tauri-apps/api/core')
      await invoke('reiniciar_aplicacion')
      return
    }
  } catch {
    // If Tauri cannot relaunch, a browser reload still starts a fresh frontend session.
  }

  window.location.reload()
}
