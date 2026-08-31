import type { ProductoDto, ProductoUpsertDto, ProductoDetailDto, SucursalDto, VentaDto, VentaResultadoDto, StockSucursalDto, CompraRequestDto, CompraResponseDto, CompraHistorialDto, CompraDetalleDto, CompraHistorialParams, VentaHistorialDto, VentaDetalleDto, PagedResult, VentaHistorialParams, LoginRequest, LoginResponse, RegisterRequest, RegisterResponse, ClienteDto, MedioPagoDto, CajaDto, AbrirCajaRequest, CerrarCajaRequest, CierrePreviewDto, GastoDto, CrearGastoRequest, GastoListResponse, UsuarioListadoDto, CambiarSuscripcionResponse, ProveedorDto, CrearProveedorRequestDto, DeudaDto, PagarDeudaRequestDto, CrearDeudaRequestDto, CategoriaDto, CrearCategoriaRequest, ActualizarCategoriaRequest, UnidadMedidaDto, CrearUnidadMedidaRequest, ActualizarUnidadMedidaRequest, ProductoLookupResponseDto, ProximoCodigoResponse, EstadisticasDto, PedidoListDto, PedidoDetailDto, PedidoRequestDto, PedidoEditDto, RecibirPedidoRequestDto, ComboDto, ComboUpsertDto, OfertaDto, OfertaUpsertDto, CategoriaGastoDto, CategoriaGastoListResponse, PagoDeudaDto, CuentaCorrienteDto, MercadoPagoEstadoDto, ProductoImportFilaDto, ProductoImportResponseDto, EmpresaDto, PreferenciasResponse } from '../types'

// Determine API base URL at runtime based on deployment context
let BASE: string;
if (typeof window !== 'undefined' && window.location) {
  if (window.location.protocol === 'http:' && window.location.hostname === 'localhost') {
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

export class SessionExpiredError extends Error {
  constructor() {
    super('La sesión venció. Iniciá sesión nuevamente.')
    this.name = 'SessionExpiredError'
  }
}

export function isSessionExpiredError(error: unknown): error is SessionExpiredError {
  return error instanceof SessionExpiredError
}

export function clearStoredSession(): void {
  localStorage.removeItem('jwt_token')
  localStorage.removeItem('jwt_expires')
  localStorage.removeItem('user_info')
}

export function expireSession(): void {
  clearStoredSession()
  window.dispatchEvent(new CustomEvent('auth:expired'))
}

export function isSessionExpired(): boolean {
  const token = localStorage.getItem('jwt_token')
  const expiresAt = localStorage.getItem('jwt_expires')
  if (!token) return false

  const expirationTime = expiresAt ? Date.parse(expiresAt) : Number.NaN
  return !Number.isFinite(expirationTime) || expirationTime <= Date.now()
}

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('jwt_token')
  if (token) {
    return { 'Authorization': `Bearer ${token}` }
  }
  return {}
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  // Do not send a known-expired token. Authentication endpoints must still work
  // so a user can sign in again after returning to the login page.
  if (isSessionExpired()) {
    expireSession()
    if (!url.startsWith('/auth/')) throw new SessionExpiredError()
  }

  const hasAuthToken = localStorage.getItem('jwt_token') !== null
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
    if (res.status === 401 && hasAuthToken) expireSession()
    let message = text
    try {
      const parsed = JSON.parse(text)
      message = parsed.error || parsed.title || parsed.message || text
    } catch {}
    const err = res.status === 401 && hasAuthToken
      ? new SessionExpiredError()
      : new Error(message)
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

  // Empresa
  empresas: {
    obtener: () => request<EmpresaDto>('/empresa'),
    actualizar: (dto: { nombre?: string; documento?: string }) =>
      request<EmpresaDto>('/empresa', { method: 'PUT', body: JSON.stringify(dto) }),
  },

  // Preferencias de usuario (clave-valor JSON por sección)
  preferencias: {
    obtener: () => request<PreferenciasResponse>('/preferencias'),
    guardar: (preferencias: Record<string, unknown>) =>
      request<PreferenciasResponse>('/preferencias', { method: 'PUT', body: JSON.stringify(preferencias) }),
  },

  // Productos
  productos: {
    listar: (sucursalId?: number, esPesable?: boolean) => {
      const params = new URLSearchParams();
      if (sucursalId) params.append('sucursalId', String(sucursalId));
      if (esPesable !== undefined) params.append('esPesable', String(esPesable));
      const query = params.toString() ? `?${params.toString()}` : '';
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
    seguirStockGlobal: (seguirStock: boolean, ids?: number[]) =>
      request<{ afectados: number }>('/productos/seguir-stock', {
        method: 'PUT',
        body: JSON.stringify({ seguirStock, ids }),
      }),
    seguirStockIndividual: (id: number, seguirStock: boolean) =>
      request<ProductoDto>(`/productos/${id}/seguir-stock`, {
        method: 'PUT',
        body: JSON.stringify({ seguirStock }),
      }),
    actualizarCantidadIdeal: (id: number, cantidadIdeal: number | null) =>
      request<ProductoDto>(`/productos/${id}/cantidad-ideal`, {
        method: 'PUT',
        body: JSON.stringify({ cantidadIdeal }),
      }),
    actualizar: (id: number, dto: ProductoUpsertDto) => request<ProductoDto>(`/productos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(dto),
    }),
    lookupOpenFoodFacts: (codigo: string) =>
      request<ProductoLookupResponseDto>(`/productos/openfoodfacts/${encodeURIComponent(codigo)}`),
    // Multipart: NO usa el helper request<T> (que fija Content-Type: application/json).
    // Usa fetch directo reutilizando BASE + getAuthHeaders (el browser setea el boundary).
    importar: async (archivo: File, sucursalId?: number, importarSinCodigo?: boolean): Promise<ProductoImportResponseDto> => {
      const form = new FormData()
      form.append('archivo', archivo)
      if (sucursalId) form.append('sucursalId', String(sucursalId))
      if (importarSinCodigo) form.append('importarSinCodigo', 'true')
      const res = await fetch(`${BASE}/productos/importar`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: form,
      })
      if (!res.ok) {
        const text = await res.text()
        let msg = text
        try { msg = JSON.parse(text).error || text } catch {}
        throw new Error(msg)
      }
      return res.json()
    },
    importarFilas: (filas: ProductoImportFilaDto[], sucursalId?: number, importarSinCodigo?: boolean) =>
      request<ProductoImportResponseDto>('/productos/importar-filas', {
        method: 'POST',
        body: JSON.stringify({ filas, sucursalId, importarSinCodigo }),
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

    deshacer: (id: number, conDevolucion: boolean) => request<{ message: string }>(`/ventas/${id}/deshacer`, {
      method: 'POST',
      body: JSON.stringify({ conDevolucion }),
    }),

    confirmarTransferencia: (id: number) => request<VentaResultadoDto>(`/ventas/${id}/confirmar-transferencia`, {
      method: 'POST',
    }),

    cancelarPendiente: (id: number, esTimeout: boolean = false) => request<{ message: string }>(`/ventas/${id}/cancelar-pendiente`, {
      method: 'POST',
      body: JSON.stringify({ esTimeout }),
    }),

    estado: (id: number) => request<{ estado: string }>(`/ventas/${id}/estado`),
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
    desactivar: (id: number) => request<void>(`/clientes/${id}`, { method: 'DELETE' }),
  },

  // Medios de pago
  mediosPago: {
    listar: () => request<MedioPagoDto[]>('/medios-pago'),
  },

  // Usuarios
  usuarios: {
    listar: () => request<UsuarioListadoDto[]>('/usuarios'),
    desactivar: (id: number) => request<void>(`/usuarios/${id}`, { method: 'DELETE' }),
    cambiarSuscripcion: (id: number, activa: boolean) => request<CambiarSuscripcionResponse>(`/usuarios/${id}/suscripcion`, {
      method: 'PUT',
      body: JSON.stringify({ activa }),
    }),
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
     desactivar: (id: number) => request<void>(`/proveedores/${id}`, { method: 'DELETE' }),
    },

// Compras
   compras: {
     crear: (dto: CompraRequestDto) => request<CompraResponseDto>('/compras/crear', {
       method: 'POST',
       body: JSON.stringify(dto),
     }),
     historial: (params: CompraHistorialParams) => {
       const query = new URLSearchParams()
       if (params.fechaDesde) query.set('fechaDesde', params.fechaDesde)
       if (params.fechaHasta) query.set('fechaHasta', params.fechaHasta)
       if (params.sucursalId) query.set('sucursalId', params.sucursalId.toString())
       if (params.page) query.set('page', params.page.toString())
       if (params.pageSize) query.set('pageSize', params.pageSize.toString())
       return request<PagedResult<CompraHistorialDto>>(`/compras?${query.toString()}`)
     },
     detalle: (id: number) =>
       request<CompraDetalleDto>(`/compras/${id}`),
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
      crear: (dto: CrearDeudaRequestDto) =>
        request<DeudaDto>('/deudas/crear', {
          method: 'POST',
          body: JSON.stringify(dto),
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
      anular: (deudaId: number) => request<{ success: boolean }>(`/deudas/${deudaId}`, { method: 'DELETE' }),
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
      editar: (id: number, dto: PedidoEditDto) => request<PedidoDetailDto>(`/pedidos/${id}`, {
        method: 'PUT',
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
      crear: (dto: CrearCategoriaRequest) =>
        request<CategoriaDto>('/categorias', {
          method: 'POST',
          body: JSON.stringify(dto),
        }),
      actualizar: (id: number, dto: ActualizarCategoriaRequest) =>
        request<CategoriaDto>(`/categorias/${id}`, {
          method: 'PUT',
          body: JSON.stringify(dto),
        }),
      eliminar: (id: number) => request<void>(`/categorias/${id}`, {
        method: 'DELETE',
      }),
      actualizarMargen: (id: number, margenGanancia: number | null) =>
        request<CategoriaDto>(`/categorias/${id}/margen`, {
          method: 'PUT',
          body: JSON.stringify({ margenGanancia }),
        }),
    },
    unidadesMedida: {
      listar: () => request<UnidadMedidaDto[]>('/unidades-medida'),
      crear: (dto: CrearUnidadMedidaRequest) =>
        request<UnidadMedidaDto>('/unidades-medida', {
          method: 'POST',
          body: JSON.stringify(dto),
        }),
      actualizar: (id: number, dto: ActualizarUnidadMedidaRequest) =>
        request<UnidadMedidaDto>(`/unidades-medida/${id}`, {
          method: 'PUT',
          body: JSON.stringify(dto),
        }),
      eliminar: (id: number) => request<void>(`/unidades-medida/${id}`, {
        method: 'DELETE',
      }),
    },

  // Estadísticas
    estadisticas: {
      obtener: (desde: string, hasta: string, sucursalId?: number) =>
        request<EstadisticasDto>('/estadisticas', {
          method: 'POST',
          body: JSON.stringify({ desde, hasta, sucursalId }),
        }),
    },

  // Dashboard Builder
    dashboard: {
      /** Build dashboard: sends layout instances, returns definitions + rendered widgets */
      build: (sucursalId: number, layout?: import('../analytics/grid/types').LayoutInstance[]) => {
        const qs = new URLSearchParams({ sucursalId: String(sucursalId) })
        return request<import('../analytics/types').DashboardResponse>(`/dashboard/build?${qs}`, {
          method: 'POST',
          body: JSON.stringify(layout ?? []),
        })
      },
      /** Get available definitions (no rendering) */
      definitions: () =>
        request<import('../analytics/types').WidgetDefinition[]>('/dashboard/definitions'),
      /** Legacy: get dashboard without instances */
      obtener: (sucursalId: number) => {
        const qs = new URLSearchParams({ sucursalId: String(sucursalId) })
        return request<import('../analytics/types').DashboardResponse>(`/dashboard?${qs}`)
      },
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

  // MercadoPago
  mercadopago: {
    authUrl: () => request<{ url: string }>('/mercadopago/auth-url'),
    estado: () => request<MercadoPagoEstadoDto>('/mercadopago/estado'),
    desvincular: () => request<{ vinculado: boolean }>('/mercadopago/desvincular', {
      method: 'POST',
    }),
    verificarPago: (monto: number) => request<{ encontrado: boolean }>('/mercadopago/verificar-pago', {
      method: 'POST',
      body: JSON.stringify({ monto }),
    }),
    qr: () => request<{ qrData?: string }>('/mercadopago/qr'),
  },
}
