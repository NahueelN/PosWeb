import { X } from 'lucide-react'
import Checkbox from '../ui/Checkbox'

/** Ordena, quita repetidas y deja siempre tres posiciones (vacías al final) */
export function ordenarFechasVencimiento(fechas: string[]) {
  return [...fechas.filter(Boolean)].sort().concat(['', '', '']).slice(0, 3)
}

export type ProductoVencimientosEditorSize = 'sm' | 'md'

export interface ProductoVencimientosEditorProps {
  seguirVencimientos: boolean
  onSeguirVencimientosChange: (seguir: boolean) => void
  fechas: string[]
  onFechasChange: (fechas: string[]) => void
  /** Oculta el check de control (cuando ya se controla desde otro lugar) */
  ocultarCheck?: boolean
  /** Altura de los controles. Default: 'sm' (compacto para formularios densos) */
  size?: ProductoVencimientosEditorSize
}

const sizes = {
  sm: {
    title: 'text-xs',
    hint: 'text-[10px]',
    labelText: 'text-[11px]',
    labelWidth: 'w-20',
    input: 'h-7 rounded-md px-1.5 text-xs',
    remove: 'h-7 w-7 rounded-md',
    icon: 14,
  },
  md: {
    title: 'text-sm',
    hint: 'text-xs',
    labelText: 'text-sm',
    labelWidth: 'w-24',
    input: 'h-9 rounded-lg px-3 text-sm',
    remove: 'h-9 w-9 rounded-lg',
    icon: 16,
  },
}

export default function ProductoVencimientosEditor({
  seguirVencimientos,
  onSeguirVencimientosChange,
  fechas,
  onFechasChange,
  ocultarCheck = false,
  size = 'sm',
}: ProductoVencimientosEditorProps) {
  const s = sizes[size]

  return (
    <div>
      {!ocultarCheck && (
        <Checkbox
          size={size}
          checked={seguirVencimientos}
          onChange={onSeguirVencimientosChange}
          label={<span>Controlar vencimientos<span className={`ml-1.5 font-normal text-gray-400 ${s.hint}`}>— muestra avisos</span></span>}
        />
      )}

      <div className={`mb-2 flex items-center justify-between gap-2 ${ocultarCheck ? '' : 'mt-4'}`}>
        <p className={`font-semibold uppercase tracking-wider text-gray-700 ${s.title}`}>Vencimientos</p>
        <span className={`text-gray-400 ${s.hint}`}>Hasta tres fechas</span>
      </div>
      <div className="space-y-2">
        {[0, 1, 2].map(index => (
          <label key={index} className={`flex items-center gap-2 font-medium text-gray-600 ${s.labelText}`}>
            <span className={`shrink-0 ${s.labelWidth}`}>Fecha {index + 1}</span>
            <input
              type="date"
              value={fechas[index] ?? ''}
              onChange={event =>
                onFechasChange(ordenarFechasVencimiento(
                  [0, 1, 2].map(currentIndex => currentIndex === index ? event.target.value : fechas[currentIndex] ?? '')
                ))
              }
              disabled={!seguirVencimientos}
              className={`min-w-0 flex-1 border border-gray-300 outline-none transition-all duration-150 focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-ring)] disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400 ${s.input}`}
            />
            <button
              type="button"
              onClick={() => onFechasChange(ordenarFechasVencimiento(fechas.filter((_, currentIndex) => currentIndex !== index)))}
              disabled={!seguirVencimientos || !fechas[index]}
              aria-label={`Eliminar fecha ${index + 1}`}
              className={`flex shrink-0 items-center justify-center text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-30 ${s.remove}`}
            >
              <X size={s.icon} />
            </button>
          </label>
        ))}
      </div>
    </div>
  )
}
