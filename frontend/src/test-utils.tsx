import { vi } from 'vitest'

// ── api client mock ──────────────────────────────────────────────────
type MockFn = ReturnType<typeof vi.fn>

export interface MockApi {
  productos: {
    listar: MockFn
    detalle: MockFn
    obtenerPorBarra: MockFn
    crear: MockFn
    actualizar: MockFn
    lookupOpenFoodFacts: MockFn
  }
  ventas: {
    crear: MockFn
    listar: MockFn
    detalle: MockFn
  }
  compras: {
    crear: MockFn
  }
  sucursales: {
    listar: MockFn
    crear: MockFn
    actualizar: MockFn
  }
  cajas: {
    activa: MockFn
    abrir: MockFn
    cerrar: MockFn
    previewCierre: MockFn
  }
  mediosPago: { listar: MockFn }
  clientes: { listar: MockFn; crear: MockFn }
  proveedores: { listar: MockFn }
  combos: { listar: MockFn; reactivar: MockFn }
  ofertas: { listar: MockFn; reactivar: MockFn }
  categorias: { listar: MockFn }
  unidadesMedida: { listar: MockFn }
  gastos: { listar: MockFn; crear: MockFn }
}

export function createMockApi(overrides: Partial<Record<string, Record<string, MockFn>>> = {}): MockApi {
  const fn = () => vi.fn().mockResolvedValue({})

  const defaults: MockApi = {
    productos: { listar: fn(), detalle: fn(), obtenerPorBarra: fn(), crear: fn(), actualizar: fn(), lookupOpenFoodFacts: fn() },
    ventas: { crear: fn(), listar: fn(), detalle: fn() },
    compras: { crear: fn() },
    sucursales: { listar: fn(), crear: fn(), actualizar: fn() },
    cajas: { activa: fn(), abrir: fn(), cerrar: fn(), previewCierre: fn() },
    mediosPago: { listar: fn() },
    clientes: { listar: fn(), crear: fn() },
    proveedores: { listar: fn() },
    combos: { listar: fn(), reactivar: fn() },
    ofertas: { listar: fn(), reactivar: fn() },
    categorias: { listar: fn() },
    unidadesMedida: { listar: fn() },
    gastos: { listar: fn(), crear: fn() },
  }

  for (const [section, methods] of Object.entries(overrides)) {
    if (defaults[section as keyof MockApi]) {
      Object.assign(defaults[section as keyof MockApi], methods)
    }
  }

  return defaults
}

// ── useNotification mock ────────────────────────────────────────────
export function mockUseNotification() {
  return {
    current: null as { variant: string; message: string } | null,
    hasNext: false,
    notifyError: vi.fn(),
    notifySuccess: vi.fn(),
    notifyInfo: vi.fn(),
    dismiss: vi.fn(),
  }
}

// ── Storage mock ─────────────────────────────────────────────────────
export function createMockStorage(): Storage {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value }),
    removeItem: vi.fn((key: string) => { delete store[key] }),
    clear: vi.fn(() => { store = {} }),
    get length() { return Object.keys(store).length },
    key: vi.fn((index: number) => Object.keys(store)[index] ?? null),
  }
}

// ── Common test data factories ───────────────────────────────────────
export function mockProducto(overrides: Record<string, unknown> = {}) {
  return {
    id: 1, codigoBarra: '7791234567890', nombre: 'Producto Test',
    precio: 100, costo: 50, stock: 99, activo: true,
    categoriaId: 1, unidadMedidaId: 1, ...overrides,
  }
}

export function mockSucursal(overrides: Record<string, unknown> = {}) {
  return {
    id: 1, nombre: 'Central', codigo: 'CEN', numero: 1, ...overrides,
  }
}
