import { CircleAlert, CircleCheck } from 'lucide-react'

interface AlertBannerProps {
  variant: 'error' | 'success'
  message: string
  onClose?: () => void
}

const styles = {
  error: {
    container: 'bg-red-50 border border-red-200 text-red-700',
    icon: <CircleAlert size={20} strokeWidth={2} className="shrink-0" />,
  },
  success: {
    container: 'bg-green-50 border border-green-200 text-green-700',
    icon: <CircleCheck size={20} strokeWidth={2} className="shrink-0" />,
  },
}

export default function AlertBanner({ variant, message, onClose }: AlertBannerProps) {
  const s = styles[variant]

  return (
    <div className={`${s.container} rounded-xl px-4 py-3 text-sm flex items-center gap-2`}>
      {s.icon}
      <span className="flex-1">{message}</span>
      {onClose && (
        <button
          onClick={onClose}
          className="shrink-0 font-medium opacity-70 hover:opacity-100 transition-opacity"
        >
          ✕
        </button>
      )}
    </div>
  )
}
