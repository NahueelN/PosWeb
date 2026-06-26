import type { ReactNode } from 'react'

interface KeyboardHintsProps {
  showEnter?: boolean
  children?: ReactNode
}

export default function KeyboardHints({ showEnter = false, children }: KeyboardHintsProps) {
  return (
    <div className="flex items-center gap-3 text-xs text-gray-400 flex-wrap pb-2">
      <span className="flex items-center gap-1">
        <kbd className="px-1.5 py-0.5 bg-gray-100 rounded-[4px] text-[10px] font-mono border border-gray-200">←</kbd>
        <kbd className="px-1.5 py-0.5 bg-gray-100 rounded-[4px] text-[10px] font-mono border border-gray-200">↑</kbd>
        <kbd className="px-1.5 py-0.5 bg-gray-100 rounded-[4px] text-[10px] font-mono border border-gray-200">→</kbd>
        <kbd className="px-1.5 py-0.5 bg-gray-100 rounded-[4px] text-[10px] font-mono border border-gray-200">↓</kbd>
        <span>Productos</span>
      </span>
      {showEnter && (
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 bg-gray-100 rounded-[4px] text-[10px] font-mono border border-gray-200">Enter</kbd>
          <span>Medios de pago</span>
        </span>
      )}
      {children}
    </div>
  )
}
