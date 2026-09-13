import { useEffect, useState } from 'react'
import CategoriasTab from './CategoriasTab'
import UnidadesMedidaTab from './UnidadesMedidaTab'
import StockTab from './StockTab'
import VencimientosTab from './VencimientosTab'
import { Folder, Ruler, Package, Settings, CalendarClock } from 'lucide-react'

export type ProductConfigSection = 'categorias' | 'unidades' | 'stock' | 'vencimientos'

const sections: { id: ProductConfigSection; icon: typeof Folder; label: string }[] = [
  { id: 'categorias', icon: Folder, label: 'Categorías' },
  { id: 'unidades', icon: Ruler, label: 'Unidades' },
  { id: 'stock', icon: Package, label: 'Stock' },
  { id: 'vencimientos', icon: CalendarClock, label: 'Vencimientos' },
]

export default function ConfiguracionProductosTab({ notifyError, initialSection }: { notifyError: (msg: string) => void; initialSection?: ProductConfigSection }) {
  const [section, setSection] = useState<ProductConfigSection>(initialSection ?? 'categorias')

  useEffect(() => {
    if (initialSection) setSection(initialSection)
  }, [initialSection])

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 text-indigo-600 shrink-0"><Settings size={22} /></span>
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-gray-900">Configuración de Productos</h2>
          <p className="text-sm text-gray-500 mt-0.5">Administrá la configuración del catálogo.</p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
        {sections.map(s => {
          const Icon = s.icon
          const active = section === s.id
          return (
            <button
              key={s.id}
              onClick={() => setSection(s.id)}
              className={[
                'inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-xl transition-all duration-150',
                active
                  ? 'bg-indigo-100 text-indigo-700 shadow-sm'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700',
              ].join(' ')}
            >
              <Icon size={16} />
              {s.label}
            </button>
          )
        })}
      </div>

      <div className="transition-all duration-200">
        {section === 'categorias' && <CategoriasTab notifyError={notifyError} />}
        {section === 'unidades' && <UnidadesMedidaTab notifyError={notifyError} />}
        {section === 'stock' && <StockTab notifyError={notifyError} />}
        {section === 'vencimientos' && <VencimientosTab notifyError={notifyError} />}
      </div>
    </div>
  )
}
