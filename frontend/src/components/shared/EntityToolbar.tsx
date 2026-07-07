import type { ReactNode, RefObject } from 'react'
import { Plus, Search } from 'lucide-react'
import Button from '../ui/Button'

interface EntityToolbarProps {
  search: string
  onSearchChange: (value: string) => void
  searchRef: RefObject<HTMLInputElement | null>
  searchPlaceholder?: string
  createLabel: string
  onCreate: () => void
  extra?: ReactNode
}

export default function EntityToolbar({
  search, onSearchChange, searchRef, searchPlaceholder = 'Buscar...', createLabel, onCreate, extra,
}: EntityToolbarProps) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="relative flex-1">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input
          ref={searchRef}
          type="text"
          value={search}
          onChange={e => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
        />
      </div>
      {extra}
      <Button variant="primary" size="md" onClick={onCreate} icon={<Plus size={16} />}>
        {createLabel}
      </Button>
    </div>
  )
}
