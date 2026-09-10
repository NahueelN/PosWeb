using Microsoft.EntityFrameworkCore;
using PosWeb.Analytics.Models;
using PosWeb.Data;

namespace PosWeb.Analytics.Queries;

public class TopProductosQuery : IAnalyticsQuery
{
    public string Id => "top-productos";
    public string Name => "Top Productos";

    public async Task<Dataset> ExecuteAsync(int sucursalId, PosDbContextLocal db, DashboardQueryParams? p = null)
    {
        var hoy = DateTime.Today;
        var dias = p?.TopProductosPeriodDays ?? 0;
        var inicio = hoy.AddDays(-dias);
        var fin = hoy.AddDays(1);
        var limit = p?.ProductLimit ?? 5;

        var ventaIds = await db.Venta
            .Where(v => v.ID_SUCURSAL == sucursalId
                        && v.FECHA_VENTA >= inicio
                        && v.FECHA_VENTA < fin
                        && !v.ANULADA)
            .Select(v => v.ID_VENTA)
            .ToListAsync();

        if (!ventaIds.Any())
        {
            return new Dataset
            {
                Columns = new List<DatasetColumn>
                {
                    new() { Name = "productoId", Type = "number", Label = "ID" },
                    new() { Name = "nombre", Type = "string", Label = "Producto" },
                    new() { Name = "cantidad", Type = "number", Label = "Unidades" },
                    new() { Name = "subtotal", Type = "currency", Label = "Subtotal", Format = "currency" },
                },
                Rows = new List<Dictionary<string, object?>>()
            };
        }

        var renglones = await db.RenglonVenta
            .Where(r => ventaIds.Contains(r.ID_VENTA) && r.ID_PRODUCTO.HasValue)
            .Select(r => new { r.ID_PRODUCTO, r.CANTIDAD, r.SUBTOTAL })
            .ToListAsync();

        var agrupados = renglones
            .GroupBy(r => r.ID_PRODUCTO!.Value)
            .Select(g => new
            {
                ProductoId = g.Key,
                Cantidad = g.Sum(r => r.CANTIDAD),
                Subtotal = g.Sum(r => r.SUBTOTAL)
            })
            .OrderByDescending(x => x.Cantidad)
            .Take(limit)
            .ToList();

        // FIX: poblar Nombre desde Producto
        var productoIds = agrupados.Select(x => x.ProductoId).ToList();
        var productos = await db.Producto
            .Where(p => productoIds.Contains(p.ID_PRODUCTO))
            .ToDictionaryAsync(p => p.ID_PRODUCTO, p => p.DESC_PRODUCTO);

        var rows = agrupados.Select(x => new Dictionary<string, object?>
        {
            ["productoId"] = x.ProductoId,
            ["nombre"] = productos.GetValueOrDefault(x.ProductoId, ""),
            ["cantidad"] = x.Cantidad,
            ["subtotal"] = x.Subtotal,
        }).ToList();

        return new Dataset
        {
            Columns = new List<DatasetColumn>
            {
                new() { Name = "productoId", Type = "number", Label = "ID" },
                new() { Name = "nombre", Type = "string", Label = "Producto" },
                new() { Name = "cantidad", Type = "number", Label = "Unidades" },
                new() { Name = "subtotal", Type = "currency", Label = "Subtotal", Format = "currency" },
            },
            Rows = rows,
            Summary = new DatasetSummary
            {
                Total = rows.Sum(r => (decimal)(r["subtotal"] ?? 0m)),
                Count = rows.Count
            }
        };
    }
}
