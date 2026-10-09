using Microsoft.EntityFrameworkCore;
using PosWeb.Analytics.Models;
using PosWeb.Data;

namespace PosWeb.Analytics.Queries;

/// <summary>
/// Resumen de deudas: total y cantidad de clientes vs. proveedores.
/// </summary>
public class DeudasResumenQuery : IAnalyticsQuery
{
    public string Id => "deudas-resumen";
    public string Name => "Deudas (clientes vs proveedores)";

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

        return new Dataset
        {
            Columns = new List<DatasetColumn>
            {
                new() { Name = "clientesTotal", Type = "currency", Label = "A Cobrar (clientes)", Format = "currency" },
                new() { Name = "proveedoresTotal", Type = "currency", Label = "A Pagar (proveedores)", Format = "currency" },
                new() { Name = "clientesCantidad", Type = "number", Label = "Deudores" },
                new() { Name = "proveedoresCantidad", Type = "number", Label = "Acreedores" },
            },
            Rows = new List<Dictionary<string, object?>>
            {
                new()
                {
                    ["clientesTotal"] = clientesTotal,
                    ["proveedoresTotal"] = proveedoresTotal,
                    ["clientesCantidad"] = clientesCantidad,
                    ["proveedoresCantidad"] = proveedoresCantidad,
                }
            },
            Summary = new DatasetSummary
            {
                Total = clientesTotal,
                Count = clientesCantidad + proveedoresCantidad,
            }
        };
    }
}
