import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useNotification } from '../../context/NotificationContext'
import { CircleAlert, CircleCheck, Info } from 'lucide-react'

const colors = {
  error: {
    border: 'border-red-500',
    bg: 'bg-red-50',
    icon: 'text-red-600',
    btn: 'bg-red-600 hover:bg-red-500',
  },
  success: {
    border: 'border-emerald-500',
    bg: 'bg-emerald-50',
    icon: 'text-emerald-600',
    btn: 'bg-emerald-600 hover:bg-emerald-500',
  },
  info: {
    border: 'border-blue-500',
    bg: 'bg-blue-50',
    icon: 'text-blue-600',
    btn: 'bg-blue-600 hover:bg-blue-500',
  },
}

const icons = {
  error: <CircleAlert size={40} strokeWidth={1.5} />,
  success: <CircleCheck size={40} strokeWidth={1.5} />,
  info: <Info size={40} strokeWidth={1.5} />,
}

const titles = {
  error: 'Error',
  success: 'Éxito',
  info: 'Información',
}

export default function DialogContainer() {
  const { current, dismiss } = useNotification()
  const btnRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (current) {
      btnRef.current?.focus()
    }
  }, [current])

  if (!current) return null

  const c = colors[current.variant]

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); dismiss() } }}
    >
      <div
        className={`bg-white rounded-2xl shadow-2xl border-2 ${c.border} max-w-md w-full animate-[fadeIn_0.15s_ease]`}
        role="alertdialog"
        aria-modal="true"
      >
        <div className="p-6 text-center">
          <div className={`mx-auto mb-4 ${c.icon}`}>
            {icons[current.variant]}
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            {titles[current.variant]}
          </h3>
          <p className="text-sm text-gray-600 whitespace-pre-wrap">
            {current.message}
          </p>
        </div>
        <div className={`px-6 pb-6 flex justify-center`}>
          <button
            ref={btnRef}
            onClick={dismiss}
            className={`${c.btn} text-white px-10 py-2.5 rounded-xl text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${current.variant === 'error' ? 'focus:ring-red-500' : current.variant === 'success' ? 'focus:ring-emerald-500' : 'focus:ring-blue-500'}`}
          >
            Aceptar
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
