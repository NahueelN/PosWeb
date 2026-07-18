import { useState, useMemo } from 'react'
import Dialog from '../components/ui/Dialog'
import Button from '../components/ui/Button'
import type { WidgetDefinition, WidgetVisualizationType, WidgetType, WidgetInstance } from './types'
import {
  ArrowLeft, ArrowRight, Check, Plus,
  DollarSign, Wallet, Target, BarChart3, PieChart, TrendingUp,
  AlertTriangle, ClipboardList, Clock, Receipt, Package,
  Table, List, Gauge, X,
} from 'lucide-react'

// ── Icon resolver ────────────────────────────────────────────────

const iconMap: Record<string, React.ElementType> = {
  DollarSign, Wallet, Target, BarChart3, PieChart, TrendingUp,
  AlertTriangle, ClipboardList, Clock, Receipt, Package,
  Table, List, Gauge,
}

function IconByName({ name, size = 16 }: { name: string; size?: number }) {
  const Icon = iconMap[name] ?? Package
  return <Icon size={size} />
}

// ── Category labels ──────────────────────────────────────────────

const categoryLabels: Record<string, string> = {
  kpi: 'Resumen del día',
  charts: 'Gráficos',
  rankings: 'Rankings',
  alerts: 'Alertas',
  lists: 'Listas',
}

const categoryOrder = ['kpi', 'charts', 'rankings', 'alerts', 'lists']

// ── Props ────────────────────────────────────────────────────────

interface Props {
  open: boolean
  onClose: () => void
  definitions: WidgetDefinition[]
  onAdd: (definitionId: string, widgetType: WidgetType, config: Record<string, any>, title?: string) => void
  existingInstanceIds: string[]
}

// ── Step enum ────────────────────────────────────────────────────

type Step = 'pick-data' | 'pick-viz' | 'configure' | 'confirm'

// ── Component ────────────────────────────────────────────────────

export default function WidgetPicker({ open, onClose, definitions, onAdd, existingInstanceIds }: Props) {
  const [step, setStep] = useState<Step>('pick-data')
  const [selectedDef, setSelectedDef] = useState<WidgetDefinition | null>(null)
  const [selectedViz, setSelectedViz] = useState<WidgetVisualizationType | null>(null)
  const [config, setConfig] = useState<Record<string, any>>({})
  const [customTitle, setCustomTitle] = useState('')

  // Group definitions by category
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
    setCustomTitle('')
  }

  function handleClose() {
    reset()
    onClose()
  }

  function handlePickDef(def: WidgetDefinition) {
    setSelectedDef(def)
    setCustomTitle(def.name)

    // If only one compatible type, skip to configure
    if (def.compatibleTypes.length === 1) {
      handlePickViz(def.compatibleTypes[0])
    } else {
      setStep('pick-viz')
    }
  }

  function handlePickViz(viz: WidgetVisualizationType) {
    setSelectedViz(viz)
    // Initialize config with defaults
    const initial: Record<string, any> = {}
    for (const param of viz.params) {
      initial[param.key] = param.default ?? ''
    }
    setConfig(initial)
    setStep('configure')
  }

  function handleAdd() {
    if (!selectedDef || !selectedViz) return
    onAdd(selectedDef.id, selectedViz.type as WidgetType, config, customTitle || undefined)
    handleClose()
  }

  // ── Render steps ──

  const stepNum = step === 'pick-data' ? 1 : step === 'pick-viz' ? 2 : step === 'configure' ? 3 : 4

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title="Agregar Widget"
      description={step === 'pick-data'
        ? 'Elegí qué información querés ver en tu dashboard.'
        : step === 'pick-viz'
        ? `¿Cómo querés visualizar "${selectedDef?.name}"?`
        : step === 'configure'
        ? 'Ajustá la configuración a tu gusto.'
        : 'Revisá y guardá.'}
      width="xl"
      footer={
        <div className="flex items-center gap-3">
          {step !== 'pick-data' && (
            <Button variant="ghost" size="sm" icon={<ArrowLeft size={13} />} onClick={() => {
              if (step === 'pick-viz') { setStep('pick-data'); setSelectedDef(null) }
              else if (step === 'configure') { setStep('pick-viz'); setSelectedViz(null) }
              else if (step === 'confirm') { setStep('configure') }
            }}>
              Atrás
            </Button>
          )}
          <div className="flex-1" />
          {step === 'configure' && (
            <Button variant="primary" size="sm" icon={<ArrowRight size={13} />} onClick={() => setStep('confirm')}>
              Siguiente
            </Button>
          )}
          {step === 'confirm' && (
            <Button variant="primary" size="sm" icon={<Check size={13} />} onClick={handleAdd}>
              Agregar al Dashboard
            </Button>
          )}
        </div>
      }
    >
      {/* Step indicator */}
      <div className="flex items-center gap-1.5 mb-4">
        {[1, 2, 3, 4].map((n) => (
          <div key={n} className="flex items-center gap-1.5">
            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors ${
              n <= stepNum ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-400'
            }`}>
              {n}
            </div>
            {n < 4 && <div className={`w-6 h-0.5 ${n < stepNum ? 'bg-indigo-500' : 'bg-gray-100'}`} />}
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
                      const isUsed = existingInstanceIds.some((id) => id.startsWith(def.id))
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

        {/* Step 2: Pick visualization */}
        {step === 'pick-viz' && selectedDef && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg mb-3">
              <IconByName name={selectedDef.icon} size={16} />
              <div>
                <p className="text-xs font-semibold text-gray-800">{selectedDef.name}</p>
                <p className="text-[10px] text-gray-400">{selectedDef.description}</p>
              </div>
            </div>
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

        {/* Step 3: Configure */}
        {step === 'configure' && selectedViz && (
          <div className="space-y-4">
            {/* Title */}
            <div>
              <label className="text-[11px] font-semibold text-gray-500 mb-1 block">Título del widget</label>
              <input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
                placeholder={selectedDef?.name}
              />
            </div>

            {/* Config params */}
            {selectedViz.params.length > 0 && (
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
          </div>
        )}

        {/* Step 4: Confirm */}
        {step === 'confirm' && selectedDef && selectedViz && (
          <div className="space-y-4">
            <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shadow-sm">
                  <IconByName name={selectedViz.icon} size={18} />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-800">{customTitle || selectedDef.name}</p>
                  <p className="text-[10px] text-indigo-600 font-medium">{selectedViz.label}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div className="bg-white rounded-lg p-2">
                  <span className="text-gray-400">Fuente de datos</span>
                  <p className="font-semibold text-gray-700">{selectedDef.name}</p>
                </div>
                <div className="bg-white rounded-lg p-2">
                  <span className="text-gray-400">Visualización</span>
                  <p className="font-semibold text-gray-700">{selectedViz.label}</p>
                </div>
              </div>
            </div>

            {/* Config summary */}
            {Object.keys(config).length > 0 && (
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Configuración</p>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(config).map(([key, val]) => {
                    const param = selectedViz.params.find((p) => p.key === key)
                    if (!param || val === param.default) return null
                    const display = param.type === 'boolean'
                      ? (val ? 'Sí' : 'No')
                      : param.options?.find((o) => o.value === String(val))?.label ?? String(val)
                    return (
                      <span key={key} className="text-[10px] bg-white border border-gray-100 rounded-full px-2 py-0.5 text-gray-600">
                        {param.label}: {display}
                      </span>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Dialog>
  )
}
