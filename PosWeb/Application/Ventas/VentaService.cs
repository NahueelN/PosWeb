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

        Sucursal? sucursal = _context.Sucursales.Find(dto.SucursalId);

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
            cajaActiva = _context.Cajas
                .FirstOrDefault(c => c.ID_USUARIO_APERTURA == usuarioId.Value && c.ESTADO == "Abierta");
        }
        else
        {
            // Fallback for anonymous scenarios
            cajaActiva = _context.Cajas
                .FirstOrDefault(c => c.ID_SUCURSAL == dto.SucursalId && c.ESTADO == "Abierta");
        }

        if (cajaActiva == null)
        {
            throw new VentaSinCajaActivaException();
        }

        // Validate pagos
        if (dto.Pagos == null)
        {
            throw new PagosVaciosException();
        }

        decimal totalPagos = 0;
        List<(int medioPagoId, decimal monto, decimal? conCambio)> pagosData = new();

        if (dto.Pagos.Count > 0)
        {
            foreach (var pago in dto.Pagos)
            {
                if (pago.Monto <= 0)
                {
                    throw new MedioPagoInvalidoException("Monto inválido");
                }

                MedioPago? medio = _context.MediosPago.Find(pago.MedioPagoId);
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
            Producto? producto = _context.Productos.Find(item.ProductoId);

            if (producto == null)
            {
                throw new ProductoNoExisteException(item.ProductoId);
            }

            if (!producto.ACTIVO)
            {
                throw new ProductoInactivoException(item.ProductoId);
            }

            // Per-sucursal stock check
            StockSucursal? stockSuc = _context.StockSucursales
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

        // Validate payment total against sale total
        if (dto.Pagos.Count > 0)
        {
            decimal totalVenta = venta.TOTAL;
            if (Math.Abs(totalPagos - totalVenta) > 0.01m)
            {
                // Check if it's a cash payment with extra (change scenario)
                bool hasCashExtra = pagosData.Any(p =>
                {
                    var medio = _context.MediosPago.Find(p.medioPagoId);
                    return medio?.PAGA_VUELTO == true && p.conCambio.HasValue && p.conCambio > p.monto;
                });

                if (!hasCashExtra)
                {
                    throw new PagoSumaInvalidaException(totalPagos, totalVenta);
                }

                // Recalculate: cash overpayment is OK as long as the "real" payment covers the total
                decimal realPayment = pagosData.Sum(p =>
                {
                    var medio = _context.MediosPago.Find(p.medioPagoId);
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
        else
        {
            throw new PagosVaciosException();
        }

        _context.Ventas.Add(venta);
        _context.SaveChanges();

        // Persist Pago records
        decimal cambioTotal = 0;
        var pagosResult = new List<PagoVentaResultDto>();

        if (dto.Pagos != null && pagosData.Count > 0)
        {
            foreach (var (medioPagoId, monto, conCambio) in pagosData)
            {
                var pago = new Pago(
                    venta.ID_VENTA,
                    medioPagoId,
                    monto,
                    usuarioId ?? 0,
                    cajaActiva.ID_CAJA
                );

                _context.Pagos.Add(pago);

                string medioNombre = _context.MediosPago
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

        return new VentaResultadoDto
        {
            VentaId = venta.ID_VENTA,
            Fecha = venta.FECHA_VENTA,
            Total = venta.TOTAL,
            Pagos = pagosResult,
            Cambio = cambioTotal
        };
    }

    public async Task<bool> ExisteSucursalAsync(int sucursalId)
    {
        return await _context.Sucursales.AnyAsync(s => s.ID_SUCURSAL == sucursalId);
    }

    public async Task<PagedResult<VentaHistorialDto>> ObtenerHistorialAsync(VentaHistorialFiltro filtro)
    {
        IQueryable<Venta> query = _context.Ventas
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
                SucursalNombre = _context.Sucursales
                    .Where(s => s.ID_SUCURSAL == v.ID_SUCURSAL)
                    .Select(s => s.DESC_SUCURSAL)
                    .FirstOrDefault(),
                Total = v.TOTAL,
                CantidadItems = v.RENGLONES.Count
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
        Venta? venta = await _context.Ventas.FindAsync(ventaId);
        if (venta == null) return null;

        string? sucursalNombre = await _context.Sucursales
            .Where(s => s.ID_SUCURSAL == venta.ID_SUCURSAL)
            .Select(s => s.DESC_SUCURSAL)
            .FirstOrDefaultAsync();

        var items = await (
            from r in _context.RenglonesVenta
            join p in _context.Productos on r.ID_PRODUCTO equals p.ID_PRODUCTO
            where r.ID_VENTA == ventaId
            select new RenglonHistorialDto
            {
                ProductoId = r.ID_PRODUCTO,
                ProductoNombre = p.DESC_PRODUCTO,
                CodigoBarra = p.CODIGO_BARRAS,
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
}
