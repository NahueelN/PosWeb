import { useState } from 'react'
import { CalendarClock, Check } from 'lucide-react'
import Dialog from './ui/Dialog'
import Button from './ui/Button'
import ProductoVencimientosEditor, { ordenarFechasVencimiento } from './shared/ProductoVencimientosEditor'
import { useNotification } from '../context/NotificationContext'
import { api } from '../api/client'
import type { ProductoDto } from '../types'

interface VencimientosProductoModalProps {
  producto: ProductoDto
  onSaved: (producto: ProductoDto) => void
  onClose: () => void
}

export default function VencimientosProductoModal({ producto, onSaved, onClose }: VencimientosProductoModalProps) {
  const { notifyError, notifySuccess } = useNotification()
  const [seguirVencimientos, setSeguirVencimientos] = useState(producto.seguirVencimientos ?? false)
  const [fechas, setFechas] = useState<string[]>(() =>
    ordenarFechasVencimiento((producto.fechasVencimiento ?? []).map(fecha => fecha.slice(0, 10)))
  )
  const [saving, setSaving] = useState(false)
  const fechasValidas = fechas.filter(Boolean)

  async function guardar() {
    if (seguirVencimientos && fechasValidas.length === 0) {
      notifyError('Agregá al menos una fecha de vencimiento')
      return
    }

    setSaving(true)
    try {
      const actualizado = await api.productos.actualizarVencimientos(
        producto.id,
        seguirVencimientos,
        fechasValidas
      )
      notifySuccess('Vencimientos actualizados')
      onSaved(actualizado)
    } catch (error) {
      notifyError(error instanceof Error ? error.message : 'No se pudieron guardar los vencimientos')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog
      open
      onClose={onClose}
      closeOnBackdrop={false}
      title="VENCIMIENTOS"
      icon={CalendarClock}
      highlight={producto.nombre}
      width="md"
      footer={
        <div className="flex items-center justify-end gap-3 w-full">
          <Button variant="secondary" size="md" className="min-w-[128px]" type="button" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" size="md" className="min-w-[128px]" icon={<Check size={18} />} loading={saving} type="button" onClick={() => void guardar()}>
            Guardar
          </Button>
        </div>
      }
    >
      <ProductoVencimientosEditor
        seguirVencimientos={seguirVencimientos}
        onSeguirVencimientosChange={setSeguirVencimientos}
        fechas={fechas}
        onFechasChange={setFechas}
        size="md"
      />
    </Dialog>
  )
}
