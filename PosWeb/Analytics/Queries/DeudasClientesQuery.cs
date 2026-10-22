using Microsoft.EntityFrameworkCore;
using PosWeb.Analytics.Models;
using PosWeb.Data;

namespace PosWeb.Analytics.Queries;

/// <summary>
/// Total pendiente de cobro a clientes (fiados), cantidad de deudores y antigüedad.
/// </summary>
public class DeudasClientesQuery : IAnalyticsQuery
{
    public string Id => "deudas-clientes";
    public string Name => "Deudas de clientes";

    public async Task<Dataset> ExecuteAsync(int sucursalId, PosDbContextLocal db, DashboardQueryParams? p = null)
    {
        var deudas = await db.Deuda
            .Where(d => d.ID_CLIENTE.HasValue && !d.PAGO && !d.ANULADA)
            .Select(d => new { d.ID_CLIENTE, d.MONTO_DEUDA, d.MONTO_PAGADO, d.FECHA_DEUDA })
            .ToListAsync();

        var total = deudas.Sum(d => d.MONTO_DEUDA - d.MONTO_PAGADO);
        var cantidad = deudas.Select(d => d.ID_CLIENTE!.Value).Distinct().Count();
        var promedio = deudas.Count > 0 ? Math.Round(total / deudas.Count, 2) : 0m;
        var hoy = DateTime.Today;
        var antiguedad = deudas.Count > 0
            ? Math.Round(deudas.Average(d => (hoy - d.FECHA_DEUDA).TotalDays), 0)
            : 0;

        return new Dataset
        {
            Columns = new List<DatasetColumn>
            {
                new() { Name = "totalDeuda", Type = "currency", Label = "Total Adeudado", Format = "currency" },
                new() { Name = "cantidadDeudores", Type = "number", Label = "Deudores" },
                new() { Name = "deudaPromedio", Type = "currency", Label = "Deuda Promedio", Format = "currency" },
                new() { Name = "antiguedadPromedioDias", Type = "number", Label = "Antigüedad (días)" },
            },
            Rows = new List<Dictionary<string, object?>>
            {
                new()
                {
                    ["totalDeuda"] = total,
                    ["cantidadDeudores"] = cantidad,
                    ["deudaPromedio"] = promedio,
                    ["antiguedadPromedioDias"] = antiguedad,
                }
            },
            Summary = new DatasetSummary
            {
                Total = total,
                Count = cantidad,
            }
        };
    }
}
