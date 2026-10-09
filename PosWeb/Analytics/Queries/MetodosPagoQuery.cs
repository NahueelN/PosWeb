using Microsoft.EntityFrameworkCore;
using PosWeb.Analytics.Models;
using PosWeb.Data;

namespace PosWeb.Analytics.Queries;

/// <summary>
/// Distribución de ventas por medio de pago del período.
/// Emite columnas <c>label</c>/<c>value</c> (label = descripción del medio).
/// </summary>
public class MetodosPagoQuery : IAnalyticsQuery
{
    public string Id => "metodos-pago";
    public string Name => "Métodos de pago";

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

        var pagos = await db.Pago
            .Where(pg => ventaIds.Contains(pg.ID_VENTA))
            .Select(pg => new { pg.ID_MEDIO_PAGO, pg.MONTO })
            .ToListAsync();

        var medios = await db.MedioPago
            .ToDictionaryAsync(m => m.ID_MEDIO_PAGO, m => m.DESC_MEDIO_PAGO);

        var agrupado = pagos
            .GroupBy(pg => pg.ID_MEDIO_PAGO)
            .Select(g => new
            {
                Label = medios.GetValueOrDefault(g.Key, $"Medio #{g.Key}"),
                Total = g.Sum(pg => pg.MONTO),
                Cantidad = g.Count()
            })
            .OrderByDescending(x => x.Total)
            .ToList();

        var rows = agrupado.Select(x => new Dictionary<string, object?>
        {
            ["label"] = x.Label,
            ["value"] = x.Total,
            ["cantidad"] = x.Cantidad,
        }).ToList();

        return new Dataset
        {
            Columns = new List<DatasetColumn>
            {
                new() { Name = "label", Type = "string", Label = "Medio de pago" },
                new() { Name = "value", Type = "currency", Label = "Monto", Format = "currency" },
                new() { Name = "cantidad", Type = "number", Label = "Pagos" },
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
            new() { Name = "label", Type = "string", Label = "Medio de pago" },
            new() { Name = "value", Type = "currency", Label = "Monto", Format = "currency" },
            new() { Name = "cantidad", Type = "number", Label = "Pagos" },
        },
        Rows = new List<Dictionary<string, object?>>()
    };
}
