using Microsoft.EntityFrameworkCore;
using PosWeb.Analytics.Models;
using PosWeb.Data;

namespace PosWeb.Analytics.Queries;

public class AlertasQuery : IAnalyticsQuery
{
    public string Id => "alertas";
    public string Name => "Alertas";

    public async Task<Dataset> ExecuteAsync(int sucursalId, PosDbContextLocal db, DashboardQueryParams? p = null)
    {
        var stockBajoTask = db.StockSucursal
            .Where(s => s.ID_SUCURSAL == sucursalId && s.STOCK <= 5)
            .CountAsync();

        var deudasProveedorTask = db.Deuda
            .Where(d => d.ID_PROVEEDOR.HasValue && !d.PAGO)
            .CountAsync();

        var deudasClienteTask = db.Deuda
            .Where(d => d.ID_CLIENTE.HasValue && !d.PAGO)
            .CountAsync();

        var pedidosPendientesTask = db.Pedido
            .Where(p => p.ID_SUCURSAL == sucursalId && p.ESTADO == "Pendiente")
            .CountAsync();

        var cajaAbiertaTask = db.Caja
            .AnyAsync(c => c.ID_SUCURSAL == sucursalId && c.ESTADO == "Abierta");

        var hoy = DateTime.Today;
        var finHoy = hoy.AddDays(1);
        var comprasPendientesTask = db.Compra
            .Where(c => c.ID_SUCURSAL == sucursalId
                        && c.FECHA_COMPRA >= hoy
                        && c.FECHA_COMPRA < finHoy)
            .CountAsync();

        await Task.WhenAll(stockBajoTask, deudasProveedorTask, deudasClienteTask,
                           pedidosPendientesTask, cajaAbiertaTask, comprasPendientesTask);

        return new Dataset
        {
            Columns = new List<DatasetColumn>
            {
                new() { Name = "stockBajo", Type = "number", Label = "Stock Bajo" },
                new() { Name = "deudasProveedor", Type = "number", Label = "Deudas Proveedor" },
                new() { Name = "deudasCliente", Type = "number", Label = "Deudas Cliente" },
                new() { Name = "pedidosPendientes", Type = "number", Label = "Pedidos Pendientes" },
                new() { Name = "comprasPendientes", Type = "number", Label = "Compras Pendientes" },
                new() { Name = "cajaAbierta", Type = "boolean", Label = "Caja Abierta" },
            },
            Rows = new List<Dictionary<string, object?>>
            {
                new()
                {
                    ["stockBajo"] = await stockBajoTask,
                    ["deudasProveedor"] = await deudasProveedorTask,
                    ["deudasCliente"] = await deudasClienteTask,
                    ["pedidosPendientes"] = await pedidosPendientesTask,
                    ["comprasPendientes"] = await comprasPendientesTask,
                    ["cajaAbierta"] = await cajaAbiertaTask,
                }
            }
        };
    }
}
