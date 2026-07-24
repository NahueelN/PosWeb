// Widget Editor — Edit size and config of an existing widget instance.
// Simple: choose from supported sizes + configure params.

import { useState, useMemo } from 'react'
import Dialog from '../components/ui/Dialog'
import Button from '../components/ui/Button'
import type { WidgetDefinition, WidgetVisualizationType, WidgetType } from './types'
import type { LayoutInstance, GridSize } from './grid/types'
import { sameSize } from './grid/types'
import {
  Check,
  DollarSign, Wallet, Target, BarChart3, PieChart, TrendingUp,
  AlertTriangle, ClipboardList, Clock, Receipt, Package,
  Table, List, Gauge,
} from 'lucide-react'

const iconMap: Record<string, React.ElementType> = {
  DollarSign, Wallet, Target, BarChart3, PieChart, TrendingUp,
  AlertTriangle, ClipboardList, Clock, Receipt, Package,
  Table, List, Gauge,
}

function IconByName({ name, size = 16 }: { name: string; size?: number }) {
  const Icon = iconMap[name] ?? Package
  return <Icon size={size} />
}

interface Props {
  open: boolean
  onClose: () => void
  instance: LayoutInstance
  definition: WidgetDefinition | undefined
  widgetType: WidgetType
  onUpdate: (instanceId: string, size: GridSize, config: Record<string, any>) => void
}

export default function WidgetEditor({ open, onClose, instance, definition, widgetType, onUpdate }: Props) {
  const [selectedSize, setSelectedSize] = useState<GridSize>({ w: instance.w, h: instance.h })
  const [config, setConfig] = useState<Record<string, any>>(instance.config)

  const currentViz = useMemo(() => {
    if (!definition) return null
    return definition.compatibleTypes.find((v) => v.type === widgetType) ?? null
  }, [definition, widgetType])

  function handleClose() {
    onClose()
  }

  function handleSave() {
    onUpdate(instance.id, selectedSize, config)
    handleClose()
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title={`Editar: ${definition?.name ?? instance.definitionId}`}
      description="Cambiar tamaño o configuración del widget."
      width="xl"
      footer={
        <div className="flex-1 flex justify-end">
          <Button variant="primary" size="sm" icon={<Check size={13} />} onClick={handleSave}>
            Guardar Cambios
          </Button>
        </div>
      }
    >
      <div className="h-[400px] overflow-y-auto space-y-5">
        {/* Size selector */}
        {definition && definition.supportedSizes.length > 1 && (
          <div>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Tamaño ({definition.supportedSizes.length} opciones)
            </p>
            <div className="grid grid-cols-3 gap-2">
              {definition.supportedSizes.map((size) => {
                const isSelected = sameSize(selectedSize, size)
                return (
                  <button
                    key={`${size.w}x${size.h}`}
                    onClick={() => setSelectedSize(size)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border transition-all ${
                      isSelected
                        ? 'border-indigo-400 bg-indigo-50 ring-1 ring-indigo-200'
                        : 'border-gray-200 hover:border-indigo-200 hover:bg-gray-50'
                    }`}
                  >
                    <div
                      className="grid gap-0.5"
                      style={{
                        gridTemplateColumns: `repeat(${size.w}, 8px)`,
                        gridAutoRows: '8px',
                      }}
                    >
                      {Array.from({ length: size.w * size.h }).map((_, i) => (
                        <div
                          key={i}
                          className={`rounded-sm ${isSelected ? 'bg-indigo-400' : 'bg-gray-300'}`}
                        />
                      ))}
                    </div>
                    <span className={`text-xs font-semibold ${isSelected ? 'text-indigo-700' : 'text-gray-500'}`}>
                      {size.w}×{size.h}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Config params */}
        {currentViz && currentViz.params.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Configuración
            </p>
            <div className="space-y-3">
              {currentViz.params.map((param) => (
                <div key={param.key} className="flex items-center gap-3">
                  <label className="text-xs text-gray-600 w-36 shrink-0">{param.label}</label>
                  {param.type === 'select' && (
                    <select
                      value={config[param.key] ?? param.default ?? ''}
                      onChange={(e) => setConfig({ ...config, [param.key]: e.target.value })}
                      className="flex-1 text-xs border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700"
                    >
                      {param.options?.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  )}
                  {param.type === 'number' && (
                    <input
                      type="number"
                      value={config[param.key] ?? param.default ?? ''}
                      min={param.min}
                      max={param.max}
                      onChange={(e) => setConfig({ ...config, [param.key]: parseInt(e.target.value) || param.default })}
                      className="flex-1 text-xs border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700"
                    />
                  )}
                  {param.type === 'boolean' && (
                    <button
                      onClick={() => setConfig({ ...config, [param.key]: !config[param.key] })}
                      className={`w-10 h-5 rounded-full transition-colors relative ${
                        config[param.key] ? 'bg-indigo-500' : 'bg-gray-200'
                      }`}
                    >
                      <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                        config[param.key] ? 'translate-x-5' : 'translate-x-0.5'
                      }`} />
                    </button>
                  )}
                  {param.type === 'text' && (
                    <input
                      type="text"
                      value={config[param.key] ?? param.default ?? ''}
                      onChange={(e) => setConfig({ ...config, [param.key]: e.target.value })}
                      className="flex-1 text-xs border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {currentViz && currentViz.params.length === 0 && (
          <p className="text-xs text-gray-400 text-center py-8">Este widget no tiene opciones configurables.</p>
        )}
      </div>
    </Dialog>
  )
}
