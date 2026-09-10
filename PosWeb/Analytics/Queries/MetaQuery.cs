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

        // Meta del día: si el usuario la configuró, se usa esa; si no, se calcula
        // como el promedio diario de ventas de los últimos 30 días.
        decimal metaDiaria = 0m;
        if (p?.MetaMax is > 0)
        {
            metaDiaria = Math.Round(p.MetaMax.Value, 2);
        }
        else
        {
            var hace30Dias = hoy.AddDays(-30);
            var ventas = await db.Venta
                .Where(v => v.ID_SUCURSAL == sucursalId
                            && v.FECHA_VENTA >= hace30Dias
                            && v.FECHA_VENTA < hoy.AddDays(1)
                            && !v.ANULADA)
                .Select(v => new { v.FECHA_VENTA.Date, v.TOTAL })
                .ToListAsync();

            if (ventas.Any())
            {
                var promedio = ventas
                    .GroupBy(v => v.Date)
                    .Select(g => g.Sum(v => v.TOTAL))
                    .Average();
                metaDiaria = Math.Round(promedio, 2);
            }
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
                new() { Name = "value", Type = "currency", Label = "Ventas Hoy", Format = "currency" },
                new() { Name = "max", Type = "currency", Label = "Meta", Format = "currency" },
            },
            Rows = new List<Dictionary<string, object?>>
            {
                new()
                {
                    ["metaDiaria"] = metaDiaria,
                    ["porcentaje"] = porcentaje,
                    ["ventasHoy"] = ventasHoy,
                    ["value"] = ventasHoy,
                    ["max"] = metaDiaria,
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
