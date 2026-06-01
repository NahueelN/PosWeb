interface AlertBannerProps {
  variant: 'error' | 'success'
  message: string
  onClose?: () => void
}

const styles = {
  error: {
    container: 'bg-red-50 border border-red-200 text-red-700',
    icon: (
      <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
      </svg>
    ),
  },
  success: {
    container: 'bg-green-50 border border-green-200 text-green-700',
    icon: (
      <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
      </svg>
    ),
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
