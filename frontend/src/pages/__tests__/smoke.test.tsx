import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest'
import { render, screen } from '@testing-library/react'

// ── Ensure storage APIs exist in test env ────────────────────────────
const storageMock = () => {
  let store: Record<string, string> = {}
  return {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => { store[k] = v },
    removeItem: (k: string) => { delete store[k] },
    clear: () => { store = {} },
    get length() { return Object.keys(store).length },
    key: (i: number) => Object.keys(store)[i] ?? null,
  }
}

beforeAll(() => {
  vi.stubGlobal('localStorage', storageMock())
  vi.stubGlobal('sessionStorage', storageMock())
})

// ── Mock all external dependencies ───────────────────────────────────
vi.mock('react-router-dom', () => ({
  useOutletContext: () => ({ sucursal: { id: 1, nombre: 'Central', codigo: 'CEN', numero: 1 } }),
}))

vi.mock('../../api/client', () => {
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

vi.mock('../../context/NotificationContext', () => ({
  useNotification: () => ({
    notifyError: vi.fn(),
    notifySuccess: vi.fn(),
    notifyInfo: vi.fn(),
    dismiss: vi.fn(),
    current: null,
    hasNext: false,
  }),
}))

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 1, nombre: 'Test', email: 'test@test.com', rol: 'Admin' },
    login: vi.fn(),
    logout: vi.fn(),
  }),
}))

// ── Smoke tests ──────────────────────────────────────────────────────

describe('VentasPage smoke', () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  it('renders without crashing', async () => {
    const { default: VentasPage } = await import('../../pages/VentasPage')
    const { container } = render(<VentasPage />)
    // Should render the main container
    expect(container.querySelector('.flex-1')).toBeTruthy()
  })

  it('shows PageShell with Ventas title', async () => {
    const { default: VentasPage } = await import('../../pages/VentasPage')
    render(<VentasPage />)
    // Wait for renders
    await vi.waitFor(() => {
      expect(screen.getByText('Ventas')).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('shows CartPanel with Productos title', async () => {
    const { default: VentasPage } = await import('../../pages/VentasPage')
    render(<VentasPage />)
    await vi.waitFor(() => {
      const titles = screen.getAllByText('Productos')
      expect(titles.length).toBeGreaterThanOrEqual(1)
    }, { timeout: 3000 })
  })
})

describe('CompraPage smoke', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('renders without crashing', async () => {
    const { default: CompraPage } = await import('../../pages/CompraPage')
    const { container } = render(<CompraPage />)
    expect(container.querySelector('.flex-1')).toBeTruthy()
  })

  it('shows PageShell with Compras title', async () => {
    const { default: CompraPage } = await import('../../pages/CompraPage')
    render(<CompraPage />)
    await vi.waitFor(() => {
      expect(screen.getByText('Compras')).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('shows CartPanel with Productos title', async () => {
    const { default: CompraPage } = await import('../../pages/CompraPage')
    render(<CompraPage />)
    await vi.waitFor(() => {
      const titles = screen.getAllByText('Productos')
      expect(titles.length).toBeGreaterThanOrEqual(1)
    }, { timeout: 3000 })
  })
})
