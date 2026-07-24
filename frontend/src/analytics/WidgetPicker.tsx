// Widget Picker — Add new widgets to the dashboard.
// 2-step flow: pick data source → pick visualization + configure.
// Size comes from the definition's default — user doesn't choose size.

import { useState, useMemo } from 'react'
import Dialog from '../components/ui/Dialog'
import Button from '../components/ui/Button'
import type { WidgetDefinition, WidgetVisualizationType, WidgetType } from './types'
import type { GridSize } from './grid/types'
import {
  ArrowLeft, ArrowRight, Check, Plus,
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

const categoryLabels: Record<string, string> = {
  kpi: 'Resumen del día',
  charts: 'Gráficos',
  rankings: 'Rankings',
  alerts: 'Alertas',
  lists: 'Listas',
}

const categoryOrder = ['kpi', 'charts', 'rankings', 'alerts', 'lists']

interface Props {
  open: boolean
  onClose: () => void
  definitions: WidgetDefinition[]
  onAdd: (definitionId: string, widgetType: WidgetType, size: GridSize, config: Record<string, any>) => void
  existingDefinitionIds: string[]
}

type Step = 'pick-data' | 'configure'

export default function WidgetPicker({ open, onClose, definitions, onAdd, existingDefinitionIds }: Props) {
  const [step, setStep] = useState<Step>('pick-data')
  const [selectedDef, setSelectedDef] = useState<WidgetDefinition | null>(null)
  const [selectedViz, setSelectedViz] = useState<WidgetVisualizationType | null>(null)
  const [config, setConfig] = useState<Record<string, any>>({})

  const grouped = useMemo(() => {
    const map = new Map<string, WidgetDefinition[]>()
    for (const cat of categoryOrder) map.set(cat, [])
    for (const def of definitions) {
      const list = map.get(def.category) ?? []
      list.push(def)
      map.set(def.category, list)
    }
    return map
  }, [definitions])

  function reset() {
    setStep('pick-data')
    setSelectedDef(null)
    setSelectedViz(null)
    setConfig({})
  }

  function handleClose() {
    reset()
    onClose()
  }

  function handlePickDef(def: WidgetDefinition) {
    setSelectedDef(def)
    if (def.compatibleTypes.length === 1) {
      handlePickViz(def.compatibleTypes[0])
    } else {
      setStep('configure')
    }
  }

  function handlePickViz(viz: WidgetVisualizationType) {
    setSelectedViz(viz)
    const initial: Record<string, any> = {}
    for (const param of viz.params) {
      initial[param.key] = param.default ?? ''
    }
    setConfig(initial)
    setStep('configure')
  }

  function handleAdd() {
    if (!selectedDef || !selectedViz) return
    const size = selectedDef.defaultSize ?? selectedDef.supportedSizes?.[0] ?? { w: 3, h: 1 }
    onAdd(selectedDef.id, selectedViz.type as WidgetType, size, config)
    handleClose()
  }

  const stepNum = step === 'pick-data' ? 1 : 2

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title="Agregar Widget"
      description={step === 'pick-data'
        ? 'Elegí qué información querés ver en tu dashboard.'
        : 'Configurá las opciones del widget.'}
      width="xl"
      footer={
        <div className="flex items-center gap-3">
          {step !== 'pick-data' && (
            <Button variant="ghost" size="sm" icon={<ArrowLeft size={13} />} onClick={() => {
              if (step === 'configure') {
                if (selectedDef && selectedDef.compatibleTypes.length === 1) {
                  setStep('pick-data')
                  setSelectedDef(null)
                  setSelectedViz(null)
                } else {
                  setStep('pick-data')
                  setSelectedViz(null)
                }
              }
            }}>
              Atrás
            </Button>
          )}
          <div className="flex-1" />
          {step === 'configure' && (
            <Button variant="primary" size="sm" icon={<Check size={13} />} onClick={handleAdd}>
              Agregar al Dashboard
            </Button>
          )}
        </div>
      }
    >
      {/* Step indicator */}
      <div className="flex items-center gap-1.5 mb-4">
        {[1, 2].map((n) => (
          <div key={n} className="flex items-center gap-1.5">
            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors ${
              n <= stepNum ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-400'
            }`}>
              {n}
            </div>
            {n < 2 && <div className={`w-6 h-0.5 ${n < stepNum ? 'bg-indigo-500' : 'bg-gray-100'}`} />}
          </div>
        ))}
      </div>

      <div className="h-[440px] overflow-y-auto">
        {/* Step 1: Pick data source */}
        {step === 'pick-data' && (
          <div className="space-y-3">
            {categoryOrder.map((cat) => {
              const defs = grouped.get(cat) ?? []
              if (defs.length === 0) return null
              return (
                <div key={cat}>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                    {categoryLabels[cat] ?? cat}
                  </p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {defs.map((def) => {
                      const isUsed = existingDefinitionIds.includes(def.id)
                      return (
                        <button
                          key={def.id}
                          onClick={() => handlePickDef(def)}
                          className={`flex items-center gap-2.5 p-2.5 rounded-lg border text-left transition-all ${
                            isUsed
                              ? 'border-indigo-200 bg-indigo-50/50 hover:bg-indigo-50'
                              : 'border-gray-100 hover:border-indigo-200 hover:bg-indigo-50/30'
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                            isUsed ? 'bg-indigo-100' : 'bg-gray-50'
                          }`}>
                            <IconByName name={def.icon} size={14} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-gray-800 truncate">{def.name}</p>
                            <p className="text-[10px] text-gray-400 truncate">{def.description}</p>
                          </div>
                          {isUsed && (
                            <span className="text-[9px] bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded-full font-medium shrink-0">
                              Activo
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Step 2: Pick visualization + configure */}
        {step === 'configure' && selectedDef && (
          <div className="space-y-5">
            {/* Selected definition info */}
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
              <IconByName name={selectedDef.icon} size={16} />
              <div>
                <p className="text-xs font-semibold text-gray-800">{selectedDef.name}</p>
                <p className="text-[10px] text-gray-400">{selectedDef.description}</p>
              </div>
            </div>

            {/* Visualization selector (if multiple) */}
            {selectedDef.compatibleTypes.length > 1 && !selectedViz && (
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Elegí una visualización
                </p>
                <div className="grid grid-cols-1 gap-2">
                  {selectedDef.compatibleTypes.map((viz) => (
                    <button
                      key={viz.type}
                      onClick={() => handlePickViz(viz)}
                      className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all text-left"
                    >
                      <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                        <IconByName name={viz.icon} size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{viz.label}</p>
                        <p className="text-[10px] text-gray-400">
                          {viz.params.length > 0
                            ? `${viz.params.length} opción${viz.params.length > 1 ? 'es' : ''} configurable${viz.params.length > 1 ? 's' : ''}`
                            : 'Sin opciones adicionales'}
                        </p>
                      </div>
                      <ArrowRight size={14} className="text-gray-300 ml-auto" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Config params */}
            {selectedViz && selectedViz.params.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Configuración
                </p>
                <div className="space-y-3">
                  {selectedViz.params.map((param) => (
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

            {/* No params */}
            {selectedViz && selectedViz.params.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-4">Este widget no tiene opciones configurables.</p>
            )}
          </div>
        )}
      </div>
    </Dialog>
  )
}
