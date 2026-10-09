using Microsoft.EntityFrameworkCore;
using PosWeb.Analytics.Models;
using PosWeb.Data;

namespace PosWeb.Analytics.Queries;

/// <summary>
/// Facturación, costo, ganancia y margen agrupados por categoría de producto.
/// Emite columnas <c>label</c>/<c>value</c> (value = ganancia) para gráficos.
/// </summary>
public class MargenPorCategoriaQuery : IAnalyticsQuery
{
    public string Id => "margen-por-categoria";
    public string Name => "Margen por categoría";

    public async Task<Dataset> ExecuteAsync(int sucursalId, PosDbContextLocal db, DashboardQueryParams? p = null)
    {
        var hoy = DateTime.Today;
        var dias = p?.ChartPeriodDays ?? 0;
        var inicio = hoy.AddDays(-dias);
        var fin = hoy.AddDays(1);

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

        var productoIds = renglones.Select(r => r.ID_PRODUCTO!.Value).Distinct().ToList();
        var productos = await db.Producto
            .Where(prod => productoIds.Contains(prod.ID_PRODUCTO))
            .ToDictionaryAsync(prod => prod.ID_PRODUCTO, prod => new { prod.COSTO, prod.ID_CATEGORIA });

        var categoriaIds = productos.Values
            .Where(x => x.ID_CATEGORIA.HasValue)
            .Select(x => x.ID_CATEGORIA!.Value)
            .Distinct()
            .ToList();

        var categorias = await db.Categoria
            .Where(c => categoriaIds.Contains(c.ID_CATEGORIA))
            .ToDictionaryAsync(c => c.ID_CATEGORIA, c => c.DESC_CATEGORIA);

        var agrupado = renglones
            .GroupBy(r =>
            {
                var prod = productos.GetValueOrDefault(r.ID_PRODUCTO!.Value);
                return prod?.ID_CATEGORIA;
            })
            .Select(g =>
            {
                var facturacion = g.Sum(r => r.SUBTOTAL);
                var costo = g.Sum(r =>
                {
                    var prod = productos.GetValueOrDefault(r.ID_PRODUCTO!.Value);
                    return r.CANTIDAD * (prod?.COSTO ?? 0m);
                });
                var ganancia = facturacion - costo;
                var nombre = g.Key.HasValue
                    ? categorias.GetValueOrDefault(g.Key.Value, "Sin categoría")
                    : "Sin categoría";
                return new
                {
                    Label = nombre,
                    Facturacion = facturacion,
                    Costo = costo,
                    Ganancia = ganancia,
                    Margen = facturacion > 0 ? Math.Round(ganancia / facturacion * 100, 1) : 0m
                };
            })
            .OrderByDescending(x => x.Ganancia)
            .ToList();

        var rows = agrupado.Select(x => new Dictionary<string, object?>
        {
            ["label"] = x.Label,
            ["value"] = x.Ganancia,
            ["facturacion"] = x.Facturacion,
            ["costo"] = x.Costo,
            ["ganancia"] = x.Ganancia,
            ["margen"] = x.Margen,
        }).ToList();

        return new Dataset
        {
            Columns = new List<DatasetColumn>
            {
                new() { Name = "label", Type = "string", Label = "Categoría" },
                new() { Name = "value", Type = "currency", Label = "Ganancia", Format = "currency" },
                new() { Name = "facturacion", Type = "currency", Label = "Facturación", Format = "currency" },
                new() { Name = "costo", Type = "currency", Label = "Costo", Format = "currency" },
                new() { Name = "ganancia", Type = "currency", Label = "Ganancia", Format = "currency" },
                new() { Name = "margen", Type = "percentage", Label = "Margen" },
            },
            Rows = rows,
            Summary = new DatasetSummary
            {
                Total = rows.Sum(r => (decimal)(r["facturacion"] ?? 0m)),
                Count = rows.Count,
            }
        };
    }

    private static Dataset EmptyDataset() => new()
    {
        Columns = new List<DatasetColumn>
        {
            new() { Name = "label", Type = "string", Label = "Categoría" },
            new() { Name = "value", Type = "currency", Label = "Ganancia", Format = "currency" },
            new() { Name = "facturacion", Type = "currency", Label = "Facturación", Format = "currency" },
            new() { Name = "costo", Type = "currency", Label = "Costo", Format = "currency" },
            new() { Name = "ganancia", Type = "currency", Label = "Ganancia", Format = "currency" },
            new() { Name = "margen", Type = "percentage", Label = "Margen" },
        },
        Rows = new List<Dictionary<string, object?>>()
    };
}
