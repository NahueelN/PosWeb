using Microsoft.EntityFrameworkCore;
using PosWeb.Analytics.Models;
using PosWeb.Data;

namespace PosWeb.Analytics.Queries;

public class VentasSemanaQuery : IAnalyticsQuery
{
    public string Id => "ventas-semana";
    public string Name => "Ventas de la Semana";

    public async Task<Dataset> ExecuteAsync(int sucursalId, PosDbContextLocal db, DashboardQueryParams? p = null)
    {
        var hoy = DateTime.Today;
        var days = p?.ChartPeriodDays ?? 7;
        var desde = hoy.AddDays(-(days - 1));
        var hasta = hoy.AddDays(1);

        var ventas = await db.Venta
            .Where(v => v.ID_SUCURSAL == sucursalId
                        && v.FECHA_VENTA >= desde
                        && v.FECHA_VENTA < hasta
                        && !v.ANULADA)
            .Select(v => new { v.FECHA_VENTA, v.TOTAL })
            .ToListAsync();

        var rows = ventas
            .GroupBy(v => v.FECHA_VENTA.Date)
            .Select(g => new Dictionary<string, object?>
            {
                ["fecha"] = g.Key.ToString("dd/MM"),
                ["total"] = g.Sum(v => v.TOTAL)
            })
            .OrderBy(x => x["fecha"])
            .ToList();

        return new Dataset
        {
            Columns = new List<DatasetColumn>
            {
                new() { Name = "fecha", Type = "string", Label = "Fecha" },
                new() { Name = "total", Type = "currency", Label = "Total", Format = "currency" },
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
