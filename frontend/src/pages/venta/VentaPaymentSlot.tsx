import { type RefObject } from 'react'
import { Banknote, ArrowLeftRight, CreditCard, Smartphone, QrCode } from 'lucide-react'
import type { MedioPagoDto } from '../../types'

interface VentaPaymentSlotProps {
  mediosPago: MedioPagoDto[]
  selectedMedio: MedioPagoDto | null
  onSelectMedio: (mp: MedioPagoDto) => void
  medioRefs: RefObject<(HTMLButtonElement | null)[]>
  confirmBtnRef: RefObject<HTMLButtonElement | null>
  searchInputRef: RefObject<HTMLInputElement | null>
  total: number
  recibio: string
}

export default function VentaPaymentSlot({
  mediosPago, selectedMedio, onSelectMedio, medioRefs,
  confirmBtnRef, searchInputRef, total, recibio,
}: VentaPaymentSlotProps) {
  function handleMedioKeyDown(e: React.KeyboardEvent, idx: number) {
    if (e.key === 'ArrowLeft') {
      e.preventDefault()
      const prev = idx - 1
      if (prev >= 0) medioRefs.current[prev]?.focus()
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      const next = idx + 1
      if (next < mediosPago.length) medioRefs.current[next]?.focus()
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onSelectMedio(mediosPago[idx])
    }
  }

  return (
    <>
      <div>
        <div className="grid grid-cols-5 gap-1.5" role="group" aria-label="Medio de pago">
          {mediosPago.map((mp, idx) => {
            const estaSeleccionado = selectedMedio?.id === mp.id
            const iconMap: Record<number, React.ReactNode> = {
              1: <Banknote size={16} strokeWidth={1.75} />,
              2: <ArrowLeftRight size={16} strokeWidth={1.75} />,
              3: <CreditCard size={16} strokeWidth={1.75} />,
              4: <Smartphone size={16} strokeWidth={1.75} />,
              5: <QrCode size={16} strokeWidth={1.75} />,
            }
            const icon = iconMap[mp.id] ?? <Banknote size={16} strokeWidth={1.75} />
            return (
              <button
                key={mp.id}
                ref={(el) => { medioRefs.current[idx] = el }}
                type="button"
                onClick={() => onSelectMedio(mp)}
                onKeyDown={(e) => {
                  if (e.key === 'Tab' && !e.shiftKey) { e.preventDefault(); confirmBtnRef.current?.focus(); return }
                  if (idx === 0 && e.key === 'Tab' && e.shiftKey) { e.preventDefault(); searchInputRef.current?.focus(); return }
                  handleMedioKeyDown(e, idx)
                }}
                className={[
                  'flex flex-col items-center justify-center gap-[5px] rounded-xl border py-2.5 px-1 transition-all duration-150 select-none',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[oklch(0.52_0.255_278_/_0.30)] focus-visible:ring-offset-1',
                  estaSeleccionado
                    ? 'border-[oklch(0.52_0.255_278)] bg-[oklch(0.52_0.255_278)] text-white shadow-[0_2px_8px_-2px_oklch(0.52_0.255_278_/_0.40)]'
                    : 'border-gray-200 bg-white text-gray-400 hover:border-[oklch(0.52_0.255_278_/_0.35)] hover:bg-[oklch(0.52_0.255_278_/_0.05)] hover:text-[oklch(0.52_0.255_278)]',
                ].join(' ')}
                aria-pressed={estaSeleccionado}
              >
                {icon}
                <span className="text-[9px] font-bold uppercase tracking-wide leading-none">{mp.nombre}</span>
              </button>
            )
          })}
        </div>
      </div>
      <p className="text-[10px] text-gray-400 leading-tight text-center">
        Pagos inferiores al total o vacíos generan deuda. Podés revisarla en la pestaña Deudas.
      </p>
      {(() => {
        const r = parseFloat(recibio || '0')
        if (r < total && total > 0) return <p className="text-xs text-amber-600 text-center font-medium">↗ Queda una deuda de ${(total - r).toFixed(2)}</p>
        if (r >= total && total > 0) return <p className="text-xs text-green-600 text-center font-medium">✓ Deuda saldada</p>
        return null
      })()}
    </>
  )
}
