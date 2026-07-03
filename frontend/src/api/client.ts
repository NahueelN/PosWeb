import type { ProductoDto, ProductoUpsertDto, SucursalDto, VentaDto, VentaResultadoDto, StockSucursalDto, CompraRequestDto, CompraResponseDto, VentaHistorialDto, VentaDetalleDto, PagedResult, VentaHistorialParams, LoginRequest, LoginResponse, RegisterRequest, RegisterResponse, ClienteDto, MedioPagoDto, CajaDto, AbrirCajaRequest, CerrarCajaRequest, CierrePreviewDto, GastoDto, CrearGastoRequest, GastoListResponse, UsuarioListadoDto, ProveedorDto, CrearProveedorRequestDto, DeudaDto, PagarDeudaRequestDto, CategoriaDto, UnidadMedidaDto, ProductoLookupResponseDto, ProximoCodigoResponse, EstadisticasDto, PedidoListDto, PedidoDetailDto, PedidoRequestDto, RecibirPedidoRequestDto, ComboDto, ComboUpsertDto, OfertaDto, OfertaUpsertDto, CategoriaGastoDto, CategoriaGastoListResponse, PagoDeudaDto, CuentaCorrienteDto } from '../types'

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
      window.dispatchEvent(new CustomEvent('auth:expired'))
    }
    let message = text
    try {
      const parsed = JSON.parse(text)
      message = parsed.error || parsed.title || parsed.message || text
    } catch {}
    const err = new Error(message)
    console.error(`[API] ${res.status} ${res.statusText} — ${options?.method ?? 'GET'} ${url} (${duration}ms)`, {
      status: res.status,
      statusText: res.statusText,
      url: `${BASE}${url}`,
      responseBody: text,
      duration,
    }, err)
    throw err
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
    me: () => request<UsuarioListadoDto>('/auth/me'),
  },

  // Productos
  productos: {
    listar: (sucursalId?: number) => {
      const query = sucursalId ? `?sucursalId=${sucursalId}` : '';
      return request<ProductoDto[]>(`/productos${query}`);
    },
    buscar: (q: string) => request<ProductoDto[]>(`/productos/buscar?q=${encodeURIComponent(q)}`),
    buscarParaVenta: (q: string, sucursalId: number) =>
      request<ProductoDto[]>(`/productos/buscar-venta?q=${encodeURIComponent(q)}&sucursalId=${sucursalId}`),
    obtenerPorBarra: (codigo: string, sucursalId?: number) => {
      let url = `/productos/barra/${encodeURIComponent(codigo)}`;
      if (sucursalId) url += `?sucursalId=${sucursalId}`;
      return request<ProductoDto>(url);
    },
    detalle: (id: number) => request<ProductoDetailDto>(`/productos/${id}/detalle`),
    crear: (dto: ProductoUpsertDto) => request<ProductoDto>('/productos', {
      method: 'POST',
      body: JSON.stringify(dto),
    }),
    obtenerProximoCodigo: () => request<ProximoCodigoResponse>('/productos/proximo-codigo'),
    eliminar: (id: number) => request<void>(`/productos/${id}`, { method: 'DELETE' }),
    marcas: () => request<string[]>('/productos/marcas'),
    marcasSimilares: () => request<{ marcas: string[] }[]>('/productos/marcas-similares'),
    ajusteMarca: (marca: string, porcentaje: number) =>
      request<{ afectados: number }>('/productos/ajuste-marca', {
        method: 'PUT',
        body: JSON.stringify({ marca, porcentaje }),
      }),
    seguirStockGlobal: (seguirStock: boolean) =>
      request<{ afectados: number }>('/productos/seguir-stock', {
        method: 'PUT',
        body: JSON.stringify({ seguirStock }),
      }),
    seguirStockIndividual: (id: number, seguirStock: boolean) =>
      request<ProductoDto>(`/productos/${id}/seguir-stock`, {
        method: 'PUT',
        body: JSON.stringify({ seguirStock }),
      }),
    actualizar: (id: number, dto: ProductoUpsertDto) => request<ProductoDto>(`/productos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(dto),
    }),
    lookupOpenFoodFacts: (codigo: string) =>
      request<ProductoLookupResponseDto>(`/productos/openfoodfacts/${encodeURIComponent(codigo)}`),
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

    deshacer: (id: number, conDevolucion: boolean) => request<{ message: string }>(`/ventas/${id}/deshacer`, {
      method: 'POST',
      body: JSON.stringify({ conDevolucion }),
    }),
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
    ultimoCierre: (sucursalId: number) => request<CajaDto | null>(`/cajas/ultimo-cierre?sucursalId=${sucursalId}`),
    historial: (sucursalId: number, fechaDesde?: string, fechaHasta?: string) => {
      const params = new URLSearchParams({ sucursalId: String(sucursalId) })
      if (fechaDesde) params.set('fechaDesde', fechaDesde)
      if (fechaHasta) params.set('fechaHasta', fechaHasta)
      return request<{ items: CajaDto[] }>(`/cajas/historial?${params}`)
    },
  },

// Proveedores
   proveedores: {
     listar: (search?: string) => {
       const query = search ? `?search=${encodeURIComponent(search)}` : '';
       return request<ProveedorDto[]>(`/proveedores${query}`);
     },
     obtener: (id: number) => request<ProveedorDto>(`/proveedores/${id}`),
     crear: (dto: CrearProveedorRequestDto) => request<ProveedorDto>('/proveedores', {
       method: 'POST',
       body: JSON.stringify(dto),
     }),
     actualizar: (id: number, dto: CrearProveedorRequestDto) => request<ProveedorDto>(`/proveedores/${id}`, {
       method: 'PUT',
       body: JSON.stringify(dto),
     }),
   },

// Compras
   compras: {
     crear: (dto: CompraRequestDto) => request<CompraResponseDto>('/compras/crear', {
       method: 'POST',
       body: JSON.stringify(dto),
     }),
   },

// Gastos
    gastos: {
      listar: (cajaId: number) => request<GastoListResponse>(`/gastos?cajaId=${cajaId}`),
      historial: (excluirCajaId?: number, fechaDesde?: string, fechaHasta?: string) => {
        const params = new URLSearchParams();
        if (excluirCajaId) params.set('excluirCajaId', String(excluirCajaId));
        if (fechaDesde) params.set('fechaDesde', fechaDesde);
        if (fechaHasta) params.set('fechaHasta', fechaHasta);
        const query = params.toString() ? `?${params.toString()}` : '';
        return request<GastoListResponse>(`/gastos/historial${query}`);
      },
      crear: (dto: CrearGastoRequest) => request<GastoDto>('/gastos', {
        method: 'POST',
        body: JSON.stringify(dto),
      }),
      anular: (id: number) => request<{ message: string }>(`/gastos/${id}/anular`, { method: 'POST' }),
    },

    // Categorias de gasto
    categoriasGasto: {
      listar: () => request<CategoriaGastoListResponse>('/categorias-gasto'),
      crear: (descripcion: string) => request<CategoriaGastoDto>('/categorias-gasto', {
        method: 'POST',
        body: JSON.stringify({ descripcion }),
      }),
    },

  // Deudas
    deudas: {
      listar: (proveedorId?: number, soloPendientes?: boolean) => {
        const params = new URLSearchParams();
        if (proveedorId) params.set('proveedorId', String(proveedorId));
        if (soloPendientes) params.set('soloPendientes', 'true');
        const query = params.toString() ? `?${params.toString()}` : '';
        return request<DeudaDto[]>(`/deudas${query}`);
      },
      listarClientes: (clienteId?: number, soloPendientes?: boolean) => {
        const params = new URLSearchParams();
        if (clienteId) params.set('clienteId', String(clienteId));
        if (soloPendientes) params.set('soloPendientes', 'true');
        const qs = params.toString();
        return request<DeudaDto[]>(`/deudas/clientes${qs ? `?${qs}` : ''}`);
      },
      crearDeudaCliente: (clienteId: number, ventaId: number, monto: number, montoPagado?: number) =>
        request<DeudaDto>(`/deudas/clientes/crear`, {
          method: 'POST',
          body: JSON.stringify({ clienteId, ventaId, monto, montoPagado }),
        }),
      obtener: (id: number) => request<DeudaDto>(`/deudas/${id}`),
      pagar: (id: number, monto?: number) => {
        const body: PagarDeudaRequestDto = monto !== undefined ? { monto } : {};
        return request<DeudaDto>(`/deudas/${id}/pagar`, {
          method: 'POST',
          body: JSON.stringify(body),
        });
      },
      pagarMultiple: (proveedorId: number, monto: number) =>
        request<DeudaDto[]>(`/deudas/pagar-multiple`, {
          method: 'POST',
          body: JSON.stringify({ proveedorId, monto }),
        }),
      pagarMultipleCliente: (clienteId: number, monto: number) =>
        request<DeudaDto[]>(`/deudas/pagar-multiple-cliente`, {
          method: 'POST',
          body: JSON.stringify({ clienteId, monto }),
        }),
      pagos: (params: { clienteId?: number; proveedorId?: number }) => {
        const q = new URLSearchParams();
        if (params.clienteId) q.set('clienteId', String(params.clienteId));
        if (params.proveedorId) q.set('proveedorId', String(params.proveedorId));
        return request<PagoDeudaDto[]>(`/deudas/pagos?${q}`);
      },
      cuentaCorriente: (params: { clienteId?: number; proveedorId?: number }) => {
        const q = new URLSearchParams();
        if (params.clienteId) q.set('clienteId', String(params.clienteId));
        if (params.proveedorId) q.set('proveedorId', String(params.proveedorId));
        return request<CuentaCorrienteDto>(`/deudas/cuenta-corriente?${q}`);
      },
      deshacerPago: (pagoId: number) => request<{ success: boolean }>(`/deudas/pagos/${pagoId}`, { method: 'DELETE' }),
    },

  // Pedidos
    pedidos: {
      listar: (proveedor?: string, estado?: string) => {
        const params = new URLSearchParams();
        if (proveedor) params.set('proveedor', proveedor);
        if (estado) params.set('estado', estado);
        const query = params.toString() ? `?${params.toString()}` : '';
        return request<PedidoListDto[]>(`/pedidos${query}`);
      },
      obtener: (id: number) => request<PedidoDetailDto>(`/pedidos/${id}`),
      crear: (dto: PedidoRequestDto) => request<PedidoDetailDto>('/pedidos', {
        method: 'POST',
        body: JSON.stringify(dto),
      }),
      recibir: (id: number, dto: RecibirPedidoRequestDto) => request<PedidoDetailDto>(`/pedidos/${id}/recibir`, {
        method: 'POST',
        body: JSON.stringify(dto),
      }),
      cancelar: (id: number) => request<void>(`/pedidos/${id}/cancelar`, {
        method: 'POST',
      }),
    },

  // Lookups
    categorias: {
      listar: () => request<CategoriaDto[]>('/categorias'),
      actualizarMargen: (id: number, margenGanancia: number | null) =>
        request<CategoriaDto>(`/categorias/${id}/margen`, {
          method: 'PUT',
          body: JSON.stringify({ margenGanancia }),
        }),
    },
    unidadesMedida: {
      listar: () => request<UnidadMedidaDto[]>('/unidades-medida'),
    },

  // Estadísticas
    estadisticas: {
      obtener: (desde: string, hasta: string, sucursalId?: number) =>
        request<EstadisticasDto>('/estadisticas', {
          method: 'POST',
          body: JSON.stringify({ desde, hasta, sucursalId }),
        }),
    },

  // Combos
    combos: {
      listar: () => request<ComboDto[]>('/combos'),
      obtenerPorId: (id: number) => request<ComboDto>(`/combos/${id}`),
      obtenerPorCodigo: (codigo: string) => request<ComboDto>(`/combos/codigo/${encodeURIComponent(codigo)}`),
      crear: (dto: ComboUpsertDto) => request<ComboDto>('/combos', {
        method: 'POST',
        body: JSON.stringify(dto),
      }),
      actualizar: (id: number, dto: ComboUpsertDto) => request<ComboDto>(`/combos/${id}`, {
        method: 'PUT',
        body: JSON.stringify(dto),
      }),
      eliminar: (id: number) => request<void>(`/combos/${id}`, { method: 'DELETE' }),
      reactivar: (id: number) => request<void>(`/combos/${id}/reactivar`, { method: 'POST' }),
      eliminarDefinitivo: (id: number) => request<void>(`/combos/${id}/definitivo`, { method: 'DELETE' }),
    },

  // Ofertas
    ofertas: {
      listar: () => request<OfertaDto[]>('/ofertas'),
      obtenerPorId: (id: number) => request<OfertaDto>(`/ofertas/${id}`),
      crear: (dto: OfertaUpsertDto) => request<OfertaDto>('/ofertas', {
        method: 'POST',
        body: JSON.stringify(dto),
      }),
      actualizar: (id: number, dto: OfertaUpsertDto) => request<OfertaDto>(`/ofertas/${id}`, {
        method: 'PUT',
        body: JSON.stringify(dto),
      }),
      eliminar: (id: number) => request<void>(`/ofertas/${id}`, { method: 'DELETE' }),
      reactivar: (id: number) => request<void>(`/ofertas/${id}/reactivar`, { method: 'POST' }),
      eliminarDefinitivo: (id: number) => request<void>(`/ofertas/${id}/definitivo`, { method: 'DELETE' }),
    },
}
