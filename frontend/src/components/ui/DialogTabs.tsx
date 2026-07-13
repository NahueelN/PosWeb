interface DialogTabsProps {
  tabs: string[]
  active: string
  onChange: (tab: string) => void
}

export default function DialogTabs({ tabs, active, onChange }: DialogTabsProps) {
  return (
    <div className="flex gap-1 p-0.5 rounded-lg" style={{ backgroundColor: 'var(--color-primary-light)' }}>
      {tabs.map(tab => (
        <button
          key={tab}
          type="button"
          onClick={() => onChange(tab)}
          className={`px-2.5 py-1 rounded-md text-sm font-semibold transition-all duration-150 ${
            active === tab
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  )
}
