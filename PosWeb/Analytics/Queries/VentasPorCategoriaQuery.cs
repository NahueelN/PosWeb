using Microsoft.EntityFrameworkCore;
using PosWeb.Analytics.Models;
using PosWeb.Data;

namespace PosWeb.Analytics.Queries;

/// <summary>
/// Distribución de ventas por categoría de producto (hoy).
/// Produce un Dataset con label + value, compatible con PIE_CHART, BAR_CHART, TABLE.
/// </summary>
public class VentasPorCategoriaQuery : IAnalyticsQuery
{
    public string Id => "ventas-por-categoria";
    public string Name => "Ventas por Categoría";

    public async Task<Dataset> ExecuteAsync(int sucursalId, PosDbContextLocal db, DashboardQueryParams? p = null)
    {
        var hoy = DateTime.Today;
        var fin = hoy.AddDays(1);

        // 1. Obtener IDs de ventas del día
        var ventaIds = await db.Venta
            .Where(v => v.ID_SUCURSAL == sucursalId
                        && v.FECHA_VENTA >= hoy
                        && v.FECHA_VENTA < fin
                        && !v.ANULADA)
            .Select(v => v.ID_VENTA)
            .ToListAsync();

        if (!ventaIds.Any())
        {
            return EmptyDataset();
        }

        // 2. Obtener renglones con producto
        var renglones = await db.RenglonVenta
            .Where(r => ventaIds.Contains(r.ID_VENTA) && r.ID_PRODUCTO.HasValue)
            .Select(r => new { r.ID_PRODUCTO, r.SUBTOTAL })
            .ToListAsync();

        if (!renglones.Any())
        {
            return EmptyDataset();
        }

        // 3. Obtener productos con categoría
        var productoIds = renglones.Select(r => r.ID_PRODUCTO!.Value).Distinct().ToList();
        var productos = await db.Producto
            .Where(prod => productoIds.Contains(prod.ID_PRODUCTO))
            .Select(prod => new { prod.ID_PRODUCTO, prod.ID_CATEGORIA, prod.DESC_PRODUCTO })
            .ToListAsync();

        var prodMap = productos.ToDictionary(p => p.ID_PRODUCTO, p => new { p.ID_CATEGORIA, p.DESC_PRODUCTO });

        // 4. Obtener categorías
        var catIds = productos.Where(p => p.ID_CATEGORIA.HasValue).Select(p => p.ID_CATEGORIA!.Value).Distinct().ToList();
        var categorias = await db.Categoria
            .Where(c => catIds.Contains(c.ID_CATEGORIA))
            .ToDictionaryAsync(c => c.ID_CATEGORIA, c => c.DESC_CATEGORIA);

        // 5. Agrupar por categoría
        var grouped = renglones
            .Where(r => prodMap.ContainsKey(r.ID_PRODUCTO!.Value))
            .GroupBy(r =>
            {
                var prod = prodMap[r.ID_PRODUCTO!.Value];
                return prod.ID_CATEGORIA;
            })
            .Select(g => new
            {
                CategoriaId = g.Key,
                Total = g.Sum(r => r.SUBTOTAL)
            })
            .OrderByDescending(x => x.Total)
            .ToList();

        // 6. Construir filas
        var rows = grouped.Select(g => new Dictionary<string, object?>
        {
            ["label"] = g.CategoriaId.HasValue && categorias.ContainsKey(g.CategoriaId.Value)
                ? categorias[g.CategoriaId.Value]
                : "Sin categoría",
            ["value"] = g.Total,
        }).ToList();

        return new Dataset
        {
            Columns = new List<DatasetColumn>
            {
                new() { Name = "label", Type = "string", Label = "Categoría" },
                new() { Name = "value", Type = "currency", Label = "Total", Format = "currency" },
            },
            Rows = rows,
            Summary = new DatasetSummary
            {
                Total = rows.Sum(r => (decimal)(r["value"] ?? 0m)),
                Count = rows.Count
            }
        };
    }

    private static Dataset EmptyDataset()
    {
        return new Dataset
        {
            Columns = new List<DatasetColumn>
            {
                new() { Name = "label", Type = "string", Label = "Categoría" },
                new() { Name = "value", Type = "currency", Label = "Total", Format = "currency" },
            },
            Rows = new List<Dictionary<string, object?>>()
        };
    }
}
