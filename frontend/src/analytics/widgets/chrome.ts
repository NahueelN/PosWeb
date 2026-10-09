// Widget Chrome
// Sistema de acentos compartido + resolución de íconos por nombre (Lucide).
// Cada widget deriva su acento de config.color y, si no existe, de un default
// por definitionId para que todos los widgets de una fuente sean coherentes.

import type { ElementType } from 'react'
import {
  DollarSign, Wallet, Target, BarChart3, PieChart as PieChartIcon, TrendingUp,
  AlertTriangle, ClipboardList, Clock, Receipt, Package, Table as TableIcon,
  List, Gauge, Users, FileText, Landmark, Percent, Scale, ArrowLeftRight,
  Boxes, PackageSearch, CreditCard, UserCheck, LayoutGrid,
} from 'lucide-react'

export interface WidgetAccent {
  /** Gradiente de la línea superior de la card (bg-gradient-to-r). */
  spine: string
  /** Fondo del chip de ícono (bg-gradient-to-br). */
  chipBg: string
  /** Color del ícono dentro del chip. */
  chipText: string
  /** Gradiente de las barras / relleno principal (bg-gradient-to-t). */
  barFrom: string
  barTo: string
  /** Variante hover de las barras. */
  barHoverFrom: string
  barHoverTo: string
  /** Hover de filas de tabla / listas. */
  rowHover: string
}

export const ACCENTS: Record<string, WidgetAccent> = {
  indigo: {
    spine: 'from-indigo-400 to-indigo-300',
    chipBg: 'from-indigo-50 to-indigo-100',
    chipText: 'text-indigo-500',
    barFrom: 'from-indigo-500',
    barTo: 'to-sky-300',
    barHoverFrom: 'from-indigo-600',
    barHoverTo: 'to-sky-400',
    rowHover: 'hover:bg-indigo-50/50',
  },
  sky: {
    spine: 'from-sky-400 to-sky-300',
    chipBg: 'from-sky-50 to-sky-100',
    chipText: 'text-sky-500',
    barFrom: 'from-sky-500',
    barTo: 'to-cyan-300',
    barHoverFrom: 'from-sky-600',
    barHoverTo: 'to-cyan-400',
    rowHover: 'hover:bg-sky-50/50',
  },
  blue: {
    spine: 'from-sky-400 to-blue-300',
    chipBg: 'from-blue-50 to-blue-100',
    chipText: 'text-blue-500',
    barFrom: 'from-blue-500',
    barTo: 'to-sky-300',
    barHoverFrom: 'from-blue-600',
    barHoverTo: 'to-sky-400',
    rowHover: 'hover:bg-blue-50/50',
  },
  emerald: {
    spine: 'from-emerald-400 to-emerald-300',
    chipBg: 'from-emerald-50 to-emerald-100',
    chipText: 'text-emerald-500',
    barFrom: 'from-emerald-500',
    barTo: 'to-teal-300',
    barHoverFrom: 'from-emerald-600',
    barHoverTo: 'to-teal-400',
    rowHover: 'hover:bg-emerald-50/50',
  },
  teal: {
    spine: 'from-teal-400 to-emerald-300',
    chipBg: 'from-teal-50 to-emerald-50',
    chipText: 'text-teal-500',
    barFrom: 'from-teal-500',
    barTo: 'to-emerald-300',
    barHoverFrom: 'from-teal-600',
    barHoverTo: 'to-emerald-400',
    rowHover: 'hover:bg-teal-50/50',
  },
  violet: {
    spine: 'from-violet-400 to-violet-300',
    chipBg: 'from-violet-50 to-violet-100',
    chipText: 'text-violet-500',
    barFrom: 'from-violet-500',
    barTo: 'to-fuchsia-300',
    barHoverFrom: 'from-violet-600',
    barHoverTo: 'to-fuchsia-400',
    rowHover: 'hover:bg-violet-50/50',
  },
  purple: {
    spine: 'from-purple-400 to-purple-300',
    chipBg: 'from-purple-50 to-purple-100',
    chipText: 'text-purple-500',
    barFrom: 'from-purple-500',
    barTo: 'to-violet-300',
    barHoverFrom: 'from-purple-600',
    barHoverTo: 'to-violet-400',
    rowHover: 'hover:bg-purple-50/50',
  },
  amber: {
    spine: 'from-amber-400 to-orange-300',
    chipBg: 'from-amber-50 to-amber-100',
    chipText: 'text-amber-600',
    barFrom: 'from-amber-500',
    barTo: 'to-orange-300',
    barHoverFrom: 'from-amber-600',
    barHoverTo: 'to-orange-400',
    rowHover: 'hover:bg-amber-50/50',
  },
  rose: {
    spine: 'from-rose-400 to-rose-300',
    chipBg: 'from-rose-50 to-rose-100',
    chipText: 'text-rose-500',
    barFrom: 'from-rose-500',
    barTo: 'to-orange-300',
    barHoverFrom: 'from-rose-600',
    barHoverTo: 'to-orange-400',
    rowHover: 'hover:bg-rose-50/50',
  },
  gray: {
    spine: 'from-gray-300 to-gray-200',
    chipBg: 'from-gray-50 to-gray-100',
    chipText: 'text-gray-400',
    barFrom: 'from-gray-400',
    barTo: 'to-gray-300',
    barHoverFrom: 'from-gray-500',
    barHoverTo: 'to-gray-400',
    rowHover: 'hover:bg-gray-50/50',
  },
}

/** Acento por defecto por fuente de datos, para coherencia entre widgets. */
const DEFAULT_ACCENT: Record<string, string> = {
  'ventas-hoy': 'indigo',
  'caja': 'emerald',
  'meta': 'purple',
  'ventas-semana': 'sky',
  'ventas-por-categoria': 'violet',
  'top-productos': 'teal',
  'alertas': 'amber',
  'resumen': 'emerald',
  'actividad': 'emerald',
  'ultimas-ventas': 'sky',
  'rentabilidad': 'indigo',
  'margen-por-categoria': 'violet',
  'margen-por-producto': 'purple',
  'deudas-clientes': 'amber',
  'deudas-proveedores': 'rose',
  'deudas-resumen': 'amber',
  'flujo-caja': 'teal',
  'horas-pico': 'sky',
  'metodos-pago': 'violet',
  'retencion-clientes': 'purple',
  'valor-inventario': 'emerald',
  'stock-inmovilizado': 'rose',
  'ventas-por-vendedor': 'sky',
}

export function getWidgetAccent(
  color?: string | null,
  definitionId?: string | null,
): WidgetAccent {
  const name = color && ACCENTS[color]
    ? color
    : DEFAULT_ACCENT[definitionId ?? ''] ?? 'indigo'
  return ACCENTS[name] ?? ACCENTS.indigo
}

const WIDGET_ICONS: Record<string, ElementType> = {
  DollarSign, Wallet, Target, BarChart3, PieChart: PieChartIcon, TrendingUp,
  AlertTriangle, ClipboardList, Clock, Receipt, Package, Table: TableIcon,
  List, Gauge, Users, FileText, Landmark, Percent, Scale, ArrowLeftRight,
  Boxes, PackageSearch, CreditCard, UserCheck,
}

export function resolveWidgetIcon(name?: string | null): ElementType {
  if (name) return WIDGET_ICONS[name] ?? LayoutGrid
  return LayoutGrid
}