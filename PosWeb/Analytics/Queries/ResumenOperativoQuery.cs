using Microsoft.EntityFrameworkCore;
using PosWeb.Analytics.Models;
using PosWeb.Data;

namespace PosWeb.Analytics.Queries;

public class ResumenOperativoQuery : IAnalyticsQuery
{
    public string Id => "resumen-operativo";
    public string Name => "Resumen Operativo";

    public async Task<Dataset> ExecuteAsync(int sucursalId, PosDbContextLocal db, DashboardQueryParams? p = null)
    {
        var hoy = DateTime.Today;
        var fin = hoy.AddDays(1);

        // Cantidad de ventas
        var cantidadVentas = await db.Venta
            .Where(v => v.ID_SUCURSAL == sucursalId
                        && v.FECHA_VENTA >= hoy
                        && v.FECHA_VENTA < fin
                        && !v.ANULADA)
            .CountAsync();

        // Productos vendidos (suma de cantidades)
        var ventaIds = await db.Venta
            .Where(v => v.ID_SUCURSAL == sucursalId
                        && v.FECHA_VENTA >= hoy
                        && v.FECHA_VENTA < fin
                        && !v.ANULADA)
            .Select(v => v.ID_VENTA)
            .ToListAsync();

        var productosVendidos = 0m;
        if (ventaIds.Any())
        {
            var cantidades = await db.RenglonVenta
                .Where(r => ventaIds.Contains(r.ID_VENTA))
                .Select(r => r.CANTIDAD)
                .ToListAsync();
            productosVendidos = cantidades.Sum();
        }

        // Clientes atendidos
        var clientesAtendidos = await db.Venta
            .Where(v => v.ID_SUCURSAL == sucursalId
                        && v.FECHA_VENTA >= hoy
                        && v.FECHA_VENTA < fin
                        && !v.ANULADA
                        && v.ID_CLIENTE.HasValue)
            .Select(v => v.ID_CLIENTE!.Value)
            .Distinct()
            .CountAsync();

        return new Dataset
        {
            Columns = new List<DatasetColumn>
            {
                new() { Name = "ventas", Type = "number", Label = "Ventas" },
                new() { Name = "productos", Type = "number", Label = "Productos" },
                new() { Name = "clientes", Type = "number", Label = "Clientes" },
            },
            Rows = new List<Dictionary<string, object?>>
            {
                new()
                {
                    ["ventas"] = cantidadVentas,
                    ["productos"] = productosVendidos,
                    ["clientes"] = clientesAtendidos,
                }
            },
            Summary = new DatasetSummary
            {
                Count = cantidadVentas
            }
        };
    }
}
