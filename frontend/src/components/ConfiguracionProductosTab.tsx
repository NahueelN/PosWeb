import { useState } from 'react'
import CategoriasTab from './CategoriasTab'
import UnidadesMedidaTab from './UnidadesMedidaTab'
import MargenesTab from './MargenesTab'
import StockTab from './StockTab'
import { Folder, Ruler, Percent, Package, Settings } from 'lucide-react'

type Section = 'categorias' | 'unidades' | 'margenes' | 'stock'

const sections: { id: Section; icon: typeof Folder; label: string }[] = [
  { id: 'categorias', icon: Folder, label: 'Categorías' },
  { id: 'unidades', icon: Ruler, label: 'Unidades' },
  { id: 'margenes', icon: Percent, label: 'Márgenes' },
  { id: 'stock', icon: Package, label: 'Stock' },
]

export default function ConfiguracionProductosTab({ notifyError }: { notifyError: (msg: string) => void }) {
  const [section, setSection] = useState<Section>('categorias')

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
        {section === 'margenes' && <MargenesTab notifyError={notifyError} />}
        {section === 'stock' && <StockTab notifyError={notifyError} />}
      </div>
    </div>
  )
}
