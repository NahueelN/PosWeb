using Microsoft.EntityFrameworkCore;
using PosWeb.Contracts;
using PosWeb.Data;

namespace PosWeb.Application.Estadisticas;

public class EstadisticasService
{
    private readonly PosDbContext _context;

    public EstadisticasService(PosDbContext context)
    {
        _context = context;
    }

    public EstadisticasDto ObtenerEstadisticas(DateTime desde, DateTime hasta, int? sucursalId = null)
    {
        hasta = hasta.Date.AddDays(1).AddTicks(-1);

        var ventasQuery = _context.Venta
            .Where(v => v.FECHA_VENTA >= desde && v.FECHA_VENTA <= hasta);

        if (sucursalId.HasValue)
            ventasQuery = ventasQuery.Where(v => v.ID_SUCURSAL == sucursalId.Value);

        var ventas = ventasQuery.ToList();
        var totalVentas = ventas.Count;
        var facturacion = ventas.Sum(v => v.TOTAL);

        var ventasIds = ventas.Select(v => v.ID_VENTA).ToList();

        var renglones = _context.RenglonVenta
            .Where(r => ventasIds.Contains(r.ID_VENTA))
            .ToList();

        var topProductos = renglones
            .GroupBy(r => r.ID_PRODUCTO)
            .Select(g => new
            {
                ProductoId = g.Key,
                Cantidad = g.Sum(r => r.CANTIDAD),
                Subtotal = g.Sum(r => r.SUBTOTAL),
            })
            .OrderByDescending(x => x.Cantidad)
            .Take(10)
            .ToList();

        var productosIds = topProductos.Select(x => x.ProductoId).ToList();
        var productos = _context.Producto
            .Where(p => productosIds.Contains(p.ID_PRODUCTO))
            .ToDictionary(p => p.ID_PRODUCTO, p => p);

        var costoTotal = renglones.Sum(r =>
        {
            productos.TryGetValue(r.ID_PRODUCTO, out var prod);
            return r.CANTIDAD * (prod?.COSTO ?? 0);
        });

        var resultadoNeto = facturacion - costoTotal;

        var ticketPromedio = totalVentas > 0 ? facturacion / totalVentas : 0;

        var mejorDia = ventas
            .GroupBy(v => v.FECHA_VENTA.Date)
            .Select(g => new { Fecha = g.Key, Total = g.Sum(v => v.TOTAL) })
            .OrderByDescending(x => x.Total)
            .FirstOrDefault();

        return new EstadisticasDto
        {
            Desde = desde,
            Hasta = hasta,
            TotalVentas = totalVentas,
            Facturacion = facturacion,
            CostoTotal = costoTotal,
            ResultadoNeto = resultadoNeto,
            TicketPromedio = ticketPromedio,
            MejorDia = mejorDia?.Fecha,
            MejorDiaFacturacion = mejorDia?.Total ?? 0,
            TopProductos = topProductos.Select(x => new ProductoEstadisticaDto
            {
                ProductoId = x.ProductoId,
                ProductoNombre = productos.GetValueOrDefault(x.ProductoId)?.DESC_PRODUCTO ?? $"(ID {x.ProductoId})",
                CodigoBarra = productos.GetValueOrDefault(x.ProductoId)?.CODIGO_BARRAS ?? "",
                CantidadVendida = x.Cantidad,
                Subtotal = x.Subtotal,
            }).ToList(),
        };
    }
}
