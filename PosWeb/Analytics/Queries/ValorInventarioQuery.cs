using Microsoft.EntityFrameworkCore;
using PosWeb.Analytics.Models;
using PosWeb.Data;

namespace PosWeb.Analytics.Queries;

/// <summary>
/// Valor total del inventario de la sucursal, a costo y a precio de venta.
/// </summary>
public class ValorInventarioQuery : IAnalyticsQuery
{
    public string Id => "valor-inventario";
    public string Name => "Valor de inventario";

    public async Task<Dataset> ExecuteAsync(int sucursalId, PosDbContextLocal db, DashboardQueryParams? p = null)
    {
        var stocks = await db.StockSucursal
            .Where(s => s.ID_SUCURSAL == sucursalId && s.STOCK > 0)
            .Select(s => new { s.ID_PRODUCTO, s.STOCK })
            .ToListAsync();

        var productoIds = stocks.Select(s => s.ID_PRODUCTO).Distinct().ToList();
        var productos = await db.Producto
            .Where(prod => productoIds.Contains(prod.ID_PRODUCTO))
            .ToDictionaryAsync(prod => prod.ID_PRODUCTO, prod => new { prod.COSTO, prod.PRECIO });

        var valorCosto = stocks.Sum(s =>
        {
            var prod = productos.GetValueOrDefault(s.ID_PRODUCTO);
            return s.STOCK * (prod?.COSTO ?? 0m);
        });
        var valorVenta = stocks.Sum(s =>
        {
            var prod = productos.GetValueOrDefault(s.ID_PRODUCTO);
            return s.STOCK * (prod?.PRECIO ?? 0m);
        });
        var unidades = stocks.Sum(s => s.STOCK);

        return new Dataset
        {
            Columns = new List<DatasetColumn>
            {
                new() { Name = "valorCosto", Type = "currency", Label = "Valor a Costo", Format = "currency" },
                new() { Name = "valorVenta", Type = "currency", Label = "Valor a Venta", Format = "currency" },
                new() { Name = "unidades", Type = "number", Label = "Unidades" },
                new() { Name = "productos", Type = "number", Label = "Productos" },
            },
            Rows = new List<Dictionary<string, object?>>
            {
                new()
                {
                    ["valorCosto"] = valorCosto,
                    ["valorVenta"] = valorVenta,
                    ["unidades"] = unidades,
                    ["productos"] = productoIds.Count,
                }
            },
            Summary = new DatasetSummary
            {
                Total = valorCosto,
                Count = productoIds.Count,
            }
        };
    }
}
