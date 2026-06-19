using Microsoft.EntityFrameworkCore;
using PosWeb.Application.Exceptions;
using PosWeb.Application.StockSucursales;
using PosWeb.Contracts;
using PosWeb.Data;
using PosWeb.Domain;

namespace PosWeb.Application.Ventas;

public class VentaService
{
    private readonly PosDbContext _context;
    private readonly StockSucursalService _stockSucursalService;

    public VentaService(PosDbContext context, StockSucursalService stockSucursalService)
    {
        _context = context;
        _stockSucursalService = stockSucursalService;
    }

    public VentaResultadoDto CrearVenta(VentaDto dto, int? usuarioId = null)
    {
        if (dto.Items == null || dto.Items.Count == 0)
        {
            throw new VentaSinItemsException();
        }

        Sucursal? sucursal = _context.Sucursal.Find(dto.SucursalId);

        if (sucursal == null)
        {
            throw new SucursalNoExisteException(dto.SucursalId);
        }

        if (!sucursal.ACTIVO)
        {
            throw new SucursalInactivaException(dto.SucursalId);
        }

        // Check active caja — each user has their own caja
        Caja? cajaActiva;
        if (usuarioId.HasValue)
        {
            cajaActiva = _context.Caja
                .FirstOrDefault(c => c.ID_USUARIO_APERTURA == usuarioId.Value && c.ESTADO == "Abierta");
        }
        else
        {
            // Fallback for anonymous scenarios
            cajaActiva = _context.Caja
                .FirstOrDefault(c => c.ID_SUCURSAL == dto.SucursalId && c.ESTADO == "Abierta");
        }

        if (cajaActiva == null)
        {
            throw new VentaSinCajaActivaException();
        }

        decimal totalPagos = 0;
        List<(int medioPagoId, decimal monto, decimal? conCambio)> pagosData = new();

        if (dto.Pagos is { Count: > 0 })
        {
            foreach (var pago in dto.Pagos)
            {
                if (pago.Monto <= 0)
                {
                    throw new MedioPagoInvalidoException("Monto inválido");
                }

                MedioPago? medio = _context.MedioPago.Find(pago.MedioPagoId);
                if (medio == null)
                {
                    throw new MedioPagoInvalidoException(pago.MedioPagoId);
                }

                if (!medio.ACTIVO)
                {
                    throw new MedioPagoInvalidoException($"Medio de pago inactivo (ID: {pago.MedioPagoId})");
                }

                if (pago.ConCambio.HasValue && pago.ConCambio.Value < pago.Monto)
                {
                    throw new MedioPagoInvalidoException("El monto recibido debe ser mayor o igual al monto del pago");
                }

                totalPagos += pago.Monto;
                pagosData.Add((pago.MedioPagoId, pago.Monto, pago.ConCambio));
            }
        }

        Venta venta = new Venta(dto.SucursalId, usuarioId);
        venta.AsignarCliente(dto.ClienteId);

        foreach (VentaItemDto item in dto.Items)
        {
            if (item.ComboId.HasValue && item.ComboId.Value > 0)
            {
                var combo = _context.Combo
                    .Include(c => c.ITEMS)
                    .FirstOrDefault(c => c.ID_COMBO == item.ComboId.Value && c.ACTIVO)
                    ?? throw new InvalidOperationException($"Combo con ID {item.ComboId} no encontrado o inactivo");

                foreach (var citem in combo.ITEMS)
                {
                    Producto? cproducto = _context.Producto.Find(citem.ID_PRODUCTO);
                    if (cproducto == null)
                        throw new ProductoNoExisteException(citem.ID_PRODUCTO);
                    if (!cproducto.ACTIVO)
                        throw new ProductoInactivoException(citem.ID_PRODUCTO);

                    StockSucursal? cstock = _context.StockSucursal
                        .FirstOrDefault(s => s.ID_PRODUCTO == citem.ID_PRODUCTO && s.ID_SUCURSAL == dto.SucursalId);

                    decimal cantidadNecesaria = citem.CANTIDAD * item.Cantidad;
                    int cdisponible = (int)(cstock?.STOCK ?? 0);

                    if (cdisponible < cantidadNecesaria)
                    {
                        throw new StockSucursalInsuficienteException(
                            cproducto.DESC_PRODUCTO,
                            dto.SucursalId,
                            cdisponible,
                            (int)cantidadNecesaria
                        );
                    }

                    cstock!.DescontarStock(cantidadNecesaria);
                    venta.AgregarRenglonCombo(combo, citem.ID_PRODUCTO, cantidadNecesaria, 0);
                }

                venta.AgregarRenglonCombo(combo, 0, item.Cantidad, combo.PRECIO);
            }
            else
            {
                Producto? producto = _context.Producto.Find(item.ProductoId);

                if (producto == null)
                {
                    throw new ProductoNoExisteException(item.ProductoId);
                }

                if (!producto.ACTIVO)
                {
                    throw new ProductoInactivoException(item.ProductoId);
                }

                StockSucursal? stockSuc = _context.StockSucursal
                    .FirstOrDefault(s => s.ID_PRODUCTO == item.ProductoId && s.ID_SUCURSAL == dto.SucursalId);

                int available = (int)(stockSuc?.STOCK ?? 0);

                if (available < item.Cantidad)
                {
                    throw new StockSucursalInsuficienteException(
                        producto.DESC_PRODUCTO,
                        dto.SucursalId,
                        available,
                        item.Cantidad
                    );
                }

                stockSuc!.DescontarStock(item.Cantidad);
                venta.AgregarRenglon(producto, item.Cantidad);
            }
        }

        // Validate payment total against sale total
        decimal totalVenta = venta.TOTAL;
        bool isPartialPayment = dto.ClienteId.HasValue && totalPagos < totalVenta - 0.01m;

        if (pagosData.Count > 0 && !isPartialPayment)
        {
            if (Math.Abs(totalPagos - totalVenta) > 0.01m)
            {
                // Check if it's a cash payment with extra (change scenario)
                bool hasCashExtra = pagosData.Any(p =>
                {
                    var medio = _context.MedioPago.Find(p.medioPagoId);
                    return medio?.PAGA_VUELTO == true && p.conCambio.HasValue && p.conCambio > p.monto;
                });

                if (!hasCashExtra)
                {
                    throw new PagoSumaInvalidaException(totalPagos, totalVenta);
                }

                // Recalculate: cash overpayment is OK as long as the "real" payment covers the total
                decimal realPayment = pagosData.Sum(p =>
                {
                    var medio = _context.MedioPago.Find(p.medioPagoId);
                    if (medio?.PAGA_VUELTO == true && p.conCambio.HasValue)
                    {
                        return p.conCambio.Value;
                    }
                    return p.monto;
                });

                if (realPayment < totalVenta)
                {
                    throw new PagoSumaInvalidaException(realPayment, totalVenta);
                }
            }
        }

        _context.Venta.Add(venta);
        _context.SaveChanges();

        // Persist Pago records
        decimal cambioTotal = 0;
        var pagosResult = new List<PagoVentaResultDto>();

        if (pagosData.Count > 0)
        {
            foreach (var (medioPagoId, monto, conCambio) in pagosData)
            {
                var pago = new Pago(
                    venta.ID_VENTA,
                    medioPagoId,
                    monto,
                    usuarioId ?? 0,
                    cajaActiva.ID_CAJA,
                    conCambio
                );

                _context.Pago.Add(pago);

                string medioNombre = _context.MedioPago
                    .Where(m => m.ID_MEDIO_PAGO == medioPagoId)
                    .Select(m => m.DESC_MEDIO_PAGO)
                    .FirstOrDefault() ?? "";

                cambioTotal += pago.CAMBIO;

                pagosResult.Add(new PagoVentaResultDto
                {
                    MedioPagoId = medioPagoId,
                    MedioPagoNombre = medioNombre,
                    Monto = pago.MONTO,
                    ConCambio = conCambio,
                    Cambio = pago.CAMBIO
                });
            }

            _context.SaveChanges();
        }

        // Auto-create client debt for partial payments
        int? deudaId = null;
        decimal? deudaMonto = null;
        if (isPartialPayment && dto.ClienteId.HasValue)
        {
            deudaMonto = totalVenta - totalPagos;
            var deuda = new Deuda(deudaMonto.Value, idCliente: dto.ClienteId.Value, idVenta: venta.ID_VENTA, montoPagado: totalPagos);
            _context.Deuda.Add(deuda);
            _context.SaveChanges();
            deudaId = deuda.ID_DEUDA;
        }

        string? clienteNombre = null;
        if (dto.ClienteId.HasValue)
        {
            var cli = _context.Cliente.Find(dto.ClienteId.Value);
            clienteNombre = cli?.NOMBRE;
        }

        return new VentaResultadoDto
        {
            VentaId = venta.ID_VENTA,
            Fecha = venta.FECHA_VENTA,
            Total = venta.TOTAL,
            Pagos = pagosResult,
            Cambio = cambioTotal,
            ClienteId = dto.ClienteId,
            ClienteNombre = clienteNombre,
            DeudaId = deudaId,
            DeudaMonto = deudaMonto
        };
    }

    public async Task<bool> ExisteSucursalAsync(int sucursalId)
    {
        return await _context.Sucursal.AnyAsync(s => s.ID_SUCURSAL == sucursalId);
    }

    public async Task<PagedResult<VentaHistorialDto>> ObtenerHistorialAsync(VentaHistorialFiltro filtro)
    {
        IQueryable<Venta> query = _context.Venta
            .OrderByDescending(v => v.FECHA_VENTA);

        if (filtro.FechaDesde.HasValue)
            query = query.Where(v => v.FECHA_VENTA >= filtro.FechaDesde.Value);

        if (filtro.FechaHasta.HasValue)
            query = query.Where(v => v.FECHA_VENTA <= filtro.FechaHasta.Value);

        if (filtro.SucursalId.HasValue)
            query = query.Where(v => v.ID_SUCURSAL == filtro.SucursalId.Value);

        var totalCount = await query.CountAsync();

        var items = await query
            .Skip((filtro.Page - 1) * filtro.PageSize)
            .Take(filtro.PageSize)
            .Select(v => new VentaHistorialDto
            {
                VentaId = v.ID_VENTA,
                Fecha = v.FECHA_VENTA,
                SucursalNombre = _context.Sucursal
                    .Where(s => s.ID_SUCURSAL == v.ID_SUCURSAL)
                    .Select(s => s.DESC_SUCURSAL)
                    .FirstOrDefault(),
                UsuarioNombre = _context.Usuario
                    .Where(u => u.ID_USUARIO == v.ID_USUARIO)
                    .Select(u => u.NOMBRE_USUARIO)
                    .FirstOrDefault(),
                Total = v.TOTAL,
                CantidadItems = v.RENGLONES.Count,
                Anulada = v.ANULADA
            })
            .ToListAsync();

        return new PagedResult<VentaHistorialDto>
        {
            Items = items,
            TotalCount = totalCount,
            Page = filtro.Page,
            PageSize = filtro.PageSize
        };
    }

    public async Task<VentaDetalleDto?> ObtenerDetalleAsync(int ventaId)
    {
        Venta? venta = await _context.Venta.FindAsync(ventaId);
        if (venta == null) return null;

        string? sucursalNombre = await _context.Sucursal
            .Where(s => s.ID_SUCURSAL == venta.ID_SUCURSAL)
            .Select(s => s.DESC_SUCURSAL)
            .FirstOrDefaultAsync();

        var items = await (
            from r in _context.RenglonVenta
            where r.ID_VENTA == ventaId && r.PRECIO_UNITARIO > 0
            orderby r.ID_RENGLON_VENTA
            select new RenglonHistorialDto
            {
                ProductoId = r.ID_PRODUCTO ?? 0,
                ProductoNombre = r.ID_COMBO != null
                    ? _context.Combo.Where(c => c.ID_COMBO == r.ID_COMBO).Select(c => c.DESC_COMBO).FirstOrDefault() ?? "Combo"
                    : _context.Producto.Where(p => p.ID_PRODUCTO == r.ID_PRODUCTO).Select(p => p.DESC_PRODUCTO).FirstOrDefault() ?? "",
                CodigoBarra = r.ID_COMBO != null
                    ? _context.Combo.Where(c => c.ID_COMBO == r.ID_COMBO).Select(c => c.COD_COMBO).FirstOrDefault() ?? ""
                    : _context.Producto.Where(p => p.ID_PRODUCTO == r.ID_PRODUCTO).Select(p => p.CODIGO_BARRAS).FirstOrDefault() ?? "",
                Cantidad = (int)r.CANTIDAD,
                PrecioUnitario = r.PRECIO_UNITARIO,
                Subtotal = r.SUBTOTAL
            }
        ).ToListAsync();

        return new VentaDetalleDto
        {
            VentaId = venta.ID_VENTA,
            Fecha = venta.FECHA_VENTA,
            SucursalId = venta.ID_SUCURSAL,
            SucursalNombre = sucursalNombre,
            Total = venta.TOTAL,
            Items = items
        };
    }

    public void DeshacerVenta(int ventaId, bool conDevolucion = false)
    {
        var venta = _context.Venta.Find(ventaId)
            ?? throw new VentaNoEncontradaException(ventaId);

        if (venta.ANULADA)
            throw new InvalidOperationException("La venta ya fue anulada");

        var limite = DateTime.Now.AddMonths(-1);
        if (venta.FECHA_VENTA < limite)
            throw new InvalidOperationException("Solo se pueden deshacer ventas del último mes");

        var renglones = _context.RenglonVenta
            .Where(r => r.ID_VENTA == ventaId)
            .ToList();

        foreach (var r in renglones)
        {
            if (r.ID_PRODUCTO.HasValue)
            {
                var stock = _context.StockSucursal
                    .FirstOrDefault(s => s.ID_PRODUCTO == r.ID_PRODUCTO.Value && s.ID_SUCURSAL == venta.ID_SUCURSAL);
                if (stock != null)
                {
                    stock.AjustarStock(stock.STOCK + r.CANTIDAD);
                }
            }
        }

        if (conDevolucion)
        {
            var cajaActiva = _context.Caja
                .FirstOrDefault(c => c.ID_SUCURSAL == venta.ID_SUCURSAL && c.ESTADO == "Abierta");

            if (cajaActiva != null)
            {
                var gastoDevolucion = new Gasto(
                    cajaActiva.ID_CAJA,
                    venta.TOTAL,
                    $"Devolución venta #{ventaId}",
                    venta.ID_USUARIO
                );
                _context.Gasto.Add(gastoDevolucion);
            }
        }

        venta.Anular();
        _context.SaveChanges();
    }
}
