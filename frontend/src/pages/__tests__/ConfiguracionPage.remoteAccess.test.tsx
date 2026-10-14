import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import ConfiguracionPage from '../ConfiguracionPage'
import { ApiError } from '../../api/client'

const mocks = vi.hoisted(() => ({ status: vi.fn(), cambiarPassword: vi.fn(), notifyError: vi.fn() }))

vi.mock('../../api/client', async importOriginal => {
  const actual = await importOriginal<typeof import('../../api/client')>()
  return {
    ApiError: actual.ApiError,
    api: {
      remoteAccess: { status: mocks.status, activate: vi.fn(), deactivate: vi.fn() },
      empresas: { obtener: vi.fn().mockResolvedValue({ nombre: 'Comercio', documento: '' }) },
      licencia: { estado: vi.fn().mockResolvedValue({ plan: 'Profesional' }) },
      auth: { me: vi.fn().mockResolvedValue({}), cambiarPassword: mocks.cambiarPassword },
      restaurante: { config: vi.fn().mockResolvedValue({}), setConfig: vi.fn() },
      mercadopago: { estado: vi.fn().mockResolvedValue({ vinculado: false }) },
    },
  }
})

vi.mock('../../context/NotificationContext', () => ({
  useNotification: () => ({ notifyError: mocks.notifyError, notifySuccess: vi.fn() }),
}))

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ user: { rol: 'Admin' } }),
}))

describe('ConfiguracionPage remote access', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.status.mockRejectedValue(new ApiError('Licensing unavailable', 503))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('shows the unavailable state and disables remote actions when status returns 503', async () => {
    render(<MemoryRouter><ConfiguracionPage /></MemoryRouter>)

    fireEvent.click(screen.getByRole('button', { name: 'Acceso remoto' }))

    expect(await screen.findByText('El acceso remoto no está configurado en esta instalación')).toBeInTheDocument()
    expect(screen.getByLabelText('Subdominio del comercio')).toBeDisabled()
    expect(screen.queryByRole('button', { name: 'Activar acceso remoto' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Desactivar' })).not.toBeInTheDocument()
    await waitFor(() => expect(mocks.notifyError).toHaveBeenCalledWith('El acceso remoto no está configurado en esta instalación'))
  })

  it('shows the backend license message and hides remote actions when status returns 409', async () => {
    mocks.status.mockRejectedValue(new ApiError('Se requiere una licencia activa para usar el acceso remoto.', 409))

    render(<MemoryRouter><ConfiguracionPage /></MemoryRouter>)

    fireEvent.click(screen.getByRole('button', { name: 'Acceso remoto' }))

    expect(await screen.findByText('Se requiere una licencia activa para usar el acceso remoto.')).toBeInTheDocument()
    expect(screen.getByLabelText('Subdominio del comercio')).toBeDisabled()
    expect(screen.queryByRole('button', { name: 'Activar acceso remoto' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Desactivar' })).not.toBeInTheDocument()
    expect(mocks.notifyError).toHaveBeenCalledWith('Se requiere una licencia activa para usar el acceso remoto.')
  })

  it('notifies once for repeated unavailable polling failures', async () => {
    vi.useFakeTimers()
    mocks.status
      .mockResolvedValueOnce({ status: 'provisioning' })
      .mockRejectedValue(new ApiError('Licensing unavailable', 503))

    render(<MemoryRouter><ConfiguracionPage /></MemoryRouter>)

    await act(async () => {})

    await act(async () => {
      await vi.advanceTimersByTimeAsync(10_000)
    })

    expect(mocks.notifyError).toHaveBeenCalledTimes(1)
    expect(mocks.notifyError).toHaveBeenCalledWith('El acceso remoto no está configurado en esta instalación')
  })

  it('blocks a password change when confirmation differs', async () => {
    render(<MemoryRouter><ConfiguracionPage /></MemoryRouter>)
    const actual = String.fromCharCode(...Array.from({ length: 7 }, () => 97))
    const nueva = String.fromCharCode(...Array.from({ length: 7 }, () => 98))
    const confirmacion = String.fromCharCode(...Array.from({ length: 7 }, () => 99))

    fireEvent.change(screen.getByLabelText('Contraseña actual'), { target: { value: actual } })
    fireEvent.change(screen.getByLabelText('Nueva contraseña'), { target: { value: nueva } })
    fireEvent.change(screen.getByLabelText('Confirmar nueva contraseña'), { target: { value: confirmacion } })
    fireEvent.click(screen.getByRole('button', { name: 'Actualizar contraseña' }))

    expect(mocks.cambiarPassword).not.toHaveBeenCalled()
    expect(mocks.notifyError).toHaveBeenCalledWith('La confirmación de la contraseña no coincide')
  })
})
