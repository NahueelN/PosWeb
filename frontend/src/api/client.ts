import type { ProductoDto, ProductoUpsertDto, SucursalDto, VentaDto, VentaResultadoDto, StockSucursalDto, CompraRequestDto, CompraResponseDto, VentaHistorialDto, VentaDetalleDto, PagedResult, VentaHistorialParams, LoginRequest, LoginResponse, RegisterRequest, RegisterResponse, ClienteDto, MedioPagoDto, CajaDto, AbrirCajaRequest, CerrarCajaRequest, CierrePreviewDto, UsuarioListadoDto } from '../types'

// Determine API base URL at runtime based on deployment context
let BASE: string;
if (typeof window !== 'undefined' && window.location) {
  if (window.location.protocol === 'http:' || window.location.protocol === 'https:') {
    BASE = '/api';
  } else {
    BASE = 'http://localhost:5196/api';
  }
} else {
  BASE = 'http://localhost:5196/api';
}

/**
 * Wait for the backend to become available.
 */
export async function esperarBackend(maxRetries = 30, delayMs = 500): Promise<void> {
  console.log('[Startup] Attempting to connect to backend...')
  
  for (let i = 0; i < maxRetries; i++) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 2000)

    try {
      const res = await fetch(`${BASE}/sucursales`, { signal: controller.signal })
      if (res.ok) {
        console.log('[Startup] Successfully connected to backend')
        return
      }
    } catch (error) {
      if (i === maxRetries - 1) {
        const message = error instanceof Error ? error.message : String(error)
        console.error('[Startup] Failed to connect to backend after all retries:', message)
      }
    } finally {
      clearTimeout(timeoutId)
    }

    await new Promise(r => setTimeout(r, delayMs))
  }
  
  throw new Error('El backend no está disponible')
}

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('jwt_token')
  if (token) {
    return { 'Authorization': `Bearer ${token}` }
  }
  return {}
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const startTime = Date.now()
  console.log(`[API Request] ${options?.method ?? 'GET'} ${url}`)

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...getAuthHeaders(),
  }

  // Merge custom headers
  if (options?.headers) {
    Object.assign(headers, options.headers)
  }

  const res = await fetch(`${BASE}${url}`, {
    ...options,
    headers,
  })

  const duration = Date.now() - startTime
  
  if (!res.ok) {
    const text = await res.text()
    // If 401, clear token (session expired)
    if (res.status === 401) {
      localStorage.removeItem('jwt_token')
      localStorage.removeItem('jwt_expires')
      localStorage.removeItem('user_info')
    }
    console.error(`[API Error] ${options?.method ?? 'GET'} ${url} - ${res.status} ${res.statusText}: ${text} (${duration}ms)`)
    throw new Error(`${res.status} ${res.statusText}: ${text}`)
  }

  console.log(`[API Success] ${options?.method ?? 'GET'} ${url} - ${res.status} (${duration}ms)`)
  
  if (res.status === 204) return undefined as T
  return res.json()
}

export const api = {
  // Auth
  auth: {
    login: (dto: LoginRequest) => request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(dto),
    }),
    pinLogin: (dto: LoginRequest) => request<LoginResponse>('/auth/pin', {
      method: 'POST',
      body: JSON.stringify(dto),
    }),
    register: (dto: RegisterRequest) => request<RegisterResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(dto),
    }),
  },

  // Productos
  productos: {
    listar: () => request<ProductoDto[]>('/productos'),
    buscar: (q: string) => request<ProductoDto[]>(`/productos/buscar?q=${encodeURIComponent(q)}`),
    buscarParaVenta: (q: string, sucursalId: number) =>
      request<ProductoDto[]>(`/productos/buscar-venta?q=${encodeURIComponent(q)}&sucursalId=${sucursalId}`),
    obtenerPorBarra: (codigo: string, sucursalId?: number) => {
      let url = `/productos/barra/${encodeURIComponent(codigo)}`;
      if (sucursalId) url += `?sucursalId=${sucursalId}`;
      return request<ProductoDto>(url);
    },
    crear: (dto: ProductoUpsertDto) => request<ProductoDto>('/productos', {
      method: 'POST',
      body: JSON.stringify(dto),
    }),
    eliminar: (id: number) => request<void>(`/productos/${id}`, { method: 'DELETE' }),
    actualizar: (id: number, dto: ProductoUpsertDto) => request<ProductoDto>(`/productos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(dto),
    }),
  },

  // Sucursales
  sucursales: {
    listar: () => request<SucursalDto[]>('/sucursales'),
    obtenerPorId: (id: number) => request<SucursalDto>(`/sucursales/${id}`),
    crear: (dto: Partial<SucursalDto>) => request<SucursalDto>('/sucursales', {
      method: 'POST',
      body: JSON.stringify(dto),
    }),
    eliminar: (id: number) => request<void>(`/sucursales/${id}`, { method: 'DELETE' }),
  },

  // Ventas
  ventas: {
    crear: (dto: VentaDto) => request<VentaResultadoDto>('/ventas', {
      method: 'POST',
      body: JSON.stringify(dto),
    }),

    historial: (params: VentaHistorialParams) => {
      const query = new URLSearchParams()
      if (params.fechaDesde) query.set('fechaDesde', params.fechaDesde)
      if (params.fechaHasta) query.set('fechaHasta', params.fechaHasta)
      if (params.sucursalId) query.set('sucursalId', params.sucursalId.toString())
      if (params.page) query.set('page', params.page.toString())
      if (params.pageSize) query.set('pageSize', params.pageSize.toString())
      return request<PagedResult<VentaHistorialDto>>(`/ventas?${query.toString()}`)
    },

    detalle: (id: number) =>
      request<VentaDetalleDto>(`/ventas/${id}`),
  },

  // Stock por sucursal
  stock: {
    listar: (sucursalId: number) =>
      request<StockSucursalDto[]>(`/stock?sucursalId=${sucursalId}`),

    bajoStock: (sucursalId: number, limite: number = 5) =>
      request<StockSucursalDto[]>(`/stock/bajo?sucursalId=${sucursalId}&limite=${limite}`),

    ajustar: (productoId: number, sucursalId: number, stock: number) =>
      request<void>(`/stock/ajustar`, {
        method: 'PUT',
        body: JSON.stringify({ productoId, sucursalId, stock }),
      }),
  },

  // Clientes
  clientes: {
    listar: (q?: string, page: number = 1, pageSize: number = 20) => {
      const query = new URLSearchParams()
      if (q) query.set('q', q)
      query.set('page', page.toString())
      query.set('pageSize', pageSize.toString())
      return request<PagedResult<ClienteDto>>(`/clientes?${query.toString()}`)
    },
    obtener: (id: number) => request<ClienteDto>(`/clientes/${id}`),
    crear: (dto: ClienteDto) => request<ClienteDto>('/clientes', {
      method: 'POST',
      body: JSON.stringify(dto),
    }),
    actualizar: (id: number, dto: ClienteDto) => request<ClienteDto>(`/clientes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(dto),
    }),
  },

  // Medios de pago
  mediosPago: {
    listar: () => request<MedioPagoDto[]>('/medios-pago'),
  },

  // Usuarios
  usuarios: {
    listar: () => request<UsuarioListadoDto[]>('/usuarios'),
  },

  // Cajas
  cajas: {
    activa: (sucursalId: number) => request<{ caja: CajaDto | null; activa: boolean }>(`/cajas/activa?sucursalId=${sucursalId}`),
    abrir: (dto: AbrirCajaRequest) => request<CajaDto>('/cajas/abrir', {
      method: 'POST',
      body: JSON.stringify(dto),
    }),
    cerrar: (cajaId: number, dto: CerrarCajaRequest) => request<CajaDto>(`/cajas/cerrar?cajaId=${cajaId}`, {
      method: 'POST',
      body: JSON.stringify(dto),
    }),
    previewCierre: (cajaId: number) => request<CierrePreviewDto>(`/cajas/${cajaId}/preview-cierre`),
  },

// Compras
   compras: {
     crear: (dto: CompraRequestDto) => request<CompraResponseDto>('/compras/crear', {
       method: 'POST',
       body: JSON.stringify(dto),
     }),
   },
}
