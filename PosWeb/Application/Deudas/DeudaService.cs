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
        IQueryable<Deuda> query = _context.Deudas;

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
        
        var proveedores = await _context.Proveedores
            .Where(p => proveedorIds.Contains(p.ID_PROVEEDOR))
            .ToDictionaryAsync(p => p.ID_PROVEEDOR, p => p.NOMBRE);

        return deudas.Select(d => new DeudaDto(
            Id: d.ID_DEUDA,
            ProveedorNombre: d.ID_PROVEEDOR.HasValue && proveedores.TryGetValue(d.ID_PROVEEDOR.Value, out var nombre) ? nombre : "",
            Monto: d.MONTO_DEUDA,
            Fecha: d.FECHA_DEUDA,
            FechaPago: d.FECHA_PAGO,
            Pago: d.PAGO,
            CompraId: d.ID_COMPRA
        )).ToList();
    }

    public async Task<DeudaDto> ObtenerPorIdAsync(int id)
    {
        var deuda = await _context.Deudas
            .FirstOrDefaultAsync(d => d.ID_DEUDA == id);

        if (deuda == null)
            throw new DeudaNoEncontradaException(id);

        string proveedorNombre = "";
        if (deuda.ID_PROVEEDOR.HasValue)
        {
            var prov = await _context.Proveedores.FindAsync(deuda.ID_PROVEEDOR.Value);
            proveedorNombre = prov?.NOMBRE ?? "";
        }

        return new DeudaDto(
            Id: deuda.ID_DEUDA,
            ProveedorNombre: proveedorNombre,
            Monto: deuda.MONTO_DEUDA,
            Fecha: deuda.FECHA_DEUDA,
            FechaPago: deuda.FECHA_PAGO,
            Pago: deuda.PAGO,
            CompraId: deuda.ID_COMPRA
        );
    }

    public async Task<DeudaDto> RegistrarPagoAsync(int id)
    {
        var deuda = await _context.Deudas.FindAsync(id);

        if (deuda == null)
            throw new DeudaNoEncontradaException(id);

        if (deuda.PAGO)
            throw new DeudaYaPagadaException(id);

        deuda.RegistrarPago();
        await _context.SaveChangesAsync();

        return new DeudaDto(
            Id: deuda.ID_DEUDA,
            ProveedorNombre: "",
            Monto: deuda.MONTO_DEUDA,
            Fecha: deuda.FECHA_DEUDA,
            FechaPago: deuda.FECHA_PAGO,
            Pago: deuda.PAGO,
            CompraId: deuda.ID_COMPRA
        );
    }

    public void CrearDeuda(int proveedorId, int compraId, decimal monto)
    {
        var deuda = new Deuda(monto, idProveedor: proveedorId, idCompra: compraId);
        _context.Deudas.Add(deuda);
    }
}
