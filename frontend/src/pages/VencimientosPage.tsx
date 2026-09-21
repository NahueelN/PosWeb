import { useNavigate } from 'react-router-dom'
import { HelpCircle } from 'lucide-react'
import { useNotification } from '../context/NotificationContext'
import { HELP_KEYS } from '../help/content'
import VencimientosTab from '../components/VencimientosTab'

export default function VencimientosPage() {
  const navigate = useNavigate()
  const { notifyError } = useNotification()

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Vencimientos</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Revisá los productos vencidos o próximos a vencer y configurá el aviso.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate(`/ayuda?key=${HELP_KEYS.vencimientos}`)}
          className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:text-[oklch(0.52_0.255_278)] hover:bg-gray-100 transition-colors"
          aria-label="Ayuda"
          title="Ayuda"
        >
          <HelpCircle size={17} />
        </button>
      </div>

      <VencimientosTab notifyError={notifyError} />
    </div>
  )
}