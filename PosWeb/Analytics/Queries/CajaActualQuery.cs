using Microsoft.EntityFrameworkCore;
using PosWeb.Analytics.Models;
using PosWeb.Data;

namespace PosWeb.Analytics.Queries;

public class CajaActualQuery : IAnalyticsQuery
{
    public string Id => "caja-actual";
    public string Name => "Caja Actual";

    public async Task<Dataset> ExecuteAsync(int sucursalId, PosDbContextLocal db, DashboardQueryParams? p = null)
    {
        var caja = await db.Caja
            .FirstOrDefaultAsync(c => c.ID_SUCURSAL == sucursalId && c.ESTADO == "Abierta");

        return new Dataset
        {
            Columns = new List<DatasetColumn>
            {
                new() { Name = "estado", Type = "string", Label = "Estado" },
                new() { Name = "montoInicial", Type = "currency", Label = "Monto Inicial", Format = "currency" },
                new() { Name = "fechaApertura", Type = "date", Label = "Fecha Apertura" },
            },
            Rows = new List<Dictionary<string, object?>>
            {
                new()
                {
                    ["estado"] = caja?.ESTADO ?? "cerrada",
                    ["montoInicial"] = caja?.MONTO_INICIAL ?? 0,
                    ["fechaApertura"] = caja?.FECHA_APERTURA,
                }
            },
            Summary = new DatasetSummary
            {
                Total = caja?.MONTO_INICIAL ?? 0
            }
        };
    }
}
