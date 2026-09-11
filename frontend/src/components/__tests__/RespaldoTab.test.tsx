import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { api } from '../../api/client'
import RespaldoTab from '../RespaldoTab'

vi.mock('../../api/client', () => ({
  clearStoredSession: vi.fn(),
  api: {
    respaldos: {
      exportar: vi.fn(),
      importar: vi.fn(),
      validar: vi.fn(),
    },
  },
}))

vi.mock('../../context/NotificationContext', () => ({
  useNotification: () => ({ notifyError: vi.fn(), notifySuccess: vi.fn() }),
}))

describe('RespaldoTab', () => {
  it('shows a destructive warning before allowing a restore', async () => {
    const user = userEvent.setup()
    const { container } = render(<RespaldoTab />)
    const fileInput = container.querySelector<HTMLInputElement>('input[type="file"]')

    await user.upload(fileInput!, new File(['backup'], 'posweb-20261009-2030.posweb-backup'))

    expect(screen.getByText(/se eliminan todos los datos locales actuales/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Restaurar y reemplazar datos' })).toBeEnabled()
  })

  it('shows the backup company before restoring', async () => {
    const user = userEvent.setup()
    vi.mocked(api.respaldos.validar).mockResolvedValue({
      nombre: 'Almacén Central',
      documento: '30123456789',
      direccion: 'Av. Siempre Viva 123',
    })
    const { container } = render(<RespaldoTab />)
    const fileInput = container.querySelector<HTMLInputElement>('input[type="file"]')

    await user.upload(fileInput!, new File(['backup'], 'posweb-20261009-2030.posweb-backup'))
    await user.click(screen.getByRole('button', { name: 'Restaurar y reemplazar datos' }))

    expect(await screen.findByText('Almacén Central')).toBeInTheDocument()
    expect(screen.getByText(/Documento: 30123456789/)).toBeInTheDocument()
    expect(screen.getByText(/Dirección: Av\. Siempre Viva 123/)).toBeInTheDocument()
    expect(screen.getByText(/Exportado: 09\/10\/2026 20:30/)).toBeInTheDocument()
  })
})
