import { useState } from 'react'
import Dialog from '../components/ui/Dialog'
import Button from '../components/ui/Button'
import { widgetRegistry, categoryLabels, categoryOrder, type WidgetRegistration } from './registry'
import { useDashboardConfig } from './useDashboardConfig'
import { RotateCcw, Settings2, ChevronDown, ChevronRight } from 'lucide-react'

// ─── Icon resolver (string → component) ──────────────────────────

import {
  DollarSign, Wallet, Target, BarChart3, Package,
  AlertTriangle, ClipboardList, Clock, Receipt,
} from 'lucide-react'

const iconMap: Record<string, React.ElementType> = {
  DollarSign, Wallet, Target, BarChart3, Package,
  AlertTriangle, ClipboardList, Clock, Receipt,
}

function IconByName({ name, size = 16 }: { name: string; size?: number }) {
  const Icon = iconMap[name] ?? Package
  return <Icon size={size} />
}

// ─── Props ───────────────────────────────────────────────────────

interface Props {
  open: boolean
  onClose: () => void
}

// ─── Component ───────────────────────────────────────────────────

export default function DashboardEditor({ open, onClose }: Props) {
  const { config, toggleWidget, updateWidgetSetting, resetToDefaults } = useDashboardConfig()
  const [expandedCategory, setExpandedCategory] = useState<string | null>('kpi')
  const [configuringWidget, setConfiguringWidget] = useState<string | null>(null)

  const enabledCount = Object.values(config.widgets).filter((w) => w.enabled).length

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Personalizar Dashboard"
      description="Elegí qué información querés mostrar en tu Inicio."
      width="xl"
      footer={
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            icon={<RotateCcw size={13} />}
            onClick={resetToDefaults}
          >
            Restablecer
          </Button>
          <Button variant="primary" size="sm" onClick={onClose}>
            Listo
          </Button>
        </div>
      }
    >
      <div className="flex gap-6 h-[520px] min-w-[1060px]">
        {/* ── Left: Available widgets ── */}
        <div className="flex-1 space-y-1">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Widgets disponibles ({enabledCount} activos)
          </p>

          {categoryOrder.map((cat) => {
            const widgets = widgetRegistry.filter((w) => w.category === cat)
            const isExpanded = expandedCategory === cat

            return (
              <div key={cat} className="border border-gray-100 rounded-lg overflow-hidden">
                <button
                  onClick={() => setExpandedCategory(isExpanded ? null : cat)}
                  className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-gray-50 transition-colors text-left"
                >
                  {isExpanded ? <ChevronDown size={14} className="text-gray-400" /> : <ChevronRight size={14} className="text-gray-400" />}
                  <span className="text-sm font-semibold text-gray-700">{categoryLabels[cat]}</span>
                  <span className="text-[10px] text-gray-400 ml-auto">
                    {widgets.filter((w) => config.widgets[w.id]?.enabled).length}/{widgets.length}
                  </span>
                </button>

                {isExpanded && (
                  <div className="px-3 pb-2 space-y-1">
                    {widgets.map((widget) => (
                      <WidgetRow
                        key={widget.id}
                        widget={widget}
                        enabled={config.widgets[widget.id]?.enabled ?? false}
                        settings={config.widgets[widget.id]?.settings ?? {}}
                        isConfiguring={configuringWidget === widget.id}
                        onToggle={() => toggleWidget(widget.id)}
                        onConfigure={() => setConfiguringWidget(
                          configuringWidget === widget.id ? null : widget.id
                        )}
                        onSettingChange={(key, value) => updateWidgetSetting(widget.id, key, value)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* ── Right: Preview ── */}
        <div className="w-[320px] shrink-0">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Vista previa
          </p>
          <div className="border border-dashed border-gray-200 rounded-xl p-4 space-y-2 min-h-[300px] bg-gray-50/50">
            {enabledCount === 0 ? (
              <div className="flex items-center justify-center h-[280px] text-gray-300 text-sm">
                Sin widgets activos
              </div>
            ) : (
              widgetRegistry
                .filter((w) => config.widgets[w.id]?.enabled)
                .sort((a, b) => (config.widgets[a.id]?.order ?? 0) - (config.widgets[b.id]?.order ?? 0))
                .map((widget) => (
                  <div
                    key={widget.id}
                    className="flex items-center gap-2 bg-white rounded-lg border border-gray-100 px-3 py-2 shadow-sm"
                  >
                    <div className="w-6 h-6 rounded bg-indigo-50 flex items-center justify-center shrink-0">
                      <IconByName name={widget.icon} size={12} />
                    </div>
                    <span className="text-xs font-medium text-gray-700 truncate">{widget.name}</span>
                    <span className="text-[10px] text-gray-300 ml-auto shrink-0">
                      {widget.category === 'kpi' ? 'Resumen' :
                       widget.category === 'charts' ? 'Gráfico' :
                       widget.category === 'rankings' ? 'Ranking' :
                       widget.category === 'alerts' ? 'Alertas' : 'Lista'}
                    </span>
                  </div>
                ))
            )}
          </div>
        </div>
      </div>
    </Dialog>
  )
}

// ─── Widget Row ──────────────────────────────────────────────────

function WidgetRow({
  widget,
  enabled,
  settings,
  isConfiguring,
  onToggle,
  onConfigure,
  onSettingChange,
}: {
  widget: WidgetRegistration
  enabled: boolean
  settings: Record<string, any>
  isConfiguring: boolean
  onToggle: () => void
  onConfigure: () => void
  onSettingChange: (key: string, value: any) => void
}) {
  return (
    <div className={`rounded-lg transition-colors ${isConfiguring ? 'bg-indigo-50/50' : ''}`}>
      <div className="flex items-center gap-2 py-2 px-2">
        {/* Toggle */}
        <button
          onClick={onToggle}
          className={`w-9 h-5 rounded-full transition-colors relative shrink-0 ${
            enabled ? 'bg-indigo-500' : 'bg-gray-200'
          }`}
        >
          <div
            className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
              enabled ? 'translate-x-4' : 'translate-x-0.5'
            }`}
          />
        </button>

        {/* Icon + Name */}
        <div className="w-6 h-6 rounded bg-gray-100 flex items-center justify-center shrink-0">
          <IconByName name={widget.icon} size={12} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-medium text-gray-700 truncate">{widget.name}</p>
          <p className="text-[10px] text-gray-400 truncate">{widget.description}</p>
        </div>

        {/* Configure button (only if has config options) */}
        {widget.configOptions.length > 0 && enabled && (
          <button
            onClick={onConfigure}
            className={`w-6 h-6 rounded flex items-center justify-center shrink-0 transition-colors ${
              isConfiguring ? 'bg-indigo-100 text-indigo-600' : 'hover:bg-gray-100 text-gray-400'
            }`}
          >
            <Settings2 size={12} />
          </button>
        )}
      </div>

      {/* Config panel */}
      {isConfiguring && widget.configOptions.length > 0 && (
        <div className="px-3 pb-3 pt-1 ml-11 space-y-2 border-t border-gray-100">
          {widget.configOptions.map((opt) => (
            <div key={opt.key} className="flex items-center gap-2">
              <label className="text-[11px] text-gray-500 w-24 shrink-0">{opt.label}</label>
              {opt.type === 'select' && (
                <select
                  value={settings[opt.key] ?? opt.default}
                  onChange={(e) => onSettingChange(opt.key, e.target.value)}
                  className="text-xs border border-gray-200 rounded px-2 py-1 bg-white text-gray-700 flex-1"
                >
                  {opt.options?.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              )}
              {opt.type === 'number' && (
                <input
                  type="number"
                  value={settings[opt.key] ?? opt.default}
                  min={opt.min}
                  max={opt.max}
                  onChange={(e) => onSettingChange(opt.key, parseInt(e.target.value) || opt.default)}
                  className="text-xs border border-gray-200 rounded px-2 py-1 bg-white text-gray-700 w-16"
                />
              )}
              {opt.type === 'boolean' && (
                <button
                  onClick={() => onSettingChange(opt.key, !settings[opt.key])}
                  className={`w-8 h-4 rounded-full transition-colors relative ${
                    settings[opt.key] ? 'bg-indigo-500' : 'bg-gray-200'
                  }`}
                >
                  <div
                    className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-transform ${
                      settings[opt.key] ? 'translate-x-4' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
