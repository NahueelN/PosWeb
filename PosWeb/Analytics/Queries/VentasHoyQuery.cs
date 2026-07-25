using Microsoft.EntityFrameworkCore;
using PosWeb.Analytics.Models;
using PosWeb.Data;

namespace PosWeb.Analytics.Queries;

public class VentasHoyQuery : IAnalyticsQuery
{
    public string Id => "ventas-hoy";
    public string Name => "Ventas Hoy";

    public async Task<Dataset> ExecuteAsync(int sucursalId, PosDbContextLocal db, DashboardQueryParams? p = null)
    {
        var hoy = DateTime.Today;
        var ayer = hoy.AddDays(-1);

        // Ventas de hoy
        var inicio = hoy;
        var fin = hoy.AddDays(1);
        var ventasHoy = await db.Venta
            .Where(v => v.ID_SUCURSAL == sucursalId
                        && v.FECHA_VENTA >= inicio
                        && v.FECHA_VENTA < fin
                        && !v.ANULADA)
            .Select(v => new { v.ID_VENTA, v.TOTAL })
            .ToListAsync();

        var totalVentasHoy = ventasHoy.Sum(v => v.TOTAL);
        var cantidadVentas = ventasHoy.Count;
        var ticketPromedio = cantidadVentas > 0 ? totalVentasHoy / cantidadVentas : 0;

        // Costo y ganancia de hoy
        var ventaIdsHoy = ventasHoy.Select(v => v.ID_VENTA).ToList();
        var renglonesHoy = await db.RenglonVenta
            .Where(r => ventaIdsHoy.Contains(r.ID_VENTA) && r.ID_PRODUCTO.HasValue)
            .ToListAsync();

        var productoIdsHoy = renglonesHoy.Select(r => r.ID_PRODUCTO!.Value).Distinct().ToList();
        var productosHoy = await db.Producto
            .Where(p => productoIdsHoy.Contains(p.ID_PRODUCTO))
            .ToDictionaryAsync(p => p.ID_PRODUCTO, p => p);

        var costoTotal = renglonesHoy.Sum(r =>
        {
            productosHoy.TryGetValue(r.ID_PRODUCTO!.Value, out var prod);
            return r.CANTIDAD * (prod?.COSTO ?? 0);
        });
        var gananciaEstimada = totalVentasHoy - costoTotal;

        // Ventas de ayer (para comparación)
        var inicioAyer = ayer;
        var finAyer = ayer.AddDays(1);
        var ventasAyer = await db.Venta
            .Where(v => v.ID_SUCURSAL == sucursalId
                        && v.FECHA_VENTA >= inicioAyer
                        && v.FECHA_VENTA < finAyer
                        && !v.ANULADA)
            .Select(v => new { v.ID_VENTA, v.TOTAL })
            .ToListAsync();

        var totalVentasAyer = ventasAyer.Sum(v => v.TOTAL);
        var cantidadAyer = ventasAyer.Count;
        var ticketAyer = cantidadAyer > 0 ? totalVentasAyer / cantidadAyer : 0;

        // Costo y ganancia de ayer
        var ventaIdsAyer = ventasAyer.Select(v => v.ID_VENTA).ToList();
        var renglonesAyer = await db.RenglonVenta
            .Where(r => ventaIdsAyer.Contains(r.ID_VENTA) && r.ID_PRODUCTO.HasValue)
            .ToListAsync();

        var productoIdsAyer = renglonesAyer.Select(r => r.ID_PRODUCTO!.Value).Distinct().ToList();
        var productosAyer = await db.Producto
            .Where(p => productoIdsAyer.Contains(p.ID_PRODUCTO))
            .ToDictionaryAsync(p => p.ID_PRODUCTO, p => p);

        var costoAyer = renglonesAyer.Sum(r =>
        {
            productosAyer.TryGetValue(r.ID_PRODUCTO!.Value, out var prod);
            return r.CANTIDAD * (prod?.COSTO ?? 0);
        });
        var gananciaAyer = totalVentasAyer - costoAyer;

        return new Dataset
        {
            Columns = new List<DatasetColumn>
            {
                new() { Name = "total", Type = "currency", Label = "Total Ventas", Format = "currency" },
                new() { Name = "cantidad", Type = "number", Label = "Cantidad Ventas" },
                new() { Name = "ticket", Type = "currency", Label = "Ticket Promedio", Format = "currency" },
                new() { Name = "ganancia", Type = "currency", Label = "Ganancia Estimada", Format = "currency" },
                new() { Name = "variacionVentas", Type = "percentage", Label = "Variación Ventas" },
                new() { Name = "variacionCantidad", Type = "percentage", Label = "Variación Cantidad" },
                new() { Name = "variacionTicket", Type = "percentage", Label = "Variación Ticket" },
                new() { Name = "variacionGanancia", Type = "percentage", Label = "Variación Ganancia" },
            },
            Rows = new List<Dictionary<string, object?>>
            {
                new()
                {
                    ["total"] = totalVentasHoy,
                    ["cantidad"] = cantidadVentas,
                    ["ticket"] = ticketPromedio,
                    ["ganancia"] = gananciaEstimada,
                    ["variacionVentas"] = CalcularVariacion(totalVentasHoy, totalVentasAyer),
                    ["variacionCantidad"] = CalcularVariacion(cantidadVentas, cantidadAyer),
                    ["variacionTicket"] = CalcularVariacion(ticketPromedio, ticketAyer),
                    ["variacionGanancia"] = CalcularVariacion(gananciaEstimada, gananciaAyer),
                }
            },
            Summary = new DatasetSummary
            {
                Total = totalVentasHoy,
                Count = cantidadVentas,
                Average = ticketPromedio,
                Growth = CalcularVariacion(totalVentasHoy, totalVentasAyer)
            }
        };
    }

    private static decimal? CalcularVariacion(decimal actual, decimal anterior)
    {
        if (anterior == 0)
            return actual > 0 ? 100 : null;
        return Math.Round((actual - anterior) / anterior * 100, 1);
    }
}
