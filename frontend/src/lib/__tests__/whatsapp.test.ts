import { describe, it, expect, vi, beforeEach } from 'vitest'

const openMock = vi.fn()

vi.mock('@tauri-apps/plugin-shell', () => ({
  open: (...args: unknown[]) => openMock(...args),
}))

import { sanitizePhone, buildWhatsAppUrl, buildPedidoWhatsAppMessage, openWhatsApp } from '../whatsapp'
import type { PedidoDetailDto } from '../../types'

function makePedido(overrides: Partial<PedidoDetailDto> = {}): PedidoDetailDto {
  return {
    id: 42,
    proveedorNombre: 'Distribuidora Norte',
    proveedorTelefono: '+54 11 5555-1234',
    fecha: '2026-08-11T03:00:00.000Z',
    total: 1500,
    estado: 'Pendiente',
    items: [
      { id: 1, productoId: 10, productoNombre: 'Coca-Cola 1.5L', codigoBarra: '77901234', cantidadPedida: 3, precioUnitarioEstimado: 300, subtotal: 900, estado: 'Pendiente' },
      { id: 2, productoId: 20, productoNombre: 'Pepsi 2L', codigoBarra: '77905678', cantidadPedida: 2, precioUnitarioEstimado: 300, subtotal: 600, estado: 'Pendiente' },
    ],
    ...overrides,
  }
}

describe('whatsapp lib', () => {
  beforeEach(() => {
    openMock.mockReset()
  })

  describe('sanitizePhone', () => {
    it('strips non-digit chars', () => {
      expect(sanitizePhone('+54 11 5555-1234')).toBe('541155551234')
    })

    it('keeps only digits when mixed input', () => {
      expect(sanitizePhone('(011) 15-6677.88')).toBe('01115667788')
      expect(sanitizePhone('tel: +54 9 11 1234-5678')).toBe('5491112345678')
    })

    it('returns empty for no digits', () => {
      expect(sanitizePhone('---')).toBe('')
    })
  })

  describe('buildWhatsAppUrl', () => {
    it('builds web.whatsapp.com/send url with digits-only phone and encoded text', () => {
      const url = buildWhatsAppUrl('+54 11 5555-1234', 'Hola\n*Pedido*')
      expect(url).toBe('https://web.whatsapp.com/send?phone=541155551234&text=' + encodeURIComponent('Hola\n*Pedido*'))
    })

    it('encodes special chars in message', () => {
      const url = buildWhatsAppUrl('123', 'a&b=c? x')
      expect(url).toBe('https://web.whatsapp.com/send?phone=123&text=' + encodeURIComponent('a&b=c? x'))
    })
  })

  describe('buildPedidoWhatsAppMessage', () => {
    it('includes Pedido header, blank line and bulleted items', () => {
      const msg = buildPedidoWhatsAppMessage(makePedido())
      expect(msg).toContain('Pedido')
      expect(msg).toContain('• Coca-Cola 1.5L × 3')
      expect(msg).toContain('• Pepsi 2L × 2')
    })

    it('does not include proveedor, fecha, prices or total', () => {
      const msg = buildPedidoWhatsAppMessage(makePedido())
      expect(msg).not.toContain('Proveedor:')
      expect(msg).not.toContain('Fecha')
      expect(msg).not.toContain('Total')
    })
  })

  describe('openWhatsApp', () => {
    it('opens via tauri shell when available', async () => {
      openMock.mockResolvedValueOnce(undefined)
      const pedido = makePedido()
      await openWhatsApp(pedido)
      expect(openMock).toHaveBeenCalledTimes(1)
      const url = openMock.mock.calls[0][0] as string
      expect(url.startsWith('https://web.whatsapp.com/send?phone=541155551234&text=')).toBe(true)
    })

    it('falls back to window.open when tauri open throws', async () => {
      openMock.mockRejectedValueOnce(new Error('no tauri'))
      const winOpen = vi.spyOn(window, 'open').mockImplementation(() => null)
      await openWhatsApp(makePedido())
      expect(winOpen).toHaveBeenCalledTimes(1)
      const url = winOpen.mock.calls[0][0] as string
      expect(url.startsWith('https://web.whatsapp.com/send?phone=541155551234&text=')).toBe(true)
      winOpen.mockRestore()
    })

    it('does nothing when phone missing', async () => {
      const winOpen = vi.spyOn(window, 'open').mockImplementation(() => null)
      await openWhatsApp(makePedido({ proveedorTelefono: undefined }))
      expect(openMock).not.toHaveBeenCalled()
      expect(winOpen).not.toHaveBeenCalled()
      winOpen.mockRestore()
    })

    it('does nothing when phone is blank', async () => {
      const winOpen = vi.spyOn(window, 'open').mockImplementation(() => null)
      await openWhatsApp(makePedido({ proveedorTelefono: '   ' }))
      expect(openMock).not.toHaveBeenCalled()
      expect(winOpen).not.toHaveBeenCalled()
      winOpen.mockRestore()
    })
  })
})