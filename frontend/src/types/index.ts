export interface ProductoDto {
  id: number
  codigoBarra: string
  nombre: string
  precio: number
  costo: number
  stock: number
  tamano?: string
  activo: boolean
  marca?: string | null
  contenido?: number | null
  categoriaId?: number | null
  unidadMedidaId?: number | null
  descAdicional?: string | null
  codigoProducto?: string | null
}

export interface ProductoDetailDto {
  id: number
  codigoBarra: string
  codProducto: string
  nombre: string
  precio: number
  costo: number
  stock: number
  categoria?: string
  descAdicional?: string
  contenido?: number
  unidadMedida?: string
  tamano?: string
  fechaAlta: string
  fechaUltimaMod: string
  fechaBaja?: string
  activo: boolean
}

export interface ProductoDetailDto {
  id: number
  codigoBarra: string
  codProducto: string
  nombre: string
  precio: number
  costo: number
  stock: number
  categoria?: string
  descAdicional?: string
  contenido?: number
  unidadMedida?: string
  tamano?: string
  fechaAlta: string
  fechaUltimaMod: string
  fechaBaja?: string
  activo: boolean
}

export interface CategoriaDto {
  id: number
  descripcion: string
}

export interface UnidadMedidaDto {
  id: number
  codigo: string
  descripcion: string
}

export interface ProductoUpsertDto {
  codigoBarra: string
  nombre: string
  precio: number
  costo: number
  tamano?: string
  marca?: string | null
  contenido?: number | null
  categoriaId?: number | null
  unidadMedidaId?: number | null
  descAdicional?: string | null
  codigoProducto?: string | null
}

// --- Open Food Facts ---
export interface OpenFoodFactsResultDto {
  codigoBarras: string
  descripcion: string
  marca?: string | null
  categoria?: string | null
  contenido?: number | null
  unidad?: string | null
  categoriaIdSugerido?: number | null
}

export interface ProductoLookupResponseDto {
  local: boolean
  producto?: ProductoDto | null
  encontrado: boolean
  datos?: OpenFoodFactsResultDto | null
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
  comboId?: number
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
  usuarioNombre?: string
  total: number
  cantidadItems: number
  anulada: boolean
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

// --- Proveedor types ---
export interface ProveedorDto {
  id: number
  codigo: string
  nombre: string
  tipoDocumento?: string
  nroDocumento?: string
  telefono?: string
  domicilio?: string
  mail?: string
  activo: boolean
  deudaPendiente: number
}

export interface CrearProveedorRequestDto {
  nombre: string
  tipoDocumento?: string
  nroDocumento?: string
  telefono?: string
  domicilio?: string
  mail?: string
}

// --- Compra types ---
export interface CompraItemDto {
   productoId: number          // 0 → create new product inline
   cantidad: number
   costoUnitario: number
   // Inline creation fields (required when productoId === 0)
   codigoBarra?: string
   nombre?: string
   precio?: number
   costo?: number
   categoriaId?: number
   descAdicional?: string
   contenido?: number
   unidadMedidaId?: number
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
    proveedorId: number
    userId?: number
    items: CompraItemDto[]
    montoPagado?: number
    montoPagadoCaja?: number   // when fuentePago == "dividir"
    fuentePago?: string         // "caja" | "ahorro" | "dividir"
  }

 export interface CompraItemResultDto {
   productoId: number
   productoNombre: string
   cantidad: number
   costoUnitario: number
   subtotal: number
 }

 export interface CompraResponseDto {
   compraId: number
   gastoId: number
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
  cajaId: number | null
  monto: number
  detalle: string
  fecha: string
  anulado: boolean
  usuarioNombre: string
}

export interface CrearGastoRequest {
  monto: number
  detalle: string
  fuentePago?: string         // "caja" | "ahorro" | "dividir"
  montoPagadoCaja?: number    // when fuentePago == "dividir"
}

export interface GastoListResponse {
  items: GastoDto[]
}

// --- CategoriaGasto types ---
export interface CategoriaGastoDto {
  id: number
  descripcion: string
}

export interface CategoriaGastoListResponse {
  items: CategoriaGastoDto[]
}

// --- Deuda types ---
export interface DeudaDto {
  id: number
  proveedorNombre: string
  monto: number
  fecha: string
  fechaPago?: string
  pago: boolean
  compraId?: number
  montoPagado: number
  saldoPendiente: number
}

export interface PagarDeudaRequestDto {
  monto?: number
}

export interface ProximoCodigoResponse {
  codigo: string
}

export interface EstadisticasDto {
  desde: string
  hasta: string
  totalVentas: number
  facturacion: number
  costoTotal: number
  resultadoNeto: number
  ticketPromedio: number
  mejorDia?: string
  mejorDiaFacturacion: number
  topProductos: ProductoEstadisticaDto[]
}

export interface ProductoEstadisticaDto {
  productoId: number
  productoNombre: string
  codigoBarra: string
  cantidadVendida: number
  subtotal: number
}

// --- Pedido types ---
export interface PedidoListDto {
  id: number
  proveedorNombre: string
  total: number
  fecha: string
  fechaEsperada?: string
  estado: string
  cantidadItems: number
}

export interface PedidoDetailDto {
  id: number
  proveedorNombre: string
  fecha: string
  fechaEsperada?: string
  total: number
  estado: string
  items: PedidoItemDto[]
  idPedidoOrigen?: number
}

export interface PedidoItemDto {
  id: number
  productoId: number
  productoNombre: string
  codigoBarra: string
  cantidadPedida: number
  precioUnitarioEstimado: number
  subtotal: number
  estado: string
  descripcion?: string
}

export interface PedidoRequestDto {
  sucursalId: number
  proveedorId: number
  items: PedidoItemRequestDto[]
  fechaEsperada?: string
  observaciones?: string
}

export interface PedidoItemRequestDto {
  productoId: number
  cantidad: number
  precioUnitarioEstimado: number
  descripcion?: string
}

export interface RecibirPedidoRequestDto {
  items: RecibirItemDto[]
}

export interface RecibirItemDto {
  renglonPedidoId: number
  cantidadRecibida: number
  esFaltante: boolean
  precioUnitarioReal: number
}

// --- Combo types ---
export interface ComboDto {
  id: number
  codCombo: string
  descCombo: string
  precio: number
  activo: boolean
  items: ComboItemDto[]
}

export interface ComboUpsertDto {
  codCombo: string
  descCombo: string
  precio: number
  items: ComboItemDto[]
}

export interface ComboItemDto {
  productoId: number
  cantidad: number
  productoNombre?: string | null
  codigoBarra?: string | null
}
