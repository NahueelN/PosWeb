using Microsoft.EntityFrameworkCore;
using PosWeb.Analytics.Models;
using PosWeb.Data;

namespace PosWeb.Analytics.Queries;

/// <summary>
/// Distribución de ventas por rango horario del período.
/// Emite columnas <c>label</c>/<c>value</c> (label = "HH:00").
/// </summary>
public class HorasPicoQuery : IAnalyticsQuery
{
    public string Id => "horas-pico";
    public string Name => "Horarios de venta";

    public async Task<Dataset> ExecuteAsync(int sucursalId, PosDbContextLocal db, DashboardQueryParams? p = null)
    {
        var hoy = DateTime.Today;
        var dias = p?.ChartPeriodDays ?? 7;
        var inicio = hoy.AddDays(-dias);
        var fin = hoy.AddDays(1);

        var ventas = await db.Venta
            .Where(v => v.ID_SUCURSAL == sucursalId
                        && v.FECHA_VENTA >= inicio
                        && v.FECHA_VENTA < fin
                        && !v.ANULADA)
            .Select(v => new { v.FECHA_VENTA, v.TOTAL })
            .ToListAsync();

        var agrupado = ventas
            .GroupBy(v => v.FECHA_VENTA.Hour)
            .Select(g => new
            {
                Hora = g.Key,
                Total = g.Sum(v => v.TOTAL),
                Cantidad = g.Count()
            })
            .OrderBy(x => x.Hora)
            .ToList();

        var rows = agrupado.Select(x => new Dictionary<string, object?>
        {
            ["label"] = $"{x.Hora:00}:00",
            ["value"] = x.Total,
            ["cantidad"] = x.Cantidad,
        }).ToList();

        return new Dataset
        {
            Columns = new List<DatasetColumn>
            {
                new() { Name = "label", Type = "string", Label = "Hora" },
                new() { Name = "value", Type = "currency", Label = "Ventas", Format = "currency" },
                new() { Name = "cantidad", Type = "number", Label = "Transacciones" },
            },
            Rows = rows,
            Summary = new DatasetSummary
            {
                Total = rows.Sum(r => (decimal)(r["value"] ?? 0m)),
                Count = rows.Count,
            }
        };
    }
}
