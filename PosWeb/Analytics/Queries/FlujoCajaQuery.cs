using Microsoft.EntityFrameworkCore;
using PosWeb.Analytics.Models;
using PosWeb.Data;

namespace PosWeb.Analytics.Queries;

/// <summary>
/// Flujo de caja del período: ingresos (ventas + cobros de deudas) menos
/// egresos (compras + gastos operativos). Devuelve el neto.
/// </summary>
public class FlujoCajaQuery : IAnalyticsQuery
{
    public string Id => "flujo-caja";
    public string Name => "Flujo de caja";

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
            .Select(v => (decimal?)v.TOTAL)
            .ToListAsync();

        var cobros = await db.PagoDeuda
            .Where(pd => !pd.ANULADO && pd.FECHA >= inicio && pd.FECHA < fin)
            .Select(pd => (decimal?)pd.MONTO)
            .ToListAsync();

        var compras = await db.Compra
            .Where(c => c.ID_SUCURSAL == sucursalId && c.FECHA_COMPRA >= inicio && c.FECHA_COMPRA < fin)
            .Select(c => (decimal?)c.TOTAL)
            .ToListAsync();

        var gastos = await db.Gasto
            .Where(g => !g.ANULADO && g.ID_CAJA != null && g.FECHA_GASTO >= inicio && g.FECHA_GASTO < fin)
            .Select(g => (decimal?)g.MONTO)
            .ToListAsync();

        var ingresos = ventas.Sum() + cobros.Sum();
        var egresos = compras.Sum() + gastos.Sum();
        var neto = ingresos - egresos;

        return new Dataset
        {
            Columns = new List<DatasetColumn>
            {
                new() { Name = "neto", Type = "currency", Label = "Flujo Neto", Format = "currency" },
                new() { Name = "ingresos", Type = "currency", Label = "Ingresos", Format = "currency" },
                new() { Name = "egresos", Type = "currency", Label = "Egresos", Format = "currency" },
            },
            Rows = new List<Dictionary<string, object?>>
            {
                new()
                {
                    ["neto"] = neto,
                    ["ingresos"] = ingresos,
                    ["egresos"] = egresos,
                }
            },
            Summary = new DatasetSummary
            {
                Total = neto,
            }
        };
    }
}
