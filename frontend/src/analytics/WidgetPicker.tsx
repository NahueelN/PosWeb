import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Dialog from '../components/ui/Dialog'
import Button from '../components/ui/Button'
import type { WidgetDefinition, WidgetVisualizationType, WidgetType } from './types'
import type { GridSize } from './grid/types'
import {
  Search, Plus, ChevronDown,
  DollarSign, Wallet, Target, BarChart3, PieChart, TrendingUp,
  AlertTriangle, ClipboardList, Clock, Receipt, Package,
  Table, List, Gauge, Users, FileText, Landmark, Grid, Truck,
} from 'lucide-react'

const iconMap: Record<string, React.ElementType> = {
  DollarSign, Wallet, Target, BarChart3, PieChart, TrendingUp,
  AlertTriangle, ClipboardList, Clock, Receipt, Package,
  Table, List, Gauge, Users, FileText, Landmark, Grid, Truck,
}

function IconByName({ name, size = 16 }: { name: string; size?: number }) {
  const Icon = iconMap[name] ?? Package
  return <Icon size={size} />
}

type SubCategory = 'KPIs' | 'Charts' | 'Rankings' | 'Alerts' | 'Lists' | 'Activity' | 'Comparisons'

const SUB_CATEGORY_ORDER: SubCategory[] = ['KPIs', 'Charts', 'Rankings', 'Alerts', 'Lists', 'Activity', 'Comparisons']

const subCategoryLabels: Record<SubCategory, string> = {
  KPIs: 'Indicadores',
  Charts: 'Gráficos',
  Rankings: 'Rankings',
  Alerts: 'Alertas',
  Lists: 'Listas',
  Activity: 'Actividad',
  Comparisons: 'Comparaciones',
}

interface ModuleEntry {
  definitionId: string
  subCategory: SubCategory
  question: string
}

const MODULE_WIDGETS: Record<string, ModuleEntry[]> = {
  Inicio: [
    { definitionId: 'resumen', subCategory: 'KPIs', question: 'Resumen del día' },
    { definitionId: 'ventas-hoy', subCategory: 'KPIs', question: 'Ventas del día' },
    { definitionId: 'meta', subCategory: 'KPIs', question: 'Meta diaria' },
    { definitionId: 'alertas', subCategory: 'Alerts', question: 'Alertas urgentes' },
    { definitionId: 'actividad', subCategory: 'Activity', question: 'Actividad reciente' },
  ],
  Ventas: [
    { definitionId: 'ventas-hoy', subCategory: 'KPIs', question: 'Ventas del día' },
    { definitionId: 'resumen', subCategory: 'KPIs', question: 'Ticket promedio' },
    { definitionId: 'meta', subCategory: 'KPIs', question: 'Cumplimiento de meta' },
    { definitionId: 'ventas-semana', subCategory: 'Charts', question: 'Ventas semanales' },
    { definitionId: 'top-productos', subCategory: 'Rankings', question: 'Productos más vendidos' },
    { definitionId: 'ultimas-ventas', subCategory: 'Activity', question: 'Últimas ventas' },
  ],
  Compras: [
    { definitionId: 'actividad', subCategory: 'Activity', question: 'Compras registradas' },
  ],
  Stock: [
    { definitionId: 'top-productos', subCategory: 'Rankings', question: 'Productos más vendidos' },
  ],
  Clientes: [
    { definitionId: 'resumen', subCategory: 'KPIs', question: 'Clientes del día' },
  ],
  Proveedores: [],
  Caja: [
    { definitionId: 'caja', subCategory: 'KPIs', question: 'Estado de caja' },
    { definitionId: 'actividad', subCategory: 'Activity', question: 'Movimientos de caja' },
  ],
  Finanzas: [
    { definitionId: 'actividad', subCategory: 'Activity', question: 'Gastos registrados' },
  ],
  Estadísticas: [
    { definitionId: 'ventas-semana', subCategory: 'Charts', question: 'Evolución de ventas' },
    { definitionId: 'top-productos', subCategory: 'Rankings', question: 'Productos estrella' },
  ],
}

const MODULE_ORDER = ['Inicio', 'Ventas', 'Compras', 'Stock', 'Clientes', 'Proveedores', 'Caja', 'Finanzas', 'Estadísticas']

const moduleIcons: Record<string, React.ElementType> = {
  Inicio: Grid,
  Ventas: DollarSign,
  Compras: FileText,
  Stock: Package,
  Clientes: Users,
  Proveedores: Truck,
  Caja: Wallet,
  Finanzas: Landmark,
  Estadísticas: TrendingUp,
}

function getModuleEntries(definitions: WidgetDefinition[]): Map<string, ModuleEntry[]> {
  const defMap = new Map(definitions.map(d => [d.id, d]))
  const result = new Map<string, ModuleEntry[]>()
  for (const mod of MODULE_ORDER) result.set(mod, [])
  for (const mod of MODULE_ORDER) {
    for (const entry of MODULE_WIDGETS[mod] ?? []) {
      if (defMap.has(entry.definitionId)) {
        result.get(mod)!.push(entry)
      }
    }
  }
  return result
}

function isSimple(def: WidgetDefinition): boolean {
  return def.compatibleTypes.length === 1 && def.compatibleTypes[0].params.length === 0
}

function initConfig(viz: WidgetVisualizationType): Record<string, any> {
  const config: Record<string, any> = {}
  for (const param of viz.params) {
    config[param.key] = param.default ?? ''
  }
  return config
}

interface Props {
  open: boolean
  onClose: () => void
  definitions: WidgetDefinition[]
  onAdd: (definitionId: string, widgetType: WidgetType, size: GridSize, config: Record<string, any>) => void
  existingDefinitionIds: string[]
}

function WidgetPreview({ type }: { type: string }) {
  const accent = '#6366f1'
  const accentLight = '#a5b4fc'
  const grayBg = '#f3f4f6'
  const grayLine = '#e5e7eb'
  const grayText = '#9ca3af'
  const darkText = '#1f2937'

  switch (type) {
    case 'KPI':
      return <svg viewBox="0 0 240 130" className="w-full h-32 rounded-xl bg-gray-50 p-2">
        <rect x="6" y="6" width="228" height="118" rx="10" fill="white" stroke={grayLine} strokeWidth="1"/>
        <rect x="6" y="6" width="228" height="4" rx="2" fill="#14b8a6"/>
        <text x="20" y="38" fontFamily="system-ui" fontSize="9" fill={grayText}>Ventas del día</text>
        <text x="20" y="72" fontFamily="system-ui" fontSize="28" fontWeight="700" fill={darkText}>{'$12,450'}</text>
        <rect x="20" y="84" width="48" height="20" rx="10" fill="#dcfce7"/>
        <text x="28" y="97" fontFamily="system-ui" fontSize="9" fontWeight="700" fill="#16a34a">{'+8.3%'}</text>
        <text x="74" y="97" fontFamily="system-ui" fontSize="8" fill={grayText}>vs ayer</text>
        <rect x="160" y="20" width="56" height="56" rx="12" fill={grayBg}/>
        <rect x="176" y="28" width="24" height="4" rx="2" fill={grayLine}/>
        <rect x="176" y="38" width="8" height="8" rx="2" fill={accentLight}/>
        <rect x="188" y="38" width="16" height="8" rx="2" fill={grayLine}/>
        <rect x="176" y="50" width="16" height="8" rx="2" fill={grayLine}/>
        <rect x="196" y="50" width="8" height="8" rx="2" fill={grayLine}/>
      </svg>
    case 'BAR_CHART':
    case 'LINE_CHART':
      return <svg viewBox="0 0 240 130" className="w-full h-32 rounded-xl bg-gray-50 p-2">
        <rect x="6" y="6" width="228" height="118" rx="10" fill="white" stroke={grayLine} strokeWidth="1"/>
        <text x="16" y="24" fontFamily="system-ui" fontSize="9" fontWeight="600" fill={darkText}>Ventas semanales</text>
        <line x1="30" y1="30" x2="30" y2="106" stroke={grayLine} strokeWidth="1"/>
        <line x1="30" y1="106" x2="220" y2="106" stroke={grayLine} strokeWidth="1"/>
        <text x="16" y="110" fontFamily="system-ui" fontSize="7" fill={grayText}>0</text>
        <line x1="30" y1="82" x2="220" y2="82" stroke={grayLine} strokeWidth="0.5" strokeDasharray="3,3"/>
        <line x1="30" y1="58" x2="220" y2="58" stroke={grayLine} strokeWidth="0.5" strokeDasharray="3,3"/>
        {[30,45,52,38,50,60,55].map((h,i)=> {
          const x = 44+i*24
          const bh = h*1.1
          return <rect key={i} x={x} y={106-bh} width="14" height={bh} rx="3" fill={i===6?accent:grayBg} stroke={i===6?accent:grayLine} strokeWidth="1"/>
        })}
        {['L','M','M','J','V','S','D'].map((d,i)=> <text key={i} x={46+i*24} y="117" fontFamily="system-ui" fontSize="7" fill={grayText}>{d}</text>)}
      </svg>
    case 'PIE_CHART':
      return <svg viewBox="0 0 240 130" className="w-full h-32 rounded-xl bg-gray-50 p-2">
        <rect x="6" y="6" width="228" height="118" rx="10" fill="white" stroke={grayLine} strokeWidth="1"/>
        <circle cx="72" cy="68" r="38" fill={grayBg} stroke={grayLine} strokeWidth="1"/>
        <path d="M72 30 A38 38 0 0 1 102 94" fill="none" stroke={accent} strokeWidth="14" strokeLinecap="round"/>
        <path d="M102 94 A38 38 0 0 1 42 94" fill="none" stroke={accentLight} strokeWidth="14" strokeLinecap="round"/>
        <path d="M42 94 A38 38 0 0 1 72 30" fill="none" stroke="#c4b5fd" strokeWidth="14" strokeLinecap="round"/>
        <circle cx="72" cy="68" r="16" fill="white"/>
        <text x="66" y="73" fontFamily="system-ui" fontSize="10" fontWeight="700" fill={darkText}>75%</text>
        <rect x="126" y="38" width="10" height="10" rx="3" fill={accent}/>
        <text x="142" y="47" fontFamily="system-ui" fontSize="9" fill={darkText}>Productos</text>
        <text x="196" y="47" fontFamily="system-ui" fontSize="9" fontWeight="600" fill={darkText}>55%</text>
        <rect x="126" y="58" width="10" height="10" rx="3" fill={accentLight}/>
        <text x="142" y="67" fontFamily="system-ui" fontSize="9" fill={darkText}>Servicios</text>
        <text x="204" y="67" fontFamily="system-ui" fontSize="9" fontWeight="600" fill={darkText}>30%</text>
        <rect x="126" y="78" width="10" height="10" rx="3" fill="#c4b5fd"/>
        <text x="142" y="87" fontFamily="system-ui" fontSize="9" fill={darkText}>Otros</text>
        <text x="196" y="87" fontFamily="system-ui" fontSize="9" fontWeight="600" fill={darkText}>15%</text>
      </svg>
    case 'TABLE':
      return <svg viewBox="0 0 240 130" className="w-full h-32 rounded-xl bg-gray-50 p-2">
        <rect x="6" y="6" width="228" height="118" rx="10" fill="white" stroke={grayLine} strokeWidth="1"/>
        <text x="16" y="24" fontFamily="system-ui" fontSize="9" fontWeight="600" fill={darkText}>Productos más vendidos</text>
        {[0,1,2,3,4].map((_,i)=> {
          const y = 38+i*18
          const bw = 110-i*20
          return <g key={i}>
            <rect x="16" y={y} width="18" height="12" rx="4" fill={i<3?accent:grayBg}/>
            <text x="20" y={y+9} fontFamily="system-ui" fontSize="8" fontWeight="700" fill={i<3?'white':grayText}>{i+1}</text>
            <text x="40" y={y+9} fontFamily="system-ui" fontSize="8" fill={darkText}>Producto {i+1}</text>
            <rect x="92" y={y+2} width={bw} height="8" rx="4" fill={grayBg}/>
            <rect x="92" y={y+2} width={bw*0.7} height="8" rx="4" fill={i===0?accent:accentLight} opacity={1-i*0.15}/>
            <text x={210} y={y+9} fontFamily="system-ui" fontSize="8" fontWeight="600" fill={darkText}>{['$4,200','$3,150','$2,800','$1,950','$1,200'][i]}</text>
          </g>
        })}
      </svg>
    case 'LIST':
      return <svg viewBox="0 0 240 130" className="w-full h-32 rounded-xl bg-gray-50 p-2">
        <rect x="6" y="6" width="228" height="118" rx="10" fill="white" stroke={grayLine} strokeWidth="1"/>
        <text x="16" y="24" fontFamily="system-ui" fontSize="9" fontWeight="600" fill={darkText}>Actividad reciente</text>
        <line x1="30" y1="32" x2="30" y2="116" stroke={grayLine} strokeWidth="1.5" strokeDasharray="4,4"/>
        {[
          {color:'#10b981',label:'Venta registrada',detail:'$1,200',time:'10:30'},
          {color:accent,label:'Producto agregado',detail:'Coca Cola 2L',time:'10:15'},
          {color:'#f59e0b',label:'Stock actualizado',detail:'-5 unidades',time:'09:45'},
          {color:'#ef4444',label:'Alerta de caja',detail:'Caja cerrada',time:'09:00'},
        ].map((item,i)=> {
          const y = 40+i*22
          return <g key={i}>
            <circle cx="30" cy={y+3} r="5" fill={item.color}/>
            <circle cx="30" cy={y+3} r="2" fill="white"/>
            <text x="46" y={y} fontFamily="system-ui" fontSize="8" fontWeight="600" fill={darkText}>{item.label}</text>
            <text x="46" y={y+11} fontFamily="system-ui" fontSize="7" fill={grayText}>{item.detail}</text>
            <text x="200" y={y+3} fontFamily="system-ui" fontSize="7" fill={grayText}>{item.time}</text>
          </g>
        })}
      </svg>
    case 'ALERTS':
      return <svg viewBox="0 0 240 130" className="w-full h-32 rounded-xl bg-gray-50 p-2">
        <rect x="6" y="6" width="228" height="118" rx="10" fill="white" stroke={grayLine} strokeWidth="1"/>
        <rect x="6" y="6" width="228" height="4" rx="2" fill="#f59e0b"/>
        <text x="16" y="28" fontFamily="system-ui" fontSize="9" fontWeight="600" fill={darkText}>Alertas urgentes</text>
        {[
          {color:'#f59e0b',icon:'!',label:'Stock bajo',desc:'3 productos por debajo del mínimo',count:'3'},
          {color:'#ef4444',icon:'!',label:'Caja cerrada',desc:'Hace más de 2 horas sin abrir',count:'1'},
          {color:'#3b82f6',icon:'!',label:'Pedidos pendientes',desc:'2 pedidos por recibir',count:'2'},
          {color:'#8b5cf6',icon:'!',label:'Deudas por vencer',desc:'Vencen en 3 días',count:'1'},
        ].map((item,i)=> {
          const y = 40+i*21
          return <g key={i}>
            <rect x="14" y={y} width="212" height="18" rx="5" fill={grayBg}/>
            <circle cx="26" cy={y+9} r="5" fill={item.color} opacity={0.2}/>
            <text x="23" y={y+12} fontFamily="system-ui" fontSize="8" fontWeight="700" fill={item.color}>{item.icon}</text>
            <text x="38" y={y+9} fontFamily="system-ui" fontSize="8" fontWeight="600" fill={darkText}>{item.label}</text>
            <text x="38" y={y+16} fontFamily="system-ui" fontSize="6" fill={grayText}>{item.desc}</text>
            <circle cx="208" cy={y+9} r="7" fill={item.color}/>
            <text x="205" y={y+12} fontFamily="system-ui" fontSize="7" fontWeight="700" fill="white">{item.count}</text>
          </g>
        })}
      </svg>
    case 'PROGRESS':
      return <svg viewBox="0 0 240 130" className="w-full h-32 rounded-xl bg-gray-50 p-2">
        <rect x="6" y="6" width="228" height="118" rx="10" fill="white" stroke={grayLine} strokeWidth="1"/>
        <text x="16" y="28" fontFamily="system-ui" fontSize="9" fontWeight="600" fill={darkText}>Meta diaria</text>
        <text x="16" y="48" fontFamily="system-ui" fontSize="24" fontWeight="700" fill={darkText}>{'$8,450'}</text>
        <text x="16" y="62" fontFamily="system-ui" fontSize="8" fill={grayText}>de {'$13,000'}</text>
        <rect x="16" y="72" width="200" height="12" rx="6" fill={grayBg}/>
        <rect x="16" y="72" width="130" height="12" rx="6" fill={accent}/>
        <circle cx="146" cy="78" r="8" fill="white" stroke={accent} strokeWidth="2"/>
        <text x="141" y="82" fontFamily="system-ui" fontSize="8" fontWeight="700" fill={accent}>65%</text>
        <text x="16" y="100" fontFamily="system-ui" fontSize="7" fill={grayText}>0</text>
        <text x="104" y="100" fontFamily="system-ui" fontSize="7" fill={grayText}>50%</text>
        <text x="196" y="100" fontFamily="system-ui" fontSize="7" fill={grayText}>100%</text>
        <text x="90" y="112" fontFamily="system-ui" fontSize="8" fontWeight="600" fill="#16a34a">+8% vs ayer</text>
      </svg>
    case 'GAUGE':
      return <svg viewBox="0 0 240 130" className="w-full h-32 rounded-xl bg-gray-50 p-2">
        <rect x="6" y="6" width="228" height="118" rx="10" fill="white" stroke={grayLine} strokeWidth="1"/>
        <text x="16" y="24" fontFamily="system-ui" fontSize="9" fontWeight="600" fill={darkText}>Cumplimiento de meta</text>
        <path d="M30 104 A80 80 0 0 1 210 104" fill="none" stroke={grayLine} strokeWidth="14" strokeLinecap="round"/>
        <path d="M30 104 A80 80 0 0 1 150 30" fill="none" stroke={accent} strokeWidth="14" strokeLinecap="round"/>
        <path d="M150 30 A80 80 0 0 1 210 104" fill="none" stroke={accentLight} strokeWidth="14" strokeLinecap="round"/>
        <circle cx="120" cy="84" r="20" fill="white" stroke={grayLine} strokeWidth="1"/>
        <text x="108" y="90" fontFamily="system-ui" fontSize="14" fontWeight="700" fill={darkText}>72%</text>
        <line x1="120" y1="84" x2="74" y2="46" stroke={darkText} strokeWidth="2" strokeLinecap="round"/>
        <circle cx="74" cy="46" r="4" fill={darkText}/>
        <text x="30" y="118" fontFamily="system-ui" fontSize="7" fill={grayText}>0</text>
        <text x="112" y="120" fontFamily="system-ui" fontSize="7" fill={grayText}>50%</text>
        <text x="204" y="118" fontFamily="system-ui" fontSize="7" fill={grayText}>100%</text>
      </svg>
    default:
      return <svg viewBox="0 0 240 130" className="w-full h-32 rounded-xl bg-gray-50 p-2">
        <rect x="6" y="6" width="228" height="118" rx="10" fill="white" stroke={grayLine} strokeWidth="1"/>
        <text x="80" y="68" fontFamily="system-ui" fontSize="11" fill={grayText}>Próximamente</text>
      </svg>
  }
}

function WidgetCard({
  def,
  question,
  isUsed,
  isExpanded,
  onExpand,
  onCollapse,
  onAdd,
  onClose,
}: {
  def: WidgetDefinition
  question: string
  isUsed: boolean
  isExpanded: boolean
  onExpand: () => void
  onCollapse: () => void
  onAdd: (definitionId: string, widgetType: WidgetType, size: GridSize, config: Record<string, any>) => void
  onClose: () => void
}) {
  const [selectedViz, setSelectedViz] = useState<WidgetVisualizationType>(def.compatibleTypes[0])
  const [config, setConfig] = useState<Record<string, any>>(() => initConfig(def.compatibleTypes[0]))
  const [showConfig, setShowConfig] = useState(false)
  const hasMultipleViz = def.compatibleTypes.length > 1
  const simple = isSimple(def)

  useEffect(() => {
    if (!isExpanded) {
      setSelectedViz(def.compatibleTypes[0])
      setConfig(initConfig(def.compatibleTypes[0]))
      setShowConfig(false)
    }
  }, [isExpanded, def])

  function handleVizChange(viz: WidgetVisualizationType) {
    setSelectedViz(viz)
    setConfig(initConfig(viz))
    setShowConfig(viz.params.length > 0)
  }

  function handleCardClick() {
    if (isExpanded) { onCollapse(); return }
    if (simple) {
      const size = def.defaultSize ?? def.supportedSizes?.[0] ?? { w: 3, h: 1 }
      onAdd(def.id, selectedViz.type as WidgetType, size, config)
      onClose()
      return
    }
    onExpand()
  }

  function handleAddClick(e: React.MouseEvent) {
    e.stopPropagation()
    if (simple || isExpanded) {
      const size = def.defaultSize ?? def.supportedSizes?.[0] ?? { w: 3, h: 1 }
      onAdd(def.id, selectedViz.type as WidgetType, size, config)
      onClose()
      return
    }
    onExpand()
  }

  function updateParam(key: string, value: any) {
    setConfig(prev => ({ ...prev, [key]: value }))
  }

  return (
    <div
      onClick={handleCardClick}
      className={`rounded-xl border transition-all cursor-pointer select-none ${
        isUsed
          ? 'border-indigo-200 bg-indigo-50/30'
          : isExpanded
            ? 'border-gray-300 bg-white shadow-[0_1px_3px_oklch(0_0_0_/_0.04)]'
            : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-[0_1px_2px_oklch(0_0_0_/_0.03)]'
      }`}
    >
      <div className="p-4">
        <div className="flex items-start gap-3 mb-2.5">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
            isUsed
              ? 'bg-indigo-100'
              : 'bg-gradient-to-br from-gray-50 to-gray-100 ring-1 ring-black/[0.02]'
          }`}>
            <IconByName name={def.icon} size={15} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold text-gray-900 leading-snug">{question}</p>
          </div>
          {!isUsed && !simple && (
            <div className="shrink-0 pt-0.5" onClick={handleAddClick}>
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                isExpanded
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-900 hover:text-white'
              }`}>
                <Plus size={13} strokeWidth={2.5} />
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <p className="text-[10px] text-gray-500 font-medium">{def.name}</p>
          <span className="text-[8px] text-gray-300">·</span>
          <span className="text-[9px] text-gray-400 font-medium">{def.compatibleTypes[0]?.label ?? def.compatibleTypes[0]?.type}</span>
          {isUsed && (
            <span className="text-[8px] bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded-full font-medium leading-none ml-auto">
              Agregado
            </span>
          )}
        </div>

        {(simple) && (
          <div className="mt-3">
            <Button
              variant="primary"
              size="sm"
              fullWidth
              onClick={handleAddClick}
            >
              {isUsed ? 'Agregar otra' : 'Agregar'}
            </Button>
          </div>
        )}

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 280, damping: 26, mass: 0.6 }}
              className="overflow-hidden"
            >
              <div className="pt-4 mt-4 border-t border-gray-100">
                <div className="mb-3">
                  <WidgetPreview type={selectedViz?.type ?? ''} />
                </div>
                {hasMultipleViz && (
                  <div className="mb-3">
                    <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                      Tipo de visualización
                    </p>
                    <div className="flex gap-1 flex-wrap">
                      {def.compatibleTypes.map((viz) => {
                        const active = selectedViz?.type === viz.type
                        return (
                          <button
                            key={viz.type}
                            onClick={(e) => { e.stopPropagation(); handleVizChange(viz) }}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-medium transition-all ${
                              active
                                ? 'bg-gray-900 text-white shadow-sm'
                                : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                            }`}
                          >
                            <IconByName name={viz.icon} size={10} />
                            {viz.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {selectedViz && selectedViz.params.length > 0 && (
                  <div>
                    <button
                      onClick={(e) => { e.stopPropagation(); setShowConfig(!showConfig) }}
                      className="flex items-center gap-1 text-[10px] font-medium text-gray-400 hover:text-gray-600 transition-colors mb-2"
                    >
                      <motion.div
                        animate={{ rotate: showConfig ? 180 : 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                      >
                        <ChevronDown size={11} />
                      </motion.div>
                      Opciones
                    </button>
                    <AnimatePresence>
                      {showConfig && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ type: 'spring', stiffness: 280, damping: 26, mass: 0.6 }}
                          className="overflow-hidden"
                        >
                          <div className="space-y-2.5 pb-2">
                            {selectedViz.params.map((param) => (
                              <div key={param.key}>
                                <label className="text-[9px] font-medium text-gray-400 uppercase tracking-wider block mb-1">
                                  {param.label}
                                </label>
                                {param.type === 'select' && (
                                  <select
                                    value={config[param.key] ?? param.default ?? ''}
                                    onChange={(e) => updateParam(param.key, e.target.value)}
                                    onClick={(e) => e.stopPropagation()}
                                    className="w-full text-[10px] border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white text-gray-700 outline-none focus:border-gray-400 transition-colors"
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
                                    onChange={(e) => updateParam(param.key, parseInt(e.target.value) || param.default)}
                                    onClick={(e) => e.stopPropagation()}
                                    className="w-full text-[10px] border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white text-gray-700 outline-none focus:border-gray-400 transition-colors"
                                  />
                                )}
                                {param.type === 'boolean' && (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); updateParam(param.key, !config[param.key]) }}
                                    className={`w-8 h-4 rounded-full transition-colors relative ${
                                      config[param.key] ? 'bg-gray-900' : 'bg-gray-200'
                                    }`}
                                  >
                                    <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-transform ${
                                      config[param.key] ? 'translate-x-[18px]' : 'translate-x-0.5'
                                    }`} />
                                  </button>
                                )}
                                {param.type === 'text' && (
                                  <input
                                    type="text"
                                    value={config[param.key] ?? param.default ?? ''}
                                    onChange={(e) => updateParam(param.key, e.target.value)}
                                    onClick={(e) => e.stopPropagation()}
                                    className="w-full text-[10px] border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white text-gray-700 outline-none focus:border-gray-400 transition-colors"
                                  />
                                )}
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {(hasMultipleViz || (selectedViz && selectedViz.params.length > 0)) && (
                  <div className="mt-3">
                    <Button
                      variant="primary"
                      size="sm"
                      fullWidth
                      onClick={(e) => { e.stopPropagation(); handleAddClick(e as any) }}
                    >
                      Agregar al Dashboard
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default function WidgetPicker({ open, onClose, definitions, onAdd, existingDefinitionIds }: Props) {
  const [search, setSearch] = useState('')
  const [activeModule, setActiveModule] = useState('Inicio')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const isSearching = search.length > 0

  const moduleEntries = useMemo(() => getModuleEntries(definitions), [definitions])

  useEffect(() => {
    setExpandedId(null)
  }, [search, activeModule])

  const searchResults = useMemo(() => {
    if (!isSearching) return new Map<string, ModuleEntry[]>()
    const q = search.toLowerCase()
    const results = new Map<string, ModuleEntry[]>()
    for (const mod of MODULE_ORDER) {
      const entries = moduleEntries.get(mod) ?? []
      const matching = entries.filter(e => {
        const def = definitions.find(d => d.id === e.definitionId)
        if (!def) return false
        return (
          e.question.toLowerCase().includes(q) ||
          def.name.toLowerCase().includes(q) ||
          def.description.toLowerCase().includes(q)
        )
      })
      if (matching.length > 0) results.set(mod, matching)
    }
    return results
  }, [isSearching, search, definitions, moduleEntries])

  const currentEntries = useMemo(() => {
    if (isSearching) return []
    return moduleEntries.get(activeModule) ?? []
  }, [isSearching, moduleEntries, activeModule])

  const currentGrouped = useMemo(() => {
    const map = new Map<SubCategory, ModuleEntry[]>()
    for (const cat of SUB_CATEGORY_ORDER) map.set(cat, [])
    for (const entry of currentEntries) {
      const list = map.get(entry.subCategory)
      if (list) list.push(entry)
    }
    return map
  }, [currentEntries])

  const activeCount = moduleEntries.get(activeModule)?.length ?? 0

  const isModuleEmpty = (mod: string) => {
    return (moduleEntries.get(mod)?.length ?? 0) === 0
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Agregar Widget"
      description="Explorá los módulos del sistema y elegí la información que querés ver."
      width="xl"
    >
      <div className="mb-4">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscá por nombre, descripción…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
            className="w-full h-10 pl-9 pr-3 text-sm bg-gray-50 border border-gray-200 rounded-xl text-gray-700 placeholder-gray-400 outline-none focus:border-gray-300 focus:bg-white transition-colors"
          />
        </div>
      </div>

      <div className="flex gap-0 h-[420px] -mx-6">
        {!isSearching && (
          <nav className="w-[164px] shrink-0 border-r border-gray-100 overflow-y-auto px-2 py-1">
            {MODULE_ORDER.map((mod) => {
              const Icon = moduleIcons[mod] ?? Grid
              const empty = isModuleEmpty(mod)
              return (
                <button
                  key={mod}
                  onClick={() => setActiveModule(mod)}
                  disabled={empty}
                  className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left transition-all ${
                    activeModule === mod
                      ? 'bg-gray-900 text-white shadow-sm'
                      : empty
                        ? 'text-gray-300 cursor-not-allowed'
                        : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                  }`}
                >
                  <Icon size={14} strokeWidth={activeModule === mod ? 2.5 : 2} />
                  <span className="text-[11px] font-semibold truncate">{mod}</span>
                  {empty && (
                    <span className="text-[8px] text-gray-300 ml-auto">—</span>
                  )}
                </button>
              )
            })}
          </nav>
        )}

        <div className="flex-1 min-w-0 overflow-y-auto px-5 py-1 space-y-5">
          {isSearching ? (
            <>
              {Array.from(searchResults.entries()).map(([mod, entries]) => (
                <div key={mod}>
                  <div className="flex items-center gap-2 mb-2.5">
                    {(() => {
                      const Icon = moduleIcons[mod] ?? Grid
                      return <Icon size={13} className="text-gray-400" strokeWidth={2} />
                    })()}
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.12em]">{mod}</p>
                    <span className="text-[9px] text-gray-300 font-medium">{entries.length}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    {entries.map((entry) => {
                      const def = definitions.find(d => d.id === entry.definitionId)
                      if (!def) return null
                      return (
                        <WidgetCard
                          key={entry.definitionId}
                          def={def}
                          question={entry.question}
                          isUsed={existingDefinitionIds.includes(def.id)}
                          isExpanded={expandedId === def.id}
                          onExpand={() => setExpandedId(def.id)}
                          onCollapse={() => setExpandedId(null)}
                          onAdd={onAdd}
                          onClose={onClose}
                        />
                      )
                    })}
                  </div>
                </div>
              ))}
              {searchResults.size === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center mb-3 ring-1 ring-black/[0.02]">
                    <Search size={15} className="text-gray-300" />
                  </div>
                  <p className="text-sm font-semibold text-gray-500">Sin resultados</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">Probá con otros términos</p>
                </div>
              )}
            </>
          ) : activeCount === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center mb-3 ring-1 ring-black/[0.02]">
                {(() => {
                  const Icon = moduleIcons[activeModule] ?? Grid
                  return <Icon size={15} className="text-gray-300" />
                })()}
              </div>
              <p className="text-sm font-semibold text-gray-500">Sin widgets disponibles</p>
              <p className="text-[11px] text-gray-400 mt-0.5">No hay información para este módulo aún</p>
            </div>
          ) : SUB_CATEGORY_ORDER.map((cat) => {
              const entries = currentGrouped.get(cat) ?? []
              if (entries.length === 0) return null
              return (
                <div key={cat}>
                  <div className="flex items-center gap-2 mb-2.5">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.12em]">
                      {subCategoryLabels[cat]}
                    </p>
                    <span className="text-[9px] text-gray-300 font-medium">{entries.length}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    {entries.map((entry) => {
                      const def = definitions.find(d => d.id === entry.definitionId)
                      if (!def) return null
                      return (
                        <WidgetCard
                          key={entry.definitionId}
                          def={def}
                          question={entry.question}
                          isUsed={existingDefinitionIds.includes(def.id)}
                          isExpanded={expandedId === def.id}
                          onExpand={() => setExpandedId(def.id)}
                          onCollapse={() => setExpandedId(null)}
                          onAdd={onAdd}
                          onClose={onClose}
                        />
                      )
                    })}
                  </div>
                </div>
              )
            })}
        </div>
      </div>
    </Dialog>
  )
}
