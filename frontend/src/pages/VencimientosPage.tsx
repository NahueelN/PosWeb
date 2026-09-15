import { useNotification } from '../context/NotificationContext'
import VencimientosTab from '../components/VencimientosTab'

export default function VencimientosPage() {
  const { notifyError } = useNotification()

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Vencimientos</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Revisá los productos vencidos o próximos a vencer y configurá el aviso.
        </p>
      </div>

      <VencimientosTab notifyError={notifyError} />
    </div>
  )
}
