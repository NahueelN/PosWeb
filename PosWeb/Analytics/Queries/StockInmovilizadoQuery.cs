using Microsoft.EntityFrameworkCore;
using PosWeb.Analytics.Models;
using PosWeb.Data;

namespace PosWeb.Analytics.Queries;

/// <summary>
/// Productos con stock disponible y sin ventas en los últimos N días
/// (stock inmovilizado). Ordenados por valor a costo descendente.
/// </summary>
public class StockInmovilizadoQuery : IAnalyticsQuery
{
    public string Id => "stock-inmovilizado";
    public string Name => "Productos sin movimiento";

    public async Task<Dataset> ExecuteAsync(int sucursalId, PosDbContextLocal db, DashboardQueryParams? p = null)
    {
        var hoy = DateTime.Today;
        var dias = p?.InmovilizadoDays ?? 60;
        var limit = p?.InmovilizadoLimit ?? 10;
        var corte = hoy.AddDays(-dias);

        var stocks = await db.StockSucursal
            .Where(s => s.ID_SUCURSAL == sucursalId && s.STOCK > 0)
            .Select(s => new { s.ID_PRODUCTO, s.STOCK })
            .ToListAsync();

        if (stocks.Count == 0)
            return EmptyDataset();

        var ventaIdsRecientes = await db.Venta
            .Where(v => v.ID_SUCURSAL == sucursalId
                        && v.FECHA_VENTA >= corte
                        && !v.ANULADA)
            .Select(v => v.ID_VENTA)
            .ToListAsync();

        var productosConMovimiento = await db.RenglonVenta
            .Where(r => ventaIdsRecientes.Contains(r.ID_VENTA) && r.ID_PRODUCTO.HasValue)
            .Select(r => r.ID_PRODUCTO!.Value)
            .Distinct()
            .ToListAsync();

        var inmovilizados = stocks
            .Where(s => !productosConMovimiento.Contains(s.ID_PRODUCTO))
            .ToList();

        if (inmovilizados.Count == 0)
            return EmptyDataset();

        var productoIds = inmovilizados.Select(s => s.ID_PRODUCTO).ToList();
        var productos = await db.Producto
            .Where(prod => productoIds.Contains(prod.ID_PRODUCTO))
            .ToDictionaryAsync(prod => prod.ID_PRODUCTO, prod => new { prod.DESC_PRODUCTO, prod.COSTO });

        var rows = inmovilizados
            .Select(s =>
            {
                var prod = productos.GetValueOrDefault(s.ID_PRODUCTO);
                return new
                {
                    Nombre = prod?.DESC_PRODUCTO ?? $"Producto #{s.ID_PRODUCTO}",
                    Stock = s.STOCK,
                    ValorCosto = s.STOCK * (prod?.COSTO ?? 0m)
                };
            })
            .OrderByDescending(x => x.ValorCosto)
            .Take(limit)
            .Select(x => new Dictionary<string, object?>
            {
                ["producto"] = x.Nombre,
                ["stock"] = x.Stock,
                ["valorCosto"] = x.ValorCosto,
                ["diasSinVenta"] = dias,
            })
            .ToList();

        return new Dataset
        {
            Columns = new List<DatasetColumn>
            {
                new() { Name = "producto", Type = "string", Label = "Producto" },
                new() { Name = "stock", Type = "number", Label = "Stock" },
                new() { Name = "valorCosto", Type = "currency", Label = "Valor a Costo", Format = "currency" },
                new() { Name = "diasSinVenta", Type = "number", Label = "Días sin venta" },
            },
            Rows = rows,
            Summary = new DatasetSummary
            {
                Total = rows.Sum(r => (decimal)(r["valorCosto"] ?? 0m)),
                Count = inmovilizados.Count,
            }
        };
    }

    private static Dataset EmptyDataset() => new()
    {
        Columns = new List<DatasetColumn>
        {
            new() { Name = "producto", Type = "string", Label = "Producto" },
            new() { Name = "stock", Type = "number", Label = "Stock" },
            new() { Name = "valorCosto", Type = "currency", Label = "Valor a Costo", Format = "currency" },
            new() { Name = "diasSinVenta", Type = "number", Label = "Días sin venta" },
        },
        Rows = new List<Dictionary<string, object?>>()
    };
}
