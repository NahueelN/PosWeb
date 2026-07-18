import type { Widget } from './types'
import KpiWidget from './widgets/KpiWidget'
import ChartWidget from './widgets/ChartWidget'
import PieChartWidget from './widgets/PieChartWidget'
import TableWidget from './widgets/TableWidget'
import ListWidget from './widgets/ListWidget'
import AlertWidget from './widgets/AlertWidget'
import ProgressWidget from './widgets/ProgressWidget'
import GaugeWidget from './widgets/GaugeWidget'

interface Props {
  widget: Widget
}

export default function WidgetRenderer({ widget }: Props) {
  switch (widget.type) {
    case 'KPI':
      return <KpiWidget widget={widget} />
    case 'BAR_CHART':
    case 'LINE_CHART':
      return <ChartWidget widget={widget} />
    case 'PIE_CHART':
      return <PieChartWidget widget={widget} />
    case 'TABLE':
      return <TableWidget widget={widget} />
    case 'LIST':
      return <ListWidget widget={widget} />
    case 'ALERTS':
      return <AlertWidget widget={widget} />
    case 'PROGRESS':
      return <ProgressWidget widget={widget} />
    case 'GAUGE':
      return <GaugeWidget widget={widget} />
    case 'HEATMAP':
      return (
        <div className="bg-white rounded-xl border border-gray-100 p-4 flex flex-col items-center justify-center text-gray-300 h-full">
          <div className="text-center">
            <div className="w-10 h-10 mx-auto mb-2 rounded-lg bg-gray-50 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <rect x="1" y="1" width="5" height="5" rx="1" fill="#d1d5db" />
                <rect x="7.5" y="1" width="5" height="5" rx="1" fill="#a5b4fc" />
                <rect x="14" y="1" width="5" height="5" rx="1" fill="#6366f1" />
                <rect x="1" y="7.5" width="5" height="5" rx="1" fill="#a5b4fc" />
                <rect x="7.5" y="7.5" width="5" height="5" rx="1" fill="#6366f1" />
                <rect x="14" y="7.5" width="5" height="5" rx="1" fill="#818cf8" />
                <rect x="1" y="14" width="5" height="5" rx="1" fill="#6366f1" />
                <rect x="7.5" y="14" width="5" height="5" rx="1" fill="#818cf8" />
                <rect x="14" y="14" width="5" height="5" rx="1" fill="#c7d2fe" />
              </svg>
            </div>
            <p className="text-xs font-medium text-gray-400">Heatmap</p>
            <p className="text-[10px] text-gray-300 mt-0.5">Próximamente</p>
          </div>
        </div>
      )
    default:
      return (
        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center text-gray-400 text-sm">
          Widget type not supported: {widget.type}
        </div>
      )
  }
}
