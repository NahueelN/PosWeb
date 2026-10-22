using Microsoft.EntityFrameworkCore;
using PosWeb.Analytics.Models;
using PosWeb.Data;

namespace PosWeb.Analytics.Queries;

/// <summary>
/// Productos ordenados por ganancia aportada en el período.
/// Emite columnas <c>label</c>/<c>value</c> (value = ganancia) para gráficos.
/// </summary>
public class MargenPorProductoQuery : IAnalyticsQuery
{
    public string Id => "margen-por-producto";
    public string Name => "Margen por producto";

    public async Task<Dataset> ExecuteAsync(int sucursalId, PosDbContextLocal db, DashboardQueryParams? p = null)
    {
        var hoy = DateTime.Today;
        var dias = p?.ChartPeriodDays ?? 0;
        var inicio = hoy.AddDays(-dias);
        var fin = hoy.AddDays(1);
        var limit = p?.MarginLimit ?? 10;

        var ventaIds = await db.Venta
            .Where(v => v.ID_SUCURSAL == sucursalId
                        && v.FECHA_VENTA >= inicio
                        && v.FECHA_VENTA < fin
                        && !v.ANULADA)
            .Select(v => v.ID_VENTA)
            .ToListAsync();

        if (ventaIds.Count == 0)
            return EmptyDataset();

        var renglones = await db.RenglonVenta
            .Where(r => ventaIds.Contains(r.ID_VENTA) && r.ID_PRODUCTO.HasValue)
            .Select(r => new { r.ID_PRODUCTO, r.CANTIDAD, r.SUBTOTAL })
            .ToListAsync();

        var agrupado = renglones
            .GroupBy(r => r.ID_PRODUCTO!.Value)
            .Select(g => new
            {
                ProductoId = g.Key,
                Cantidad = g.Sum(r => r.CANTIDAD),
                Facturacion = g.Sum(r => r.SUBTOTAL),
            })
            .ToList();

        var productoIds = agrupado.Select(x => x.ProductoId).ToList();
        var productos = await db.Producto
            .Where(prod => productoIds.Contains(prod.ID_PRODUCTO))
            .ToDictionaryAsync(prod => prod.ID_PRODUCTO, prod => new { prod.DESC_PRODUCTO, prod.COSTO });

        var rows = agrupado
            .Select(x =>
            {
                var prod = productos.GetValueOrDefault(x.ProductoId);
                var costo = x.Cantidad * (prod?.COSTO ?? 0m);
                var ganancia = x.Facturacion - costo;
                return new
                {
                    ProductoId = x.ProductoId,
                    Nombre = prod?.DESC_PRODUCTO ?? $"Producto #{x.ProductoId}",
                    Cantidad = x.Cantidad,
                    Facturacion = x.Facturacion,
                    Costo = costo,
                    Ganancia = ganancia,
                    Margen = x.Facturacion > 0 ? Math.Round(ganancia / x.Facturacion * 100, 1) : 0m
                };
            })
            .OrderByDescending(x => x.Ganancia)
            .Take(limit)
            .Select(x => new Dictionary<string, object?>
            {
                ["label"] = x.Nombre,
                ["value"] = x.Ganancia,
                ["cantidad"] = x.Cantidad,
                ["facturacion"] = x.Facturacion,
                ["costo"] = x.Costo,
                ["ganancia"] = x.Ganancia,
                ["margen"] = x.Margen,
            })
            .ToList();

        return new Dataset
        {
            Columns = new List<DatasetColumn>
            {
                new() { Name = "label", Type = "string", Label = "Producto" },
                new() { Name = "value", Type = "currency", Label = "Ganancia", Format = "currency" },
                new() { Name = "cantidad", Type = "number", Label = "Unidades" },
                new() { Name = "facturacion", Type = "currency", Label = "Facturación", Format = "currency" },
                new() { Name = "costo", Type = "currency", Label = "Costo", Format = "currency" },
                new() { Name = "ganancia", Type = "currency", Label = "Ganancia", Format = "currency" },
                new() { Name = "margen", Type = "percentage", Label = "Margen" },
            },
            Rows = rows,
            Summary = new DatasetSummary
            {
                Total = rows.Sum(r => (decimal)(r["ganancia"] ?? 0m)),
                Count = rows.Count,
            }
        };
    }

    private static Dataset EmptyDataset() => new()
    {
        Columns = new List<DatasetColumn>
        {
            new() { Name = "label", Type = "string", Label = "Producto" },
            new() { Name = "value", Type = "currency", Label = "Ganancia", Format = "currency" },
            new() { Name = "cantidad", Type = "number", Label = "Unidades" },
            new() { Name = "facturacion", Type = "currency", Label = "Facturación", Format = "currency" },
            new() { Name = "costo", Type = "currency", Label = "Costo", Format = "currency" },
            new() { Name = "ganancia", Type = "currency", Label = "Ganancia", Format = "currency" },
            new() { Name = "margen", Type = "percentage", Label = "Margen" },
        },
        Rows = new List<Dictionary<string, object?>>()
    };
}
