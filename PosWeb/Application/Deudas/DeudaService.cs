using Microsoft.EntityFrameworkCore;
using PosWeb.Application.Exceptions;
using PosWeb.Contracts;
using PosWeb.Data;
using PosWeb.Domain;

namespace PosWeb.Application.Deudas;

public class DeudaService
{
    private readonly PosDbContext _context;

    public DeudaService(PosDbContext context)
    {
        _context = context;
    }

    public async Task<List<DeudaDto>> ListarAsync(int? proveedorId = null, bool soloPendientes = false)
    {
        IQueryable<Deuda> query = _context.Deuda;

        if (proveedorId.HasValue && proveedorId.Value > 0)
            query = query.Where(d => d.ID_PROVEEDOR == proveedorId.Value);

        if (soloPendientes)
            query = query.Where(d => !d.PAGO);

        var deudas = await query
            .OrderByDescending(d => d.FECHA_DEUDA)
            .ToListAsync();

        // Load proveedor names separately (avoids InMemory Include issues)
        var proveedorIds = deudas
            .Where(d => d.ID_PROVEEDOR.HasValue)
            .Select(d => d.ID_PROVEEDOR!.Value)
            .Distinct()
            .ToList();
        
        var proveedores = await _context.Proveedor
            .Where(p => proveedorIds.Contains(p.ID_PROVEEDOR))
            .ToDictionaryAsync(p => p.ID_PROVEEDOR, p => p.NOMBRE);

        return deudas.Select(d => MapToDto(d, proveedores.TryGetValue(d.ID_PROVEEDOR ?? 0, out var nombre) ? nombre : "")).ToList();
    }

    public async Task<DeudaDto> ObtenerPorIdAsync(int id)
    {
        var deuda = await _context.Deuda
            .FirstOrDefaultAsync(d => d.ID_DEUDA == id);

        if (deuda == null)
            throw new DeudaNoEncontradaException(id);

        string proveedorNombre = "";
        if (deuda.ID_PROVEEDOR.HasValue)
        {
            var prov = await _context.Proveedor.FindAsync(deuda.ID_PROVEEDOR.Value);
            proveedorNombre = prov?.NOMBRE ?? "";
        }

        return MapToDto(deuda, proveedorNombre);
    }

    public async Task<DeudaDto> RegistrarPagoAsync(int id, decimal? monto = null)
    {
        var deuda = await _context.Deuda.FindAsync(id);

        if (deuda == null)
            throw new DeudaNoEncontradaException(id);

        if (deuda.PAGO)
            throw new DeudaYaPagadaException(id);

        if (monto.HasValue)
        {
            decimal remaining = deuda.MONTO_DEUDA - deuda.MONTO_PAGADO;
            if (monto.Value > remaining)
                throw new ArgumentException("El monto del pago supera el saldo pendiente");
            deuda.RegistrarPago(monto.Value);
        }
        else
        {
            deuda.RegistrarPago();
        }

        await _context.SaveChangesAsync();

        return MapToDto(deuda, "");
    }

    public async Task<List<DeudaDto>> PagarMultipleAsync(int proveedorId, decimal monto)
    {
        if (monto <= 0)
            throw new ArgumentException("El monto debe ser mayor a cero");

        var pendientes = await _context.Deuda
            .Where(d => d.ID_PROVEEDOR == proveedorId && !d.PAGO)
            .OrderBy(d => d.FECHA_DEUDA)
            .ToListAsync();

        if (pendientes.Count == 0)
            throw new ArgumentException("No hay deudas pendientes para este proveedor");

        decimal totalRestante = pendientes.Sum(d => d.MONTO_DEUDA - d.MONTO_PAGADO);
        if (monto > totalRestante)
            throw new ArgumentException($"El monto (${monto:F2}) supera el total de deudas pendientes (${totalRestante:F2})");

        decimal restante = monto;
        foreach (var deuda in pendientes)
        {
            if (restante <= 0) break;
            decimal saldo = deuda.MONTO_DEUDA - deuda.MONTO_PAGADO;
            decimal pago = Math.Min(restante, saldo);
            deuda.RegistrarPago(pago);
            restante -= pago;
        }

        await _context.SaveChangesAsync();

        return await ListarAsync(proveedorId, soloPendientes: false);
    }

    public void CrearDeuda(int proveedorId, int compraId, decimal monto, decimal? montoPagado = null)
    {
        var deuda = new Deuda(monto, idProveedor: proveedorId, idCompra: compraId, montoPagado: montoPagado);
        _context.Deuda.Add(deuda);
    }

    private static DeudaDto MapToDto(Deuda d, string proveedorNombre)
    {
        return new DeudaDto(
            Id: d.ID_DEUDA,
            ProveedorNombre: proveedorNombre,
            Monto: d.MONTO_DEUDA,
            Fecha: d.FECHA_DEUDA,
            FechaPago: d.FECHA_PAGO,
            Pago: d.PAGO,
            CompraId: d.ID_COMPRA,
            MontoPagado: d.MONTO_PAGADO,
            SaldoPendiente: d.MONTO_DEUDA - d.MONTO_PAGADO
        );
    }
}
