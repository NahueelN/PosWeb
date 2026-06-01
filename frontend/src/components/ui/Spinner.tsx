interface SpinnerProps {
  text?: string
  className?: string
}

export default function Spinner({ text, className = '' }: SpinnerProps) {
  return (
    <div className={`flex items-center justify-center py-12 ${className}`}>
      <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      {text && <span className="ml-3 text-sm text-gray-500">{text}</span>}
    </div>
  )
}
