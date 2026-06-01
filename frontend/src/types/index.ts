export interface ProductoDto {
  id: number
  codigoBarra: string
  nombre: string
  precio: number
  costo: number
  stock: number
  tamano?: string
  activo: boolean
}

export interface ProductoUpsertDto {
  codigoBarra: string
  nombre: string
  precio: number
  costo: number
  tamano?: string
}

export interface SucursalDto {
  id: number
  numero: number
  codigo: string
  nombre: string
  activo: boolean
}

export interface VentaItemDto {
  productoId: number
  cantidad: number
}

export interface VentaDto {
  sucursalId: number
  items: VentaItemDto[]
  pagos?: PagoVentaDto[]
  clienteId?: number
}

export interface VentaResultadoDto {
  ventaId: number
  fecha: string
  total: number
  pagos: PagoVentaResultDto[]
  cambio: number
}

export interface StockSucursalDto {
  productoId: number
  productoNombre: string
  codigoBarra: string
  sucursalId: number
  stock: number
  inicializado: boolean
}

export interface AjustarStockDto {
  productoId: number
  sucursalId: number
  stock: number
}

export interface VentaHistorialDto {
  ventaId: number
  fecha: string
  sucursalNombre: string
  total: number
  cantidadItems: number
}

export interface VentaDetalleDto {
  ventaId: number
  fecha: string
  sucursalId: number
  sucursalNombre: string
  total: number
  items: RenglonHistorialDto[]
}

export interface RenglonHistorialDto {
  productoId: number
  productoNombre: string
  codigoBarra: string
  cantidad: number
  precioUnitario: number
  subtotal: number
}

export interface PagedResult<T> {
  items: T[]
  totalCount: number
  page: number
  pageSize: number
  totalPages: number
}

export interface VentaHistorialParams {
  fechaDesde?: string
  fechaHasta?: string
  sucursalId?: number
  page?: number
  pageSize?: number
}

// --- Auth types ---
export interface LoginRequest {
  usuario: string
  password?: string
  pin?: string
  sucursalId: number
}

export interface LoginResponse {
  token: string
  expiresAt: string
  usuario: UsuarioInfo
}

export interface RegisterRequest {
  usuario: string
  password: string
  mail: string
  rol: string
  empresaRepresenta?: string | null
}

export interface RegisterResponse {
  id: number
  usuario: string
  mail: string
  rol: string
  usuarioResponsableId?: number | null
  empresaRepresenta?: string | null
}

export interface UsuarioInfo {
  id: number
  nombre: string
  rol: string
}

export interface UsuarioListadoDto {
  id: number
  nombreUsuario: string
  mail?: string | null
  rol: string
  usuarioResponsableId?: number | null
  usuarioResponsableNombre?: string | null
  empresaRepresenta?: string | null
  activo: boolean
  pinConfigurado: boolean
}

// --- Cliente types ---
export interface ClienteDto {
  id?: number
  nombre: string
  tipoDocumento: string
  numeroDocumento: string
  ivaCondicion: string
  telefono?: string
  domicilio?: string
  activo?: boolean
}

// --- MedioPago types ---
export interface MedioPagoDto {
  id: number
  nombre: string
  pagaVuelto: boolean
  activo: boolean
}

// --- PagoVenta types ---
export interface PagoVentaDto {
  medioPagoId: number
  monto: number
  conCambio?: number
}

export interface PagoVentaResultDto {
  medioPagoId: number
  medioPagoNombre: string
  monto: number
  conCambio?: number
  cambio: number
}

// --- Caja types ---
export interface CierrePreviewDto {
  cajaId: number
  montoInicial: number
  totalVentas: number
  totalGastos: number
  desglosePagos: PagoPorMedioDto[]
}

export interface PagoPorMedioDto {
   idMedioPago: number
   medioPago: string
   monto: number
   pagaVuelto: boolean
 }

// --- Compra types ---
export interface CompraItemDto {
   productoId: number          // 0 → create new product inline
   cantidad: number
   costoUnitario: number
   // Inline creation fields (required when productoId === 0)
   codigoBarra?: string
   nombre?: string
   precio?: number             // price to set (new product or update existing)
   costo?: number              // optional — defaults to 0 for new products
   tamano?: string
 }

 export interface NuevoProductoDto {
   codigoBarra: string
   nombre: string
   precio: number
   costo: number
   tamano?: string
 }

 export interface CompraRequestDto {
   sucursalId: number
   proveedor: string
   items: CompraItemDto[]
 }

 export interface CompraItemResultDto {
   productoId: number
   productoNombre: string
   cantidad: number
   costoUnitario: number
   subtotal: number
 }

 export interface CompraResponseDto {
   gastoId: number
   proveedor: string
   totalGasto: number
   fecha: string
   items: CompraItemResultDto[]
 }

export interface CajaDto {
  id: number
  sucursalId: number
  estado: string
  fechaApertura: string
  fechaCierre?: string
  montoInicial: number
  montoContadoEfectivo?: number
  montoContadoTarjetas?: number
  diferencia?: number
  totalVentas: number
  gastos: number
  esperado: number
  desglosePagos: PagoPorMedioDto[]
  usuarioApertura: string
  usuarioCierre?: string
}

export interface AbrirCajaRequest {
  sucursalId: number
  montoInicial: number
  observaciones?: string
}

export interface CerrarCajaRequest {
  montoContadoEfectivo: number
  montoContadoTarjetas: number
  gastos: number
  observaciones?: string
}

// --- Gasto types ---
export interface GastoDto {
  id: number
  cajaId: number
  monto: number
  detalle: string
  fecha: string
}

export interface CrearGastoRequest {
  monto: number
  detalle: string
}

export interface GastoListResponse {
  items: GastoDto[]
}
