using Microsoft.EntityFrameworkCore;
using PosWeb.Analytics.Models;
using PosWeb.Data;

namespace PosWeb.Analytics.Queries;

public class UltimasVentasQuery : IAnalyticsQuery
{
    public string Id => "ultimas-ventas";
    public string Name => "Últimas Ventas";

    public async Task<Dataset> ExecuteAsync(int sucursalId, PosDbContextLocal db, DashboardQueryParams? p = null)
    {
        var limit = p?.SalesLimit ?? 8;
        var ventas = await db.Venta
            .Where(v => v.ID_SUCURSAL == sucursalId && !v.ANULADA)
            .OrderByDescending(v => v.FECHA_VENTA)
            .Take(limit)
            .Select(v => new
            {
                v.ID_VENTA,
                v.FECHA_VENTA,
                v.TOTAL,
                v.ID_USUARIO,
            })
            .ToListAsync();

        if (!ventas.Any())
        {
            return new Dataset
            {
                Columns = new List<DatasetColumn>
                {
                    new() { Name = "ventaId", Type = "number", Label = "ID" },
                    new() { Name = "fecha", Type = "date", Label = "Fecha" },
                    new() { Name = "total", Type = "currency", Label = "Total", Format = "currency" },
                    new() { Name = "usuario", Type = "string", Label = "Vendedor" },
                    new() { Name = "productoPrincipal", Type = "string", Label = "Producto Principal" },
                    new() { Name = "cantidadItems", Type = "number", Label = "Items" },
                },
                Rows = new List<Dictionary<string, object?>>()
            };
        }

        var ventaIds = ventas.Select(v => v.ID_VENTA).ToList();
        var usuarioIds = ventas.Where(v => v.ID_USUARIO.HasValue)
            .Select(v => v.ID_USUARIO!.Value).Distinct().ToList();

        // Productos por venta
        var renglones = await db.RenglonVenta
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

        var productos = await db.Producto
            .Where(p => productoIds.Contains(p.ID_PRODUCTO))
            .ToDictionaryAsync(p => p.ID_PRODUCTO, p => p.DESC_PRODUCTO);

        var usuarios = usuarioIds.Any()
            ? await db.Usuario
                .Where(u => usuarioIds.Contains(u.ID_USUARIO))
                .ToDictionaryAsync(u => u.ID_USUARIO, u => u.NOMBRE_USUARIO)
            : new Dictionary<int, string>();

        var rows = ventas.Select(v =>
        {
            var info = productosPorVenta.GetValueOrDefault(v.ID_VENTA);
            var prodName = info?.ProductoPrincipal.HasValue == true
                ? productos.GetValueOrDefault(info.ProductoPrincipal.Value)
                : null;

            return new Dictionary<string, object?>
            {
                ["ventaId"] = v.ID_VENTA,
                ["fecha"] = v.FECHA_VENTA,
                ["total"] = v.TOTAL,
                ["usuario"] = v.ID_USUARIO.HasValue
                    ? usuarios.GetValueOrDefault(v.ID_USUARIO.Value)
                    : null,
                ["productoPrincipal"] = prodName,
                ["cantidadItems"] = info?.CantidadItems ?? 0,
            };
        }).ToList();

        return new Dataset
        {
            Columns = new List<DatasetColumn>
            {
                new() { Name = "ventaId", Type = "number", Label = "ID" },
                new() { Name = "fecha", Type = "date", Label = "Fecha" },
                new() { Name = "total", Type = "currency", Label = "Total", Format = "currency" },
                new() { Name = "usuario", Type = "string", Label = "Vendedor" },
                new() { Name = "productoPrincipal", Type = "string", Label = "Producto Principal" },
                new() { Name = "cantidadItems", Type = "number", Label = "Items" },
            },
            Rows = rows,
            Summary = new DatasetSummary
            {
                Total = rows.Sum(r => (decimal)(r["total"] ?? 0m)),
                Count = rows.Count
            }
        };
    }
}
