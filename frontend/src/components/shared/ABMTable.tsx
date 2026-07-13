import { type ReactNode, useRef } from 'react'
import { Search, Plus } from 'lucide-react'
import Button from '../ui/Button'
import Card from '../ui/Card'
import Spinner from '../ui/Spinner'

interface ABMTableProps {
  icon: ReactNode
  title: string
  description: string
  loading?: boolean
  search?: string
  onSearchChange?: (value: string) => void
  searchPlaceholder?: string
  createLabel?: string
  onCreate?: () => void
  emptyIcon?: ReactNode
  emptyTitle: string
  emptyDescription?: string
  headers: ReactNode
  children: ReactNode
  footerInfo?: string
}

export default function ABMTable({
  icon, title, description, loading = false,
  search, onSearchChange, searchPlaceholder,
  createLabel, onCreate,
  emptyIcon, emptyTitle, emptyDescription,
  headers, children, footerInfo,
}: ABMTableProps) {
  const searchRef = useRef<HTMLInputElement>(null)

  return (
    <Card padding="lg" className="overflow-hidden">
      <div className="flex items-start gap-3 mb-5">
        <span className="mt-0.5 text-indigo-600 shrink-0">{icon}</span>
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          <p className="text-sm text-gray-500 mt-0.5">{description}</p>
        </div>
      </div>

      {(onSearchChange || onCreate) && (
        <div className="flex items-center gap-3 mb-4">
          {onSearchChange && (
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                ref={searchRef}
                type="text"
                value={search ?? ''}
                onChange={e => onSearchChange(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full h-9 pl-9 pr-3 text-sm border border-gray-200 rounded-lg
                  focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none
                  placeholder:text-gray-400"
              />
            </div>
          )}
          {onCreate && (
            <Button variant="primary" size="sm" icon={<Plus size={14} />} onClick={onCreate}>
              {createLabel ?? 'Nuevo'}
            </Button>
          )}
        </div>
      )}

      {loading ? (
        <Spinner text="Cargando..." />
      ) : !children || (Array.isArray(children) && children.length === 0) ? (
        <div className="flex flex-col items-center justify-center py-14 text-center">
          <span className="text-gray-300 mb-3">{emptyIcon}</span>
          <p className="text-sm font-medium text-gray-500">{emptyTitle}</p>
          {emptyDescription && (
            <p className="text-xs text-gray-400 mt-1 max-w-xs">{emptyDescription}</p>
          )}
          {onCreate && (
            <Button variant="primary" size="sm" icon={<Plus size={14} />} onClick={onCreate} className="mt-4">
              {createLabel ?? 'Nuevo'}
            </Button>
          )}
        </div>
      ) : (
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200 [&>th]:py-3">
                {headers}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {children}
            </tbody>
          </table>
          {footerInfo && (
            <div className="px-4 py-2.5 bg-gray-50 border-t border-gray-200">
              <p className="text-xs text-gray-400">{footerInfo}</p>
            </div>
          )}
        </div>
      )}
    </Card>
  )
}
