using Microsoft.EntityFrameworkCore;
using PosWeb.Analytics.Models;
using PosWeb.Data;

namespace PosWeb.Analytics.Queries;

/// <summary>
/// Balance de deudas: diferencia entre lo que te deben (clientes) y lo que debés (proveedores).
/// Positivo = neto a favor; negativo = debés más de lo que cobrás.
/// </summary>
public class DeudasResumenQuery : IAnalyticsQuery
{
    public string Id => "deudas-resumen";
    public string Name => "Balance de deudas";

    public async Task<Dataset> ExecuteAsync(int sucursalId, PosDbContextLocal db, DashboardQueryParams? p = null)
    {
        var deudasCliente = await db.Deuda
            .Where(d => d.ID_CLIENTE.HasValue && !d.PAGO && !d.ANULADA)
            .Select(d => new { d.ID_CLIENTE, d.MONTO_DEUDA, d.MONTO_PAGADO })
            .ToListAsync();

        var deudasProveedor = await db.Deuda
            .Where(d => d.ID_PROVEEDOR.HasValue && !d.PAGO && !d.ANULADA)
            .Select(d => new { d.ID_PROVEEDOR, d.MONTO_DEUDA, d.MONTO_PAGADO })
            .ToListAsync();

        var clientesTotal = deudasCliente.Sum(d => d.MONTO_DEUDA - d.MONTO_PAGADO);
        var clientesCantidad = deudasCliente.Select(d => d.ID_CLIENTE!.Value).Distinct().Count();
        var proveedoresTotal = deudasProveedor.Sum(d => d.MONTO_DEUDA - d.MONTO_PAGADO);
        var proveedoresCantidad = deudasProveedor.Select(d => d.ID_PROVEEDOR!.Value).Distinct().Count();

        var balance = clientesTotal - proveedoresTotal;
        var balanceInfo = balance > 0
            ? "A favor: cobrás más de lo que debés"
            : balance < 0
                ? "En contra: debés más de lo que cobrás"
                : "En equilibrio";

        return new Dataset
        {
            Columns = new List<DatasetColumn>
            {
                new() { Name = "balance", Type = "currency", Label = "Balance", Format = "currency" },
                new() { Name = "balanceInfo", Type = "string", Label = "Situación" },
                new() { Name = "clientesCantidad", Type = "number", Label = "Deudores" },
                new() { Name = "proveedoresCantidad", Type = "number", Label = "Acreedores" },
            },
            Rows = new List<Dictionary<string, object?>>
            {
                new()
                {
                    ["balance"] = balance,
                    ["balanceInfo"] = balanceInfo,
                    ["clientesCantidad"] = clientesCantidad,
                    ["proveedoresCantidad"] = proveedoresCantidad,
                }
            },
            Summary = new DatasetSummary
            {
                Total = balance,
                Count = clientesCantidad + proveedoresCantidad,
            }
        };
    }
}
