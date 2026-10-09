using Microsoft.EntityFrameworkCore;
using PosWeb.Analytics.Models;
using PosWeb.Data;

namespace PosWeb.Analytics.Queries;

/// <summary>
/// Total acumulado a pagar a proveedores, cantidad de proveedores y antigüedad.
/// </summary>
public class DeudasProveedoresQuery : IAnalyticsQuery
{
    public string Id => "deudas-proveedores";
    public string Name => "Deudas con proveedores";

    public async Task<Dataset> ExecuteAsync(int sucursalId, PosDbContextLocal db, DashboardQueryParams? p = null)
    {
        var deudas = await db.Deuda
            .Where(d => d.ID_PROVEEDOR.HasValue && !d.PAGO && !d.ANULADA)
            .Select(d => new { d.ID_PROVEEDOR, d.MONTO_DEUDA, d.MONTO_PAGADO, d.FECHA_DEUDA })
            .ToListAsync();

        var total = deudas.Sum(d => d.MONTO_DEUDA - d.MONTO_PAGADO);
        var cantidad = deudas.Select(d => d.ID_PROVEEDOR!.Value).Distinct().Count();
        var promedio = deudas.Count > 0 ? Math.Round(total / deudas.Count, 2) : 0m;
        var hoy = DateTime.Today;
        var antiguedad = deudas.Count > 0
            ? Math.Round(deudas.Average(d => (hoy - d.FECHA_DEUDA).TotalDays), 0)
            : 0;

        return new Dataset
        {
            Columns = new List<DatasetColumn>
            {
                new() { Name = "totalDeuda", Type = "currency", Label = "Total a Pagar", Format = "currency" },
                new() { Name = "cantidadProveedores", Type = "number", Label = "Proveedores" },
                new() { Name = "deudaPromedio", Type = "currency", Label = "Deuda Promedio", Format = "currency" },
                new() { Name = "antiguedadPromedioDias", Type = "number", Label = "Antigüedad (días)" },
            },
            Rows = new List<Dictionary<string, object?>>
            {
                new()
                {
                    ["totalDeuda"] = total,
                    ["cantidadProveedores"] = cantidad,
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
