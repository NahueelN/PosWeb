import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import AyudaPage from '../AyudaPage'

function renderAyuda(key?: string) {
  const url = key ? `/ayuda?key=${key}` : '/ayuda'
  return render(
    <MemoryRouter initialEntries={[url]}>
      <AyudaPage />
    </MemoryRouter>
  )
}

describe('AyudaPage', () => {
  it('muestra el índice de módulos', () => {
    renderAyuda()
    expect(screen.getByText('Ayuda')).toBeInTheDocument()
    expect(screen.getByText('Ventas')).toBeInTheDocument()
    expect(screen.getByText('Productos')).toBeInTheDocument()
  })

  it('abre la definición del concepto solicitado via ?key', () => {
    renderAyuda('concepto-bulto')
    expect(screen.getByText('Producto bulto')).toBeInTheDocument()
    expect(screen.getByText(/representa un empaque/)).toBeInTheDocument()
  })

  it('muestra las capturas en conceptos con imagenes', () => {
    renderAyuda('concepto-pesable')
    expect(screen.getByText(/Capturas \(2\)/)).toBeInTheDocument()
    expect(screen.queryByText('Captura pendiente')).not.toBeInTheDocument()
  })

  it('muestra la tarjeta de captura pendiente en conceptos sin imagen pero con necesitaImagen', () => {
    renderAyuda('concepto-multipago')
    expect(screen.getByText('Captura pendiente')).toBeInTheDocument()
  })

  it('no muestra captura pendiente en conceptos simples', () => {
    renderAyuda('concepto-venta')
    expect(screen.queryByText('Captura pendiente')).not.toBeInTheDocument()
  })
})