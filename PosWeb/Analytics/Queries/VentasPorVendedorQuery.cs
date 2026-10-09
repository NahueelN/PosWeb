using Microsoft.EntityFrameworkCore;
using PosWeb.Analytics.Models;
using PosWeb.Data;

namespace PosWeb.Analytics.Queries;

/// <summary>
/// Rendimiento por vendedor/cajero: total vendido, transacciones y ticket promedio.
/// Emite columnas <c>label</c>/<c>value</c> (label = nombre de usuario).
/// </summary>
public class VentasPorVendedorQuery : IAnalyticsQuery
{
    public string Id => "ventas-por-vendedor";
    public string Name => "Rendimiento por vendedor";

    public async Task<Dataset> ExecuteAsync(int sucursalId, PosDbContextLocal db, DashboardQueryParams? p = null)
    {
        var hoy = DateTime.Today;
        var dias = p?.ChartPeriodDays ?? 0;
        var inicio = hoy.AddDays(-dias);
        var fin = hoy.AddDays(1);
        var limit = p?.SellerLimit ?? 10;

        var ventas = await db.Venta
            .Where(v => v.ID_SUCURSAL == sucursalId
                        && v.FECHA_VENTA >= inicio
                        && v.FECHA_VENTA < fin
                        && !v.ANULADA)
            .Select(v => new { v.ID_USUARIO, v.TOTAL })
            .ToListAsync();

        if (ventas.Count == 0)
            return EmptyDataset();

        var agrupado = ventas
            .GroupBy(v => v.ID_USUARIO)
            .Select(g => new
            {
                UsuarioId = g.Key,
                Total = g.Sum(v => v.TOTAL),
                Cantidad = g.Count()
            })
            .OrderByDescending(x => x.Total)
            .Take(limit)
            .ToList();

        var usuarioIds = agrupado
            .Where(x => x.UsuarioId.HasValue)
            .Select(x => x.UsuarioId!.Value)
            .Distinct()
            .ToList();

        var usuarios = usuarioIds.Count > 0
            ? await db.Usuario
                .Where(u => usuarioIds.Contains(u.ID_USUARIO))
                .ToDictionaryAsync(u => u.ID_USUARIO, u => u.NOMBRE_USUARIO)
            : new Dictionary<int, string>();

        var rows = agrupado.Select(x => new Dictionary<string, object?>
        {
            ["label"] = x.UsuarioId.HasValue
                ? usuarios.GetValueOrDefault(x.UsuarioId.Value, $"Usuario #{x.UsuarioId}")
                : "Sin usuario",
            ["value"] = x.Total,
            ["cantidad"] = x.Cantidad,
            ["ticket"] = x.Cantidad > 0 ? Math.Round(x.Total / x.Cantidad, 2) : 0m,
        }).ToList();

        return new Dataset
        {
            Columns = new List<DatasetColumn>
            {
                new() { Name = "label", Type = "string", Label = "Vendedor" },
                new() { Name = "value", Type = "currency", Label = "Total Vendido", Format = "currency" },
                new() { Name = "cantidad", Type = "number", Label = "Transacciones" },
                new() { Name = "ticket", Type = "currency", Label = "Ticket Promedio", Format = "currency" },
            },
            Rows = rows,
            Summary = new DatasetSummary
            {
                Total = rows.Sum(r => (decimal)(r["value"] ?? 0m)),
                Count = rows.Count,
            }
        };
    }

    private static Dataset EmptyDataset() => new()
    {
        Columns = new List<DatasetColumn>
        {
            new() { Name = "label", Type = "string", Label = "Vendedor" },
            new() { Name = "value", Type = "currency", Label = "Total Vendido", Format = "currency" },
            new() { Name = "cantidad", Type = "number", Label = "Transacciones" },
            new() { Name = "ticket", Type = "currency", Label = "Ticket Promedio", Format = "currency" },
        },
        Rows = new List<Dictionary<string, object?>>()
    };
}
