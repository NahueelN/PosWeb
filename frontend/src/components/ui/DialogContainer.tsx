import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useNotification } from '../../context/NotificationContext'

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
  error: (
    <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
    </svg>
  ),
  success: (
    <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  ),
  info: (
    <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
    </svg>
  ),
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
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
