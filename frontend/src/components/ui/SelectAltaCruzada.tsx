import { ChevronDown, Plus } from 'lucide-react'

export interface SelectAltaCruzadaOption {
  value: string
  label: string
}

interface SelectAltaCruzadaProps {
  value: string
  onChange: (value: string) => void
  options: SelectAltaCruzadaOption[]
  placeholder?: string
  disabled?: boolean
  showCreate?: boolean
  onCreate?: () => void
  createTitle?: string
  dataField?: string
}

export default function SelectAltaCruzada({
  value,
  onChange,
  options,
  placeholder,
  disabled = false,
  showCreate = true,
  onCreate,
  createTitle = 'Nuevo',
  dataField,
}: SelectAltaCruzadaProps) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        data-field={dataField}
        className={`w-full h-7 px-1.5 pr-9 border rounded-md text-sm bg-white appearance-none outline-none transition-all duration-150 ${
          disabled
            ? 'bg-gray-100 text-gray-500 cursor-not-allowed border-gray-200'
            : 'border-gray-300 focus:ring-2 focus:ring-[var(--color-primary-ring)] focus:border-[var(--color-primary)] hover:border-gray-400'
        }`}>
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {showCreate && (
        <>
          <ChevronDown size={13} strokeWidth={2.5} className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <button
            type="button"
            onClick={onCreate}
            tabIndex={-1}
            className="absolute right-0 top-0 h-full w-6 flex items-center justify-center text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-r-md transition-colors"
            title={createTitle}>
            <Plus size={13} strokeWidth={2.5} />
          </button>
        </>
      )}
    </div>
  )
}
