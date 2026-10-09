using Microsoft.EntityFrameworkCore;
using PosWeb.Analytics.Models;
using PosWeb.Data;

namespace PosWeb.Analytics.Queries;

/// <summary>
/// Ventas a clientes registrados vs. consumidor final (no identificado).
/// Emite columnas <c>label</c>/<c>value</c> (value = cantidad de ventas).
/// </summary>
public class RetencionClientesQuery : IAnalyticsQuery
{
    public string Id => "retencion-clientes";
    public string Name => "Clientes registrados vs finales";

    public async Task<Dataset> ExecuteAsync(int sucursalId, PosDbContextLocal db, DashboardQueryParams? p = null)
    {
        var hoy = DateTime.Today;
        var dias = p?.ChartPeriodDays ?? 0;
        var inicio = hoy.AddDays(-dias);
        var fin = hoy.AddDays(1);

        var ventas = await db.Venta
            .Where(v => v.ID_SUCURSAL == sucursalId
                        && v.FECHA_VENTA >= inicio
                        && v.FECHA_VENTA < fin
                        && !v.ANULADA)
            .Select(v => new { v.ID_CLIENTE })
            .ToListAsync();

        var registrados = ventas.Count(v => v.ID_CLIENTE.HasValue);
        var finales = ventas.Count - registrados;
        var total = ventas.Count;

        decimal Porcentaje(int cantidad) =>
            total > 0 ? Math.Round((decimal)cantidad / total * 100, 1) : 0;

        var rows = new List<Dictionary<string, object?>>
        {
            new()
            {
                ["label"] = "Clientes registrados",
                ["value"] = registrados,
                ["porcentaje"] = Porcentaje(registrados),
            },
            new()
            {
                ["label"] = "Consumidor final",
                ["value"] = finales,
                ["porcentaje"] = Porcentaje(finales),
            },
        };

        return new Dataset
        {
            Columns = new List<DatasetColumn>
            {
                new() { Name = "label", Type = "string", Label = "Tipo de cliente" },
                new() { Name = "value", Type = "number", Label = "Ventas" },
                new() { Name = "porcentaje", Type = "percentage", Label = "Porcentaje" },
            },
            Rows = rows,
            Summary = new DatasetSummary
            {
                Total = total,
                Count = total,
            }
        };
    }
}
