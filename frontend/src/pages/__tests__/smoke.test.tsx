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

vi.mock('../../api/client', () => ({
  api: {
    sucursales: { listar: vi.fn().mockResolvedValue([]) },
    productos: { listar: vi.fn().mockResolvedValue([]), detalle: vi.fn().mockResolvedValue(null), obtenerPorBarra: vi.fn().mockResolvedValue(null), crear: vi.fn(), actualizar: vi.fn(), lookupOpenFoodFacts: vi.fn() },
    ventas: { crear: vi.fn(), listar: vi.fn(), detalle: vi.fn() },
    compras: { crear: vi.fn() },
    cajas: { activa: vi.fn().mockResolvedValue({ activa: true }), abrir: vi.fn(), cerrar: vi.fn(), previewCierre: vi.fn() },
    mediosPago: { listar: vi.fn().mockResolvedValue([]) },
    clientes: { listar: vi.fn().mockResolvedValue({ items: [] }), crear: vi.fn() },
    proveedores: { listar: vi.fn().mockResolvedValue([]) },
    combos: { listar: vi.fn().mockResolvedValue([]) },
    categorias: { listar: vi.fn().mockResolvedValue([]) },
    unidadesMedida: { listar: vi.fn().mockResolvedValue([]) },
    gastos: { listar: vi.fn(), crear: vi.fn() },
  },
}))

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
