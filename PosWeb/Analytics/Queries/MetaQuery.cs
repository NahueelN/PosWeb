using Microsoft.EntityFrameworkCore;
using PosWeb.Analytics.Models;
using PosWeb.Data;

namespace PosWeb.Analytics.Queries;

public class MetaQuery : IAnalyticsQuery
{
    public string Id => "meta";
    public string Name => "Meta del Día";

    public async Task<Dataset> ExecuteAsync(int sucursalId, PosDbContextLocal db, DashboardQueryParams? p = null)
    {
        var hoy = DateTime.Today;
        var hace30Dias = hoy.AddDays(-30);

        // Promedio diario de ventas últimos 30 días
        var ventas = await db.Venta
            .Where(v => v.ID_SUCURSAL == sucursalId
                        && v.FECHA_VENTA >= hace30Dias
                        && v.FECHA_VENTA < hoy.AddDays(1)
                        && !v.ANULADA)
            .Select(v => new { v.FECHA_VENTA.Date, v.TOTAL })
            .ToListAsync();

        var metaDiaria = 0m;
        if (ventas.Any())
        {
            var promedio = ventas
                .GroupBy(v => v.Date)
                .Select(g => g.Sum(v => v.TOTAL))
                .Average();
            metaDiaria = Math.Round(promedio, 2);
        }

        // Ventas de hoy para calcular porcentaje
        var ventasHoyTotales = await db.Venta
            .Where(v => v.ID_SUCURSAL == sucursalId
                        && v.FECHA_VENTA >= hoy
                        && v.FECHA_VENTA < hoy.AddDays(1)
                        && !v.ANULADA)
            .Select(v => v.TOTAL)
            .ToListAsync();
        var ventasHoy = ventasHoyTotales.Sum();

        var porcentaje = metaDiaria > 0
            ? Math.Round(ventasHoy / metaDiaria * 100, 1)
            : 0;

        return new Dataset
        {
            Columns = new List<DatasetColumn>
            {
                new() { Name = "metaDiaria", Type = "currency", Label = "Meta Diaria", Format = "currency" },
                new() { Name = "porcentaje", Type = "percentage", Label = "Porcentaje" },
                new() { Name = "ventasHoy", Type = "currency", Label = "Ventas Hoy", Format = "currency" },
            },
            Rows = new List<Dictionary<string, object?>>
            {
                new()
                {
                    ["metaDiaria"] = metaDiaria,
                    ["porcentaje"] = porcentaje,
                    ["ventasHoy"] = ventasHoy,
                }
            },
            Summary = new DatasetSummary
            {
                Total = metaDiaria,
                Growth = porcentaje
            }
        };
    }
}
