import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import type { VentaResultadoDto } from '../../../types'
import TicketResultado from '../TicketResultado'

vi.mock('../../../api/client', () => {
  type CallableProxy = (() => Promise<unknown>) & { [k: string]: CallableProxy }
  const callableProxy = (): CallableProxy => {
    const fn = (() => Promise.resolve({})) as CallableProxy
    const handler: ProxyHandler<CallableProxy> = {
      get: (target, prop) => {
        if (typeof prop === 'symbol') return fn
        if (!(prop in target)) target[prop as string] = callableProxy()
        return target[prop as string]
      },
    }
    return new Proxy(fn, handler)
  }
  return { api: callableProxy() }
})

vi.mock('../../components/ui/Button', () => ({
  default: ({ children, ...props }: { children: React.ReactNode } & Record<string, unknown>) => (
    <button {...props}>{children}</button>
  ),
}))

function makeResultado(): VentaResultadoDto {
  return {
    ventaId: 1234,
    fecha: '2026-09-18T10:00:00.000Z',
    total: 4600,
    pagos: [{ medioPagoId: 1, medioPagoNombre: 'Efectivo', monto: 5000, cambio: 400 }],
    cambio: 400,
    empresaNombre: 'PosWeb',
    empresaDireccion: 'Av. Test 123',
  }
}

const defaultProps = {
  resultado: makeResultado(),
  ultimosItems: [{ producto: { id: 1, nombre: 'Coca-Cola', precio: 4600 }, cantidad: 1 }],
  user: { id: 1, nombre: 'Ana', email: 'ana@test.com', rol: 'Admin' },
  onNuevaVenta: vi.fn(),
}

describe('TicketResultado (landing de venta)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('muestra la landing "VENTA REGISTRADA" (regresión: no debe ser un popup)', async () => {
    render(<TicketResultado {...defaultProps} />)
    await waitFor(() => {
      expect(screen.getByText('VENTA REGISTRADA')).toBeInTheDocument()
    })
    expect(screen.getByRole('button', { name: 'Imprimir' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Nueva venta' })).toBeInTheDocument()
  })

  it('muestra el total completo en el preview del ticket', async () => {
    render(<TicketResultado {...defaultProps} />)
    await waitFor(() => {
      expect(screen.getByText('VENTA REGISTRADA')).toBeInTheDocument()
    })
    expect(screen.getByText(/TOTAL/)).toBeInTheDocument()
    expect(screen.getAllByText(/\$4\.600,00/).length).toBeGreaterThan(0)
  })

  it('permite iniciar una nueva venta', async () => {
    render(<TicketResultado {...defaultProps} />)
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Nueva venta' })).toBeInTheDocument()
    })
    screen.getByRole('button', { name: 'Nueva venta' }).click()
    expect(defaultProps.onNuevaVenta).toHaveBeenCalledTimes(1)
  })
})