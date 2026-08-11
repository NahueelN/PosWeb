import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

// ── Mocks ─────────────────────────────────────────────────────────────
const listenMock = vi.fn()
const invokeMock = vi.fn()

vi.mock('@tauri-apps/api/event', () => ({
  listen: (...args: unknown[]) => listenMock(...args),
}))

vi.mock('@tauri-apps/api/core', () => ({
  invoke: (...args: unknown[]) => invokeMock(...args),
}))

vi.mock('../../context/NotificationContext', () => ({
  useNotification: () => ({
    notifyError: vi.fn(),
    notifySuccess: vi.fn(),
    notifyInfo: vi.fn(),
    dismiss: vi.fn(),
  }),
}))

// ── Helpers ───────────────────────────────────────────────────────────
function setTauriPresent(present: boolean) {
  const w = window as unknown as { __TAURI_INTERNALS__?: unknown; __TAURI__?: unknown }
  if (present) {
    w.__TAURI_INTERNALS__ = {}
  } else {
    delete w.__TAURI_INTERNALS__
    delete w.__TAURI__
  }
}

let capturedCallback: ((event: unknown) => void) | undefined

// ── Tests ─────────────────────────────────────────────────────────────

describe('CloseConfirm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    capturedCallback = undefined
    listenMock.mockImplementation(async (event: string, cb: (e: unknown) => void) => {
      void event
      capturedCallback = cb
      return () => {}
    })
    invokeMock.mockResolvedValue(undefined)
  })

  it('does nothing in browser mode (no Tauri)', async () => {
    setTauriPresent(false)
    const { default: CloseConfirm } = await import('../CloseConfirm')
    render(<CloseConfirm />)
    expect(listenMock).not.toHaveBeenCalled()
    expect(screen.queryByText('Cerrar aplicación')).toBeNull()
  })

  it('listens for app-close-requested in Tauri mode', async () => {
    setTauriPresent(true)
    const { default: CloseConfirm } = await import('../CloseConfirm')
    render(<CloseConfirm />)
    await waitFor(() => {
      expect(listenMock).toHaveBeenCalled()
    })
    expect(listenMock.mock.calls[0][0]).toBe('app-close-requested')
  })

  it('shows the confirmation dialog when close is requested', async () => {
    setTauriPresent(true)
    const { default: CloseConfirm } = await import('../CloseConfirm')
    render(<CloseConfirm />)
    await waitFor(() => {
      expect(capturedCallback).toBeTruthy()
    })
    expect(screen.queryByText('Cerrar aplicación')).toBeNull()

    capturedCallback?.({})
    expect(await screen.findByText('Cerrar aplicación')).toBeInTheDocument()
  })

  it('invokes confirm_exit when "Cerrar" is pressed', async () => {
    setTauriPresent(true)
    const { default: CloseConfirm } = await import('../CloseConfirm')
    render(<CloseConfirm />)
    await waitFor(() => {
      expect(capturedCallback).toBeTruthy()
    })
    capturedCallback?.({})
    fireEvent.click(await screen.findByText('Cerrar'))
    await waitFor(() => {
      expect(invokeMock).toHaveBeenCalledWith('confirm_exit')
    })
  })

  it('does not close the app when "Cancelar" is pressed', async () => {
    setTauriPresent(true)
    const { default: CloseConfirm } = await import('../CloseConfirm')
    render(<CloseConfirm />)
    await waitFor(() => {
      expect(capturedCallback).toBeTruthy()
    })
    capturedCallback?.({})
    fireEvent.click(await screen.findByRole('button', { name: 'Cancelar' }))
    await waitFor(() => {
      expect(invokeMock).not.toHaveBeenCalled()
    })
    expect(screen.queryByText('Cerrar aplicación')).toBeNull()
  })
})
