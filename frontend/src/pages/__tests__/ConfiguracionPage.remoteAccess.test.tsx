import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import ConfiguracionPage from '../ConfiguracionPage'

const mocks = vi.hoisted(() => ({ status: vi.fn(), notifyError: vi.fn() }))

vi.mock('../../api/client', () => ({
  api: {
    remoteAccess: { status: mocks.status, activate: vi.fn(), deactivate: vi.fn() },
    empresas: { obtener: vi.fn().mockResolvedValue({ nombre: 'Comercio', documento: '' }) },
    licencia: { estado: vi.fn().mockResolvedValue({ plan: 'Profesional' }) },
    auth: { me: vi.fn().mockResolvedValue({}) },
    restaurante: { config: vi.fn().mockResolvedValue({}), setConfig: vi.fn() },
    mercadopago: { estado: vi.fn().mockResolvedValue({ vinculado: false }) },
  },
}))

vi.mock('../../context/NotificationContext', () => ({
  useNotification: () => ({ notifyError: mocks.notifyError, notifySuccess: vi.fn() }),
}))

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ user: { rol: 'Admin' } }),
}))

describe('ConfiguracionPage remote access', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.status.mockRejectedValue(Object.assign(new Error('Licensing unavailable'), { status: 503 }))
  })

  it('shows the unavailable state and disables remote actions when status returns 503', async () => {
    render(<MemoryRouter><ConfiguracionPage /></MemoryRouter>)

    fireEvent.click(screen.getByRole('button', { name: 'Acceso remoto' }))

    expect(await screen.findByText('El acceso remoto no está disponible en este momento.')).toBeInTheDocument()
    expect(screen.getByLabelText('Subdominio del comercio')).toBeDisabled()
    expect(screen.queryByRole('button', { name: 'Activar acceso remoto' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Desactivar' })).not.toBeInTheDocument()
    await waitFor(() => expect(mocks.notifyError).toHaveBeenCalledWith('El acceso remoto no está disponible en este momento.'))
  })
})
