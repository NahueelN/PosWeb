import { useState } from 'react'
import type { MercadoPagoEstadoDto } from '../../types'
import { api } from '../../api/client'
import Button from '../../components/ui/Button'

interface TransferenciaEsperaProps {
  total: number
  mpEstado: MercadoPagoEstadoDto | null
  tiempoRestante: number
  onConfirmar: () => void
  onCancelar: () => void
  loading: boolean
  modoQr?: boolean
  qrData?: string | null
}

export default function TransferenciaEspera({
  total,
  mpEstado,
  tiempoRestante,
  onConfirmar,
  onCancelar,
  loading,
  modoQr = false,
  qrData = null,
}: TransferenciaEsperaProps) {
  const minutos = Math.floor(tiempoRestante / 60)
  const segundos = tiempoRestante % 60
  const timerStr = `${minutos.toString().padStart(2, '0')}:${segundos.toString().padStart(2, '0')}`
  const [verificando, setVerificando] = useState(false)
  const [resultadoVerif, setResultadoVerif] = useState<'pendiente' | 'encontrado' | 'no-encontrado'>('pendiente')

  async function handleVerificar() {
    setVerificando(true)
    setResultadoVerif('pendiente')
    try {
      const res = await api.mercadopago.verificarPago(total)
      setResultadoVerif(res.encontrado ? 'encontrado' : 'no-encontrado')
    } catch {
      setResultadoVerif('no-encontrado')
    } finally {
      setVerificando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
      <div
        className="bg-white rounded-2xl shadow-xl w-[440px] max-w-[95vw] flex flex-col"
        onKeyDown={e => {
          if (e.key === 'Escape') onCancelar()
        }}
      >
        <div
          className="flex items-center justify-between px-5 py-3 rounded-t-2xl"
          style={{ background: 'oklch(0.52 0.255 278)' }}
        >
          <span className="text-sm font-bold text-white">{modoQr ? 'Cobro QR' : 'Transferencia'}</span>
          <span className={`text-sm font-bold tabular-nums ${tiempoRestante <= 60 ? 'text-red-200' : 'text-white/80'}`}>
            {timerStr}
          </span>
        </div>

        <div className="px-5 py-5 space-y-4">
          <div className="text-center">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Monto a transferir</p>
            <p className="text-3xl font-bold text-gray-900 tabular-nums mt-1">
              ${total.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>

          {modoQr && qrData && (
            <div className="flex justify-center">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}`}
                alt="QR de pago"
                className="w-48 h-48 rounded-xl"
              />
            </div>
          )}

          <div className="bg-gray-50 rounded-xl p-4 space-y-2.5">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">
              {modoQr ? 'Pago con QR' : 'Datos de la cuenta'}
            </p>
            {!modoQr && mpEstado?.nombreTitular && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-400">MP:</span>
                <span className="font-medium text-gray-700">{mpEstado.nombreTitular}</span>
              </div>
            )}
            <p className="text-xs text-gray-400 leading-relaxed">
              {modoQr
                ? 'Mostrale el QR impreso al cliente. Cuando lo escanee y pague, la venta se confirmará automáticamente.'
                : 'Transferí el monto a la cuenta de MercadoPago vinculada. Podés verificar si ya llegó o confirmar manualmente.'
              }
            </p>
          </div>

          {resultadoVerif === 'encontrado' && (
            <p className="text-sm text-green-600 text-center font-medium bg-green-50 py-2 rounded-lg">
              ¡Pago detectado! Confirmá la venta.
            </p>
          )}
          {resultadoVerif === 'no-encontrado' && (
            <p className="text-sm text-amber-600 text-center font-medium bg-amber-50 py-2 rounded-lg">
              Todavía no se detectó el pago. Esperá unos segundos y volvé a verificar.
            </p>
          )}

          {tiempoRestante <= 60 && (
            <p className="text-xs text-amber-600 text-center font-medium">
              La sesión expirará en menos de un minuto
            </p>
          )}
        </div>

        <div className="px-5 pb-5 flex gap-2.5">
          <Button
            variant="secondary"
            size="lg"
            onClick={onCancelar}
            disabled={loading || verificando}
          >
            Cancelar
          </Button>
          <Button
            variant="secondary"
            size="lg"
            onClick={handleVerificar}
            disabled={verificando || loading}
          >
            {verificando ? 'Verificando...' : 'Verificar pago'}
          </Button>
          <Button
            variant="confirm"
            size="lg"
            onClick={onConfirmar}
            disabled={loading || verificando}
          >
            {loading ? 'Confirmando...' : 'Confirmar'}
          </Button>
        </div>
      </div>
    </div>
  )
}
