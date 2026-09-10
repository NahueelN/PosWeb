import { describe, it, expect, vi, beforeEach } from 'vitest'

const openMock = vi.fn()

vi.mock('@tauri-apps/plugin-shell', () => ({
  open: (...args: unknown[]) => openMock(...args),
}))

import { buildMailtoUrl, buildGmailUrl, openEmail } from '../mail'
import type { PedidoDetailDto } from '../../types'

function makePedido(overrides: Partial<PedidoDetailDto> = {}): PedidoDetailDto {
  return {
    id: 42,
    proveedorNombre: 'Distribuidora Norte',
    proveedorTelefono: '+54 11 5555-1234',
    proveedorMail: 'contacto@norte.com',
    fecha: '2026-08-11T03:00:00.000Z',
    total: 1500,
    estado: 'Pendiente',
    items: [
      { id: 1, productoId: 10, productoNombre: 'Coca-Cola 1.5L', codigoBarra: '77901234', cantidadPedida: 3, precioUnitarioEstimado: 300, subtotal: 900, estado: 'Pendiente' },
    ],
    ...overrides,
  }
}

describe('mail lib', () => {
  beforeEach(() => {
    openMock.mockReset()
  })

  describe('buildMailtoUrl', () => {
    it('builds mailto url with encoded subject and body', () => {
      const url = buildMailtoUrl('a@b.com', 'Pedido #42', 'Hola\n*Pedido*')
      expect(url).toBe('mailto:a@b.com?subject=' + encodeURIComponent('Pedido #42') + '&body=' + encodeURIComponent('Hola\n*Pedido*'))
    })
  })

  describe('buildGmailUrl', () => {
    it('builds gmail compose url with encoded to, subject and body', () => {
      const url = buildGmailUrl('a@b.com', 'Pedido #42', 'Hola\n*Pedido*')
      expect(url).toBe('https://mail.google.com/mail/?view=cm&fs=1&to=' + encodeURIComponent('a@b.com') + '&su=' + encodeURIComponent('Pedido #42') + '&body=' + encodeURIComponent('Hola\n*Pedido*'))
    })
  })

  describe('openEmail', () => {
    it('opens via tauri shell when available', async () => {
      openMock.mockResolvedValueOnce(undefined)
      await openEmail(makePedido())
      expect(openMock).toHaveBeenCalledTimes(1)
      const url = openMock.mock.calls[0][0] as string
      expect(url.startsWith('mailto:contacto@norte.com?subject=')).toBe(true)
      expect(url).toContain(encodeURIComponent('• Coca-Cola 1.5L × 3'))
    })

    it('opens gmail url when method is gmail', async () => {
      openMock.mockResolvedValueOnce(undefined)
      await openEmail(makePedido(), 'gmail')
      expect(openMock).toHaveBeenCalledTimes(1)
      const url = openMock.mock.calls[0][0] as string
      expect(url.startsWith('https://mail.google.com/mail/?view=cm&fs=1&to=' + encodeURIComponent('contacto@norte.com'))).toBe(true)
      expect(url).toContain(encodeURIComponent('• Coca-Cola 1.5L × 3'))
    })

    it('falls back to window.open when tauri open throws', async () => {
      openMock.mockRejectedValueOnce(new Error('no tauri'))
      const winOpen = vi.spyOn(window, 'open').mockImplementation(() => null)
      await openEmail(makePedido())
      expect(winOpen).toHaveBeenCalledTimes(1)
      winOpen.mockRestore()
    })

    it('does nothing when mail missing', async () => {
      const winOpen = vi.spyOn(window, 'open').mockImplementation(() => null)
      await openEmail(makePedido({ proveedorMail: undefined }))
      expect(openMock).not.toHaveBeenCalled()
      expect(winOpen).not.toHaveBeenCalled()
      winOpen.mockRestore()
    })
  })
})
