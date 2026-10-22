using Microsoft.EntityFrameworkCore;
using PosWeb.Analytics.Models;
using PosWeb.Data;

namespace PosWeb.Analytics.Queries;

/// <summary>
/// Ganancia bruta, margen promedio, facturación y costo del período.
/// La ganancia es estimada: facturación - (cantidad x COSTO actual del producto).
/// </summary>
public class RentabilidadQuery : IAnalyticsQuery
{
    public string Id => "rentabilidad";
    public string Name => "Rentabilidad";

    public async Task<Dataset> ExecuteAsync(int sucursalId, PosDbContextLocal db, DashboardQueryParams? p = null)
    {
        var hoy = DateTime.Today;
        var dias = p?.ChartPeriodDays ?? 0;
        var inicio = hoy.AddDays(-dias);
        var fin = hoy.AddDays(1);

        var ventas = await db.Venta
            .Where(v => v.ID_SUCURSAL == sucursalId
                        && v.FECHA_VENTA >= inicio
                        && v.FECHA_VENTA < fin
                        && !v.ANULADA)
            .Select(v => new { v.ID_VENTA, v.TOTAL })
            .ToListAsync();

        var facturacion = ventas.Sum(v => v.TOTAL);
        var transacciones = ventas.Count;
        var ventaIds = ventas.Select(v => v.ID_VENTA).ToList();

        var renglones = await db.RenglonVenta
            .Where(r => ventaIds.Contains(r.ID_VENTA) && r.ID_PRODUCTO.HasValue)
            .Select(r => new { r.ID_PRODUCTO, r.CANTIDAD })
            .ToListAsync();

        var productoIds = renglones.Select(r => r.ID_PRODUCTO!.Value).Distinct().ToList();
        var costos = await db.Producto
            .Where(prod => productoIds.Contains(prod.ID_PRODUCTO))
            .ToDictionaryAsync(prod => prod.ID_PRODUCTO, prod => prod.COSTO);

        var costo = renglones.Sum(r => r.CANTIDAD * costos.GetValueOrDefault(r.ID_PRODUCTO!.Value, 0m));
        var ganancia = facturacion - costo;
        var margen = facturacion > 0 ? Math.Round(ganancia / facturacion * 100, 1) : 0;

        return new Dataset
        {
            Columns = new List<DatasetColumn>
            {
                new() { Name = "ganancia", Type = "currency", Label = "Ganancia Bruta", Format = "currency" },
                new() { Name = "margen", Type = "percentage", Label = "Margen" },
                new() { Name = "facturacion", Type = "currency", Label = "Facturación", Format = "currency" },
                new() { Name = "costo", Type = "currency", Label = "Costo", Format = "currency" },
                new() { Name = "transacciones", Type = "number", Label = "Transacciones" },
            },
            Rows = new List<Dictionary<string, object?>>
            {
                new()
                {
                    ["ganancia"] = ganancia,
                    ["margen"] = margen,
                    ["facturacion"] = facturacion,
                    ["costo"] = costo,
                    ["transacciones"] = transacciones,
                }
            },
            Summary = new DatasetSummary
            {
                Total = ganancia,
                Count = transacciones,
                Average = margen,
            }
        };
    }
}
