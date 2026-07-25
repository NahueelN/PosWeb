using Microsoft.EntityFrameworkCore;
using PosWeb.Analytics.Models;
using PosWeb.Data;

namespace PosWeb.Analytics.Queries;

public class ActividadRecienteQuery : IAnalyticsQuery
{
    public string Id => "actividad-reciente";
    public string Name => "Actividad Reciente";

    public async Task<Dataset> ExecuteAsync(int sucursalId, PosDbContextLocal db, DashboardQueryParams? p = null)
    {
        var hoy = DateTime.Today;
        var fin = hoy.AddDays(1);
        var limit = p?.ActivityLimit ?? 15;
        var actividad = new List<Dictionary<string, object?>>();

        // Ventas de hoy — materializar con tipo anónimo, convertir a Dictionary en memoria
        var ventasRaw = await db.Venta
            .Where(v => v.ID_SUCURSAL == sucursalId
                        && v.FECHA_VENTA >= hoy
                        && v.FECHA_VENTA < fin
                        && !v.ANULADA)
            .OrderByDescending(v => v.FECHA_VENTA)
            .Take(20)
            .Select(v => new { Tipo = "venta", Descripcion = $"Venta #{v.ID_VENTA}", Fecha = v.FECHA_VENTA, Monto = (decimal?)v.TOTAL })
            .ToListAsync();
        actividad.AddRange(ventasRaw.Select(v => new Dictionary<string, object?>
        {
            ["tipo"] = v.Tipo, ["descripcion"] = v.Descripcion, ["fecha"] = v.Fecha, ["monto"] = v.Monto
        }));

        // Compras de hoy
        var comprasRaw = await db.Compra
            .Where(c => c.ID_SUCURSAL == sucursalId
                        && c.FECHA_COMPRA >= hoy
                        && c.FECHA_COMPRA < fin)
            .OrderByDescending(c => c.FECHA_COMPRA)
            .Take(10)
            .Select(c => new { Tipo = "compra", Descripcion = $"Compra #{c.ID_COMPRA}", Fecha = c.FECHA_COMPRA, Monto = (decimal?)c.TOTAL })
            .ToListAsync();
        actividad.AddRange(comprasRaw.Select(c => new Dictionary<string, object?>
        {
            ["tipo"] = c.Tipo, ["descripcion"] = c.Descripcion, ["fecha"] = c.Fecha, ["monto"] = c.Monto
        }));

        // Gastos de hoy
        var gastosRaw = await db.Gasto
            .Where(g => g.FECHA_GASTO >= hoy
                        && g.FECHA_GASTO < fin
                        && !g.ANULADO
                        && g.ID_CAJA != null)
            .OrderByDescending(g => g.FECHA_GASTO)
            .Take(10)
            .Select(g => new { Tipo = "gasto", Descripcion = g.DETALLE, Fecha = g.FECHA_GASTO, Monto = (decimal?)g.MONTO })
            .ToListAsync();
        actividad.AddRange(gastosRaw.Select(g => new Dictionary<string, object?>
        {
            ["tipo"] = g.Tipo, ["descripcion"] = g.Descripcion, ["fecha"] = g.Fecha, ["monto"] = g.Monto
        }));

        // Caja apertura/cierre hoy
        var cajasRaw = await db.Caja
            .Where(c => c.ID_SUCURSAL == sucursalId)
            .OrderByDescending(c => c.FECHA_APERTURA)
            .Take(10)
            .Select(c => new
            {
                Tipo = "caja",
                Descripcion = c.ESTADO == "Abierta" ? "Apertura de caja" : "Cierre de caja",
                Fecha = c.ESTADO == "Abierta" ? c.FECHA_APERTURA : (c.FECHA_CIERRE ?? c.FECHA_APERTURA),
                Monto = (decimal?)c.MONTO_INICIAL
            })
            .ToListAsync();
        actividad.AddRange(cajasRaw.Select(c => new Dictionary<string, object?>
        {
            ["tipo"] = c.Tipo, ["descripcion"] = c.Descripcion, ["fecha"] = c.Fecha, ["monto"] = c.Monto
        }));

        var rows = actividad
            .OrderByDescending(a => a["fecha"])
            .Take(limit)
            .ToList();

        return new Dataset
        {
            Columns = new List<DatasetColumn>
            {
                new() { Name = "tipo", Type = "string", Label = "Tipo" },
                new() { Name = "descripcion", Type = "string", Label = "Descripción" },
                new() { Name = "fecha", Type = "date", Label = "Fecha" },
                new() { Name = "monto", Type = "currency", Label = "Monto", Format = "currency" },
            },
            Rows = rows,
            Summary = new DatasetSummary
            {
                Count = rows.Count
            }
        };
    }
}
