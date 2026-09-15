import type { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  padding?: 'sm' | 'md' | 'lg'
  /** Borde más marcado que el estándar */
  strongBorder?: boolean
}

const paddings = {
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6',
}

export default function Card({ children, className = '', padding = 'md', strongBorder = false }: CardProps) {
  return (
    <div className={`bg-white rounded-2xl shadow-sm border ${strongBorder ? 'border-gray-300' : 'border-gray-200'} ${paddings[padding]} ${className}`}>
      {children}
    </div>
  )
}
