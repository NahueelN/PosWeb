import { MapPin, ChevronRight } from 'lucide-react'
import type { SucursalDto } from '../../types'

interface SucursalSelectorProps {
  sucursales: SucursalDto[]
  onSelect: (s: SucursalDto) => void
}

export default function SucursalSelector({ sucursales, onSelect }: SucursalSelectorProps) {
  return (
    <div className="max-w-md mx-auto mt-8 px-4">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sm:p-8 text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center mx-auto">
          <MapPin size={32} strokeWidth={1.5} className="text-indigo-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Seleccioná tu sucursal</h2>
          <p className="text-sm text-gray-500 mt-1">Esta elección queda guardada para las próximas ventas</p>
        </div>
        <div className="space-y-2">
          {sucursales.map((s) => (
            <button key={s.id} onClick={() => onSelect(s)}
              className="w-full text-left px-4 py-3.5 rounded-xl border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all flex items-center justify-between group"
            >
              <div>
                <p className="font-medium text-gray-800">{s.nombre}</p>
                <p className="text-xs text-gray-400">Código: {s.codigo} · #{s.numero}</p>
              </div>
              <ChevronRight size={20} strokeWidth={2} className="text-gray-300 group-hover:text-indigo-500 transition-colors" />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
