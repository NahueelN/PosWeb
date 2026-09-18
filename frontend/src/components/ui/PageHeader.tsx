import type { ReactNode } from 'react'
import { HelpCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface PageHeaderProps {
  title: string
  subtitle?: string | ReactNode
  action?: ReactNode
  helpKey?: string
}

export default function PageHeader({ title, subtitle, action, helpKey }: PageHeaderProps) {
  const navigate = useNavigate()
  return (
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
        {subtitle && (
          <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {action}
        {helpKey && (
          <button
            type="button"
            onClick={() => navigate(`/ayuda?key=${helpKey}`)}
            className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:text-[oklch(0.52_0.255_278)] hover:bg-gray-100 transition-colors"
            aria-label="Ayuda"
            title="Ayuda"
          >
            <HelpCircle size={17} />
          </button>
        )}
      </div>
    </div>
  )
}
