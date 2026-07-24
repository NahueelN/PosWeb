using Microsoft.EntityFrameworkCore;
using PosWeb.Contracts;
using PosWeb.Data;
using PosWeb.Domain;

namespace PosWeb.Application.Dashboard;

public class DashboardService
{
    private readonly PosDbContextLocal _context;

    public DashboardService(PosDbContextLocal context)
    {
        _context = context;
    }

    public async Task<DashboardDto> ObtenerDashboard(int sucursalId, int usuarioId)
    {
        var hoy = DateTime.Today;
        var ayer = hoy.AddDays(-1);
        var hace7Dias = hoy.AddDays(-6);
        var hace30Dias = hoy.AddDays(-30);

        // Execute all queries in parallel for performance
        var ventasHoyTask = ObtenerVentasDelDia(sucursalId, hoy);
        var ventasAyerTask = ObtenerVentasDelDia(sucursalId, ayer);
        var ventasSemanaTask = ObtenerVentasSemana(sucursalId, hace7Dias, hoy);
        var topProductosTask = ObtenerTopProductos(sucursalId, hoy);
        var cajaTask = ObtenerCaja(sucursalId);
        var alertasTask = ObtenerAlertas(sucursalId);
        var ultimasVentasTask = ObtenerUltimasVentas(sucursalId, 8);
        var sucursalTask = _context.Sucursal.FindAsync(sucursalId).AsTask();
        var usuarioTask = _context.Usuario.FindAsync(usuarioId).AsTask();
        var metaTask = CalcularMetaDiaria(sucursalId, hace30Dias, hoy);
        var productosVendidosTask = ContarProductosVendidosHoy(sucursalId, hoy);
        var clientesAtendidosTask = ContarClientesAtendidosHoy(sucursalId, hoy);
        var actividadTask = ObtenerActividadReciente(sucursalId, hoy);

        await Task.WhenAll(
            ventasHoyTask, ventasAyerTask, ventasSemanaTask,
            topProductosTask, cajaTask, alertasTask,
            ultimasVentasTask, sucursalTask, usuarioTask,
            metaTask, productosVendidosTask, clientesAtendidosTask,
            actividadTask
        );

        var ventasHoy = await ventasHoyTask;
        var ventasAyer = await ventasAyerTask;
        var ventasSemana = await ventasSemanaTask;
        var topProductos = await topProductosTask;
        var caja = await cajaTask;
        var alertas = await alertasTask;
        var ultimasVentas = await ultimasVentasTask;
        var sucursal = await sucursalTask;
        var usuario = await usuarioTask;
        var metaDiaria = await metaTask;
        var productosVendidos = await productosVendidosTask;
        var clientesAtendidos = await clientesAtendidosTask;
        var actividad = await actividadTask;

        // Calculate KPIs
        var totalVentasHoy = ventasHoy.Sum(v => v.Total);
        var cantidadVentas = ventasHoy.Count;
        var ticketPromedio = cantidadVentas > 0 ? totalVentasHoy / cantidadVentas : 0;

        // Cost calculation for profit
        var renglonesHoy = await _context.RenglonVenta
            .Where(r => ventasHoy.Select(v => v.Id).Contains(r.ID_VENTA) && r.ID_PRODUCTO.HasValue)
            .ToListAsync();

        var productosIds = renglonesHoy.Select(r => r.ID_PRODUCTO!.Value).Distinct().ToList();
        var productos = await _context.Producto
            .Where(p => productosIds.Contains(p.ID_PRODUCTO))
            .ToDictionaryAsync(p => p.ID_PRODUCTO, p => p);

        var costoTotal = renglonesHoy.Sum(r =>
        {
            productos.TryGetValue(r.ID_PRODUCTO!.Value, out var prod);
            return r.CANTIDAD * (prod?.COSTO ?? 0);
        });

        var gananciaEstimada = totalVentasHoy - costoTotal;

        // Yesterday comparison
        var totalVentasAyer = ventasAyer.Sum(v => v.Total);
        var cantidadAyer = ventasAyer.Count;
        var ticketAyer = cantidadAyer > 0 ? totalVentasAyer / cantidadAyer : 0;

        // Cost yesterday for profit comparison
        var renglonesAyer = await _context.RenglonVenta
            .Where(r => ventasAyer.Select(v => v.Id).Contains(r.ID_VENTA) && r.ID_PRODUCTO.HasValue)
            .ToListAsync();

        var productosIdsAyer = renglonesAyer.Select(r => r.ID_PRODUCTO!.Value).Distinct().ToList();
        var productosAyer = await _context.Producto
            .Where(p => productosIdsAyer.Contains(p.ID_PRODUCTO))
            .ToDictionaryAsync(p => p.ID_PRODUCTO, p => p);

        var costoAyer = renglonesAyer.Sum(r =>
        {
            productosAyer.TryGetValue(r.ID_PRODUCTO!.Value, out var prod);
            return r.CANTIDAD * (prod?.COSTO ?? 0);
        });

        var gananciaAyer = totalVentasAyer - costoAyer;

        // Meta progress
        var metaPorcentaje = metaDiaria > 0
            ? Math.Round(totalVentasHoy / metaDiaria * 100, 1)
            : 0;

        return new DashboardDto
        {
            VentasHoy = totalVentasHoy,
            CantidadVentasHoy = cantidadVentas,
            TicketPromedio = ticketPromedio,
            CajaActual = caja?.MONTO_INICIAL ?? 0,
            GananciaEstimada = gananciaEstimada,

            VariacionVentas = CalcularVariacion(totalVentasHoy, totalVentasAyer),
            VariacionCantidad = CalcularVariacion(cantidadVentas, cantidadAyer),
            VariacionTicket = CalcularVariacion(ticketPromedio, ticketAyer),
            VariacionGanancia = CalcularVariacion(gananciaEstimada, gananciaAyer),

            CajaEstado = caja?.ESTADO ?? "cerrada",
            CajaMontoInicial = caja?.MONTO_INICIAL ?? 0,
            CajaFechaApertura = caja?.FECHA_APERTURA,

            MetaDiaria = metaDiaria,
            MetaPorcentaje = metaPorcentaje,

            ProductosVendidosHoy = productosVendidos,
            ClientesAtendidosHoy = clientesAtendidos,

            VentasSemana = ventasSemana,
            TopProductos = topProductos,
            Alertas = alertas,
            UltimasVentas = ultimasVentas,
            ActividadReciente = actividad,

            SucursalNombre = sucursal?.DESC_SUCURSAL ?? "Sin sucursal",
            UsuarioNombre = usuario?.NOMBRE_USUARIO ?? "",
        };
    }

    private async Task<List<VentaDelDia>> ObtenerVentasDelDia(int sucursalId, DateTime fecha)
    {
        var inicio = fecha;
        var fin = fecha.AddDays(1);

        return await _context.Venta
            .Where(v => v.ID_SUCURSAL == sucursalId
                        && v.FECHA_VENTA >= inicio
                        && v.FECHA_VENTA < fin
                        && !v.ANULADA)
            .Select(v => new VentaDelDia { Id = v.ID_VENTA, Total = v.TOTAL })
            .ToListAsync();
    }

    private async Task<List<DiaVentaDto>> ObtenerVentasSemana(int sucursalId, DateTime desde, DateTime hasta)
    {
        var fin = hasta.AddDays(1);

        var ventas = await _context.Venta
            .Where(v => v.ID_SUCURSAL == sucursalId
                        && v.FECHA_VENTA >= desde
                        && v.FECHA_VENTA < fin
                        && !v.ANULADA)
            .Select(v => new { v.FECHA_VENTA, v.TOTAL })
            .ToListAsync();

        return ventas
            .GroupBy(v => v.FECHA_VENTA.Date)
            .Select(g => new DiaVentaDto
            {
                Fecha = g.Key.ToString("dd/MM"),
                Total = g.Sum(v => v.TOTAL)
            })
            .OrderBy(x => x.Fecha)
            .ToList();
    }

    private async Task<List<TopProductoDto>> ObtenerTopProductos(int sucursalId, DateTime fecha)
    {
        var inicio = fecha;
        var fin = fecha.AddDays(1);

        var ventaIds = await _context.Venta
            .Where(v => v.ID_SUCURSAL == sucursalId
                        && v.FECHA_VENTA >= inicio
                        && v.FECHA_VENTA < fin
                        && !v.ANULADA)
            .Select(v => v.ID_VENTA)
            .ToListAsync();

        if (!ventaIds.Any())
            return new List<TopProductoDto>();

        var renglones = await _context.RenglonVenta
            .Where(r => ventaIds.Contains(r.ID_VENTA) && r.ID_PRODUCTO.HasValue)
            .Select(r => new { r.ID_PRODUCTO, r.CANTIDAD, r.SUBTOTAL })
            .ToListAsync();

        return renglones
            .GroupBy(r => r.ID_PRODUCTO!.Value)
            .Select(g => new TopProductoDto
            {
                ProductoId = g.Key,
                Cantidad = g.Sum(r => r.CANTIDAD),
                Subtotal = g.Sum(r => r.SUBTOTAL)
            })
            .OrderByDescending(x => x.Cantidad)
            .Take(5)
            .ToList();
    }

    private async Task<Caja?> ObtenerCaja(int sucursalId)
    {
        return await _context.Caja
            .FirstOrDefaultAsync(c => c.ID_SUCURSAL == sucursalId && c.ESTADO == "Abierta");
    }

    private async Task<AlertasDto> ObtenerAlertas(int sucursalId)
    {
        var stockBajoTask = _context.StockSucursal
            .Where(s => s.ID_SUCURSAL == sucursalId && s.STOCK <= 5)
            .CountAsync();

        var deudasProveedorTask = _context.Deuda
            .Where(d => d.ID_PROVEEDOR.HasValue && !d.PAGO)
            .CountAsync();

        var deudasClienteTask = _context.Deuda
            .Where(d => d.ID_CLIENTE.HasValue && !d.PAGO)
            .CountAsync();

        var pedidosPendientesTask = _context.Pedido
            .Where(p => p.ID_SUCURSAL == sucursalId && p.ESTADO == "Pendiente")
            .CountAsync();

        var cajaAbiertaTask = _context.Caja
            .AnyAsync(c => c.ID_SUCURSAL == sucursalId && c.ESTADO == "Abierta");

        var hoy = DateTime.Today;
        var finHoy = hoy.AddDays(1);
        var comprasPendientesTask = _context.Compra
            .Where(c => c.ID_SUCURSAL == sucursalId
                        && c.FECHA_COMPRA >= hoy
                        && c.FECHA_COMPRA < finHoy)
            .CountAsync();

        await Task.WhenAll(stockBajoTask, deudasProveedorTask, deudasClienteTask, pedidosPendientesTask, cajaAbiertaTask, comprasPendientesTask);

        return new AlertasDto
        {
            StockBajo = await stockBajoTask,
            DeudasProveedor = await deudasProveedorTask,
            DeudasCliente = await deudasClienteTask,
            PedidosPendientes = await pedidosPendientesTask,
            ComprasPendientes = await comprasPendientesTask,
            CajaAbierta = await cajaAbiertaTask
        };
    }

    private async Task<List<UltimaVentaDto>> ObtenerUltimasVentas(int sucursalId, int cantidad)
    {
        var ventas = await _context.Venta
            .Where(v => v.ID_SUCURSAL == sucursalId && !v.ANULADA)
            .OrderByDescending(v => v.FECHA_VENTA)
            .Take(cantidad)
            .Select(v => new
            {
                v.ID_VENTA,
                v.FECHA_VENTA,
                v.TOTAL,
                v.ID_USUARIO,
                v.ID_CLIENTE
            })
            .ToListAsync();

        if (!ventas.Any())
            return new List<UltimaVentaDto>();

        var ventaIds = ventas.Select(v => v.ID_VENTA).ToList();
        var usuarioIds = ventas.Where(v => v.ID_USUARIO.HasValue).Select(v => v.ID_USUARIO!.Value).Distinct().ToList();

        // Get product names for each sale (first product as "main product")
        var renglones = await _context.RenglonVenta
            .Where(r => ventaIds.Contains(r.ID_VENTA) && r.ID_PRODUCTO.HasValue)
            .Select(r => new { r.ID_VENTA, r.ID_PRODUCTO, r.SUBTOTAL })
            .ToListAsync();

        var productosPorVenta = renglones
            .GroupBy(r => r.ID_VENTA)
            .ToDictionary(
                g => g.Key,
                g => new
                {
                    CantidadItems = g.Count(),
                    ProductoPrincipal = g.OrderByDescending(r => r.SUBTOTAL).First().ID_PRODUCTO
                }
            );

        var productoIds = renglones
            .Where(r => r.ID_PRODUCTO.HasValue)
            .Select(r => r.ID_PRODUCTO!.Value)
            .Distinct()
            .ToList();

        var productos = await _context.Producto
            .Where(p => productoIds.Contains(p.ID_PRODUCTO))
            .ToDictionaryAsync(p => p.ID_PRODUCTO, p => p.DESC_PRODUCTO);

        var usuarios = usuarioIds.Any()
            ? await _context.Usuario
                .Where(u => usuarioIds.Contains(u.ID_USUARIO))
                .ToDictionaryAsync(u => u.ID_USUARIO, u => u.NOMBRE_USUARIO)
            : new Dictionary<int, string>();

        return ventas.Select(v =>
        {
            var info = productosPorVenta.GetValueOrDefault(v.ID_VENTA);
            var prodName = info?.ProductoPrincipal.HasValue == true
                ? productos.GetValueOrDefault(info.ProductoPrincipal.Value)
                : null;

            return new UltimaVentaDto
            {
                VentaId = v.ID_VENTA,
                Fecha = v.FECHA_VENTA,
                Total = v.TOTAL,
                Usuario = v.ID_USUARIO.HasValue
                    ? usuarios.GetValueOrDefault(v.ID_USUARIO.Value)
                    : null,
                ProductoPrincipal = prodName,
                CantidadItems = info?.CantidadItems ?? 0
            };
        }).ToList();
    }

    private async Task<decimal> CalcularMetaDiaria(int sucursalId, DateTime desde, DateTime hasta)
    {
        var fin = hasta.AddDays(1);

        var ventas = await _context.Venta
            .Where(v => v.ID_SUCURSAL == sucursalId
                        && v.FECHA_VENTA >= desde
                        && v.FECHA_VENTA < fin
                        && !v.ANULADA)
            .Select(v => new { v.FECHA_VENTA.Date, v.TOTAL })
            .ToListAsync();

        if (!ventas.Any())
            return 0;

        var promedio = ventas
            .GroupBy(v => v.Date)
            .Select(g => g.Sum(v => v.TOTAL))
            .Average();

        return Math.Round(promedio, 2);
    }

    private async Task<int> ContarProductosVendidosHoy(int sucursalId, DateTime fecha)
    {
        var inicio = fecha;
        var fin = fecha.AddDays(1);

        var ventaIds = await _context.Venta
            .Where(v => v.ID_SUCURSAL == sucursalId
                        && v.FECHA_VENTA >= inicio
                        && v.FECHA_VENTA < fin
                        && !v.ANULADA)
            .Select(v => v.ID_VENTA)
            .ToListAsync();

        if (!ventaIds.Any())
            return 0;

        var cantidad = await _context.RenglonVenta
            .Where(r => ventaIds.Contains(r.ID_VENTA))
            .SumAsync(r => r.CANTIDAD);

        return (int)cantidad;
    }

    private async Task<int> ContarClientesAtendidosHoy(int sucursalId, DateTime fecha)
    {
        var inicio = fecha;
        var fin = fecha.AddDays(1);

        return await _context.Venta
            .Where(v => v.ID_SUCURSAL == sucursalId
                        && v.FECHA_VENTA >= inicio
                        && v.FECHA_VENTA < fin
                        && !v.ANULADA
                        && v.ID_CLIENTE.HasValue)
            .Select(v => v.ID_CLIENTE!.Value)
            .Distinct()
            .CountAsync();
    }

    private async Task<List<ActividadRecienteDto>> ObtenerActividadReciente(int sucursalId, DateTime hoy)
    {
        var fin = hoy.AddDays(1);
        var actividad = new List<ActividadRecienteDto>();

        // Ventas de hoy
        var ventas = await _context.Venta
            .Where(v => v.ID_SUCURSAL == sucursalId
                        && v.FECHA_VENTA >= hoy
                        && v.FECHA_VENTA < fin
                        && !v.ANULADA)
            .OrderByDescending(v => v.FECHA_VENTA)
            .Take(20)
            .Select(v => new ActividadRecienteDto
            {
                Tipo = "venta",
                Descripcion = $"Venta #{v.ID_VENTA}",
                Fecha = v.FECHA_VENTA,
                Monto = v.TOTAL
            })
            .ToListAsync();
        actividad.AddRange(ventas);

        // Compras de hoy
        var compras = await _context.Compra
            .Where(c => c.ID_SUCURSAL == sucursalId
                        && c.FECHA_COMPRA >= hoy
                        && c.FECHA_COMPRA < fin)
            .OrderByDescending(c => c.FECHA_COMPRA)
            .Take(10)
            .Select(c => new ActividadRecienteDto
            {
                Tipo = "compra",
                Descripcion = $"Compra #{c.ID_COMPRA}",
                Fecha = c.FECHA_COMPRA,
                Monto = c.TOTAL
            })
            .ToListAsync();
        actividad.AddRange(compras);

        // Gastos de hoy
        var gastos = await _context.Gasto
            .Where(g => g.FECHA_GASTO >= hoy
                        && g.FECHA_GASTO < fin
                        && !g.ANULADO
                        && g.ID_CAJA != null)
            .OrderByDescending(g => g.FECHA_GASTO)
            .Take(10)
            .Select(g => new ActividadRecienteDto
            {
                Tipo = "gasto",
                Descripcion = g.DETALLE,
                Fecha = g.FECHA_GASTO,
                Monto = g.MONTO
            })
            .ToListAsync();
        actividad.AddRange(gastos);

        // Caja apertura/cierre hoy
        var cajas = await _context.Caja
            .Where(c => c.ID_SUCURSAL == sucursalId)
            .OrderByDescending(c => c.FECHA_APERTURA)
            .Take(10)
            .Select(c => new ActividadRecienteDto
            {
                Tipo = "caja",
                Descripcion = c.ESTADO == "Abierta" ? "Apertura de caja" : "Cierre de caja",
                Fecha = c.ESTADO == "Abierta" ? c.FECHA_APERTURA : (c.FECHA_CIERRE ?? c.FECHA_APERTURA),
                Monto = c.MONTO_INICIAL
            })
            .ToListAsync();
        actividad.AddRange(cajas);

        return actividad
            .OrderByDescending(a => a.Fecha)
            .Take(15)
            .ToList();
    }

    private static decimal? CalcularVariacion(decimal actual, decimal anterior)
    {
        if (anterior == 0)
            return actual > 0 ? 100 : null;

        return Math.Round((actual - anterior) / anterior * 100, 1);
    }

    private record VentaDelDia
    {
        public int Id { get; init; }
        public decimal Total { get; init; }
    }
}
