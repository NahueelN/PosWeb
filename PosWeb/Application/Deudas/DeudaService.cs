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

    // ── Proveedores ──

    public async Task<List<DeudaDto>> ListarAsync(int? proveedorId = null, bool soloPendientes = false)
    {
        IQueryable<Deuda> query = _context.Deuda.Where(d => d.ID_PROVEEDOR != null);

        if (proveedorId.HasValue && proveedorId.Value > 0)
            query = query.Where(d => d.ID_PROVEEDOR == proveedorId.Value);

        if (soloPendientes)
            query = query.Where(d => !d.PAGO);

        var deudas = await query
            .OrderByDescending(d => d.FECHA_DEUDA)
            .ToListAsync();

        var proveedorIds = deudas
            .Where(d => d.ID_PROVEEDOR.HasValue)
            .Select(d => d.ID_PROVEEDOR!.Value)
            .Distinct()
            .ToList();
        
        var proveedores = await _context.Proveedor
            .Where(p => proveedorIds.Contains(p.ID_PROVEEDOR))
            .ToDictionaryAsync(p => p.ID_PROVEEDOR, p => p.NOMBRE);

        return deudas.Select(d => MapToDto(d, proveedorNombre: proveedores.TryGetValue(d.ID_PROVEEDOR ?? 0, out var nombre) ? nombre : "")).ToList();
    }

    // ── Clientes ──

    public async Task<List<DeudaDto>> ListarClientesAsync(int? clienteId = null, bool soloPendientes = false)
    {
        IQueryable<Deuda> query = _context.Deuda.Where(d => d.ID_CLIENTE != null);

        if (clienteId.HasValue && clienteId.Value > 0)
            query = query.Where(d => d.ID_CLIENTE == clienteId.Value);

        if (soloPendientes)
            query = query.Where(d => !d.PAGO);

        var deudas = await query
            .OrderByDescending(d => d.FECHA_DEUDA)
            .ToListAsync();

        var clienteIds = deudas
            .Where(d => d.ID_CLIENTE.HasValue)
            .Select(d => d.ID_CLIENTE!.Value)
            .Distinct()
            .ToList();

        var clientes = await _context.Cliente
            .Where(c => clienteIds.Contains(c.ID_CLIENTE))
            .ToDictionaryAsync(c => c.ID_CLIENTE, c => c.NOMBRE);

        return deudas.Select(d => MapToDto(d, clienteNombre: clientes.TryGetValue(d.ID_CLIENTE ?? 0, out var nombre) ? nombre : "")).ToList();
    }

    public async Task<DeudaDto> CrearDeudaClienteAsync(int clienteId, int ventaId, decimal monto, decimal? montoPagado = null)
    {
        var deuda = new Deuda(monto, idCliente: clienteId, idVenta: ventaId, montoPagado: montoPagado);
        _context.Deuda.Add(deuda);
        await _context.SaveChangesAsync();

        var cliente = await _context.Cliente.FindAsync(clienteId);
        return MapToDto(deuda, clienteNombre: cliente?.NOMBRE ?? "");
    }

    // ── Común ──

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

        string clienteNombre = "";
        if (deuda.ID_CLIENTE.HasValue)
        {
            var cli = await _context.Cliente.FindAsync(deuda.ID_CLIENTE.Value);
            clienteNombre = cli?.NOMBRE ?? "";
        }

        return MapToDto(deuda, proveedorNombre, clienteNombre);
    }

    public async Task<DeudaDto> RegistrarPagoAsync(int id, decimal? monto = null, int? userId = null)
    {
        var deuda = await _context.Deuda.FindAsync(id);

        if (deuda == null)
            throw new DeudaNoEncontradaException(id);

        if (deuda.PAGO)
            throw new DeudaYaPagadaException(id);

        decimal montoPagado;
        if (monto.HasValue)
        {
            decimal remaining = deuda.MONTO_DEUDA - deuda.MONTO_PAGADO;
            if (monto.Value > remaining)
                throw new ArgumentException("El monto del pago supera el saldo pendiente");
            deuda.RegistrarPago(monto.Value);
            montoPagado = monto.Value;
        }
        else
        {
            montoPagado = deuda.MONTO_DEUDA - deuda.MONTO_PAGADO;
            deuda.RegistrarPago();
        }

        // Record individual payment
        _context.PagoDeuda.Add(new PagoDeuda(deuda.ID_DEUDA, montoPagado, userId));

        // If client debt from a sale, reflect payment in active caja
        if (deuda.ID_CLIENTE != null && deuda.ID_VENTA != null && userId != null)
        {
            var cajaActiva = _context.Caja
                .FirstOrDefault(c => c.ID_USUARIO_APERTURA == userId.Value && c.ESTADO == "Abierta");
            if (cajaActiva != null)
            {
                _context.Pago.Add(new Pago(
                    deuda.ID_VENTA.Value,
                    1, // Efectivo
                    montoPagado,
                    userId.Value,
                    cajaActiva.ID_CAJA,
                    null
                ));
            }
        }

        await _context.SaveChangesAsync();

        return await ObtenerPorIdAsync(id);
    }

    public async Task<List<DeudaDto>> PagarMultipleAsync(int proveedorId, decimal monto, int? userId = null)
    {
        if (monto <= 0)
            throw new ArgumentException("El monto debe ser mayor a cero");

        var pendientesProveedor = await _context.Deuda
            .Where(d => d.ID_PROVEEDOR == proveedorId && d.MONTO_DEUDA > d.MONTO_PAGADO)
            .OrderBy(d => d.FECHA_DEUDA)
            .ToListAsync();

        if (pendientesProveedor.Count == 0)
            throw new ArgumentException("No hay deudas pendientes para este proveedor");

        decimal totalRestante = pendientesProveedor.Sum(d => d.MONTO_DEUDA - d.MONTO_PAGADO);
        // Cap payment to actual pending total (UI may show slightly different number)
        decimal montoEfectivo = Math.Min(monto, totalRestante);

        decimal restante = montoEfectivo;
        foreach (var deuda in pendientesProveedor)
        {
            if (restante <= 0) break;
            decimal saldo = deuda.MONTO_DEUDA - deuda.MONTO_PAGADO;
            decimal pago = Math.Min(restante, saldo);
            deuda.RegistrarPago(pago);
            _context.PagoDeuda.Add(new PagoDeuda(deuda.ID_DEUDA, pago, userId));
            restante -= pago;
        }

        await _context.SaveChangesAsync();

        return await ListarAsync(proveedorId, soloPendientes: false);
    }

    public async Task<List<DeudaDto>> PagarMultipleClienteAsync(int clienteId, decimal monto, int? userId = null)
    {
        if (monto <= 0)
            throw new ArgumentException("El monto debe ser mayor a cero");

        var pendientes = await _context.Deuda
            .Where(d => d.ID_CLIENTE == clienteId && d.MONTO_DEUDA > d.MONTO_PAGADO)
            .OrderBy(d => d.FECHA_DEUDA)
            .ToListAsync();

        if (pendientes.Count == 0)
            throw new ArgumentException("No hay deudas pendientes para este cliente");

        decimal totalRestanteCliente = pendientes.Sum(d => d.MONTO_DEUDA - d.MONTO_PAGADO);
        // Cap payment to actual pending total
        decimal montoEfectivoCliente = Math.Min(monto, totalRestanteCliente);

        decimal restante = montoEfectivoCliente;
        var cajaActiva = userId != null
            ? _context.Caja.FirstOrDefault(c => c.ID_USUARIO_APERTURA == userId.Value && c.ESTADO == "Abierta")
            : null;

        foreach (var deuda in pendientes)
        {
            if (restante <= 0) break;
            decimal saldo = deuda.MONTO_DEUDA - deuda.MONTO_PAGADO;
            decimal pago = Math.Min(restante, saldo);
            deuda.RegistrarPago(pago);
            _context.PagoDeuda.Add(new PagoDeuda(deuda.ID_DEUDA, pago, userId));

            // Reflect client debt payment in active caja
            if (deuda.ID_CLIENTE != null && deuda.ID_VENTA != null && cajaActiva != null)
            {
                _context.Pago.Add(new Pago(
                    deuda.ID_VENTA.Value,
                    1, // Efectivo
                    pago,
                    userId!.Value,
                    cajaActiva.ID_CAJA,
                    null
                ));
            }

            restante -= pago;
        }

        await _context.SaveChangesAsync();

        return await ListarClientesAsync(clienteId, soloPendientes: false);
    }

    public async Task<List<PagoDeudaDto>> ListarPagosAsync(int? clienteId = null, int? proveedorId = null)
    {
        var query = _context.PagoDeuda.AsQueryable();

        if (clienteId.HasValue)
            query = query.Where(p => p.Deuda.ID_CLIENTE == clienteId.Value);
        if (proveedorId.HasValue)
            query = query.Where(p => p.Deuda.ID_PROVEEDOR == proveedorId.Value);

        var pagos = await query
            .OrderByDescending(p => p.FECHA)
            .Select(p => new PagoDeudaDto
            {
                Id = p.ID_PAGO_DEUDA,
                DeudaId = p.ID_DEUDA,
                Monto = p.MONTO,
                Fecha = p.FECHA,
                ClienteNombre = p.Deuda.ID_CLIENTE != null ? _context.Cliente.Where(c => c.ID_CLIENTE == p.Deuda.ID_CLIENTE).Select(c => c.NOMBRE).FirstOrDefault() : null,
                ProveedorNombre = p.Deuda.ID_PROVEEDOR != null ? _context.Proveedor.Where(pr => pr.ID_PROVEEDOR == p.Deuda.ID_PROVEEDOR).Select(pr => pr.NOMBRE).FirstOrDefault() : null,
                UsuarioNombre = p.ID_USUARIO != null ? _context.Usuario.Where(u => u.ID_USUARIO == p.ID_USUARIO).Select(u => u.NOMBRE_USUARIO).FirstOrDefault() : null,
            })
            .ToListAsync();

        return pagos;
    }

    public async Task DeshacerPagoAsync(int pagoDeudaId)
    {
        var pago = await _context.PagoDeuda
            .Include(p => p.Deuda)
            .FirstOrDefaultAsync(p => p.ID_PAGO_DEUDA == pagoDeudaId);

        if (pago == null)
            throw new DeudaNoEncontradaException(pagoDeudaId);

        var deuda = pago.Deuda;
        deuda.DeshacerPago(pago.MONTO);

        _context.PagoDeuda.Remove(pago);
        await _context.SaveChangesAsync();
    }

    public void CrearDeuda(int proveedorId, int compraId, decimal monto, decimal? montoPagado = null)
    {
        var deuda = new Deuda(monto, idProveedor: proveedorId, idCompra: compraId, montoPagado: montoPagado);
        _context.Deuda.Add(deuda);
    }

    private static DeudaDto MapToDto(Deuda d, string proveedorNombre = "", string clienteNombre = "")
    {
        return new DeudaDto(
            Id: d.ID_DEUDA,
            ProveedorNombre: proveedorNombre,
            ClienteNombre: clienteNombre,
            Monto: d.MONTO_DEUDA,
            Fecha: d.FECHA_DEUDA,
            FechaPago: d.FECHA_PAGO,
            Pago: d.PAGO,
            CompraId: d.ID_COMPRA,
            VentaId: d.ID_VENTA,
            ProveedorId: d.ID_PROVEEDOR,
            ClienteId: d.ID_CLIENTE,
            MontoPagado: d.MONTO_PAGADO,
            SaldoPendiente: d.MONTO_DEUDA - d.MONTO_PAGADO
        );
    }

    public async Task<CuentaCorrienteDto> ObtenerCuentaCorrienteAsync(int? clienteId = null, int? proveedorId = null)
    {
        string nombre;
        List<MovimientoCuentaDto> movimientos = new();
        decimal saldoActual = 0;

        if (clienteId.HasValue)
        {
            nombre = await _context.Cliente.Where(c => c.ID_CLIENTE == clienteId).Select(c => c.NOMBRE).FirstOrDefaultAsync() ?? "";
            var deudas = await _context.Deuda
                .Where(d => d.ID_CLIENTE == clienteId)
                .OrderBy(d => d.FECHA_DEUDA)
                .ToListAsync();
            foreach (var d in deudas)
            {
                movimientos.Add(new MovimientoCuentaDto
                {
                    Tipo = "deuda",
                    Fecha = d.FECHA_DEUDA,
                    Monto = d.MONTO_DEUDA,
                    Descripcion = d.ID_VENTA != null ? $"Venta #{d.ID_VENTA}" : "Deuda registrada",
                });
                if (d.MONTO_PAGADO > 0)
                {
                    var pagos = await _context.PagoDeuda
                        .Where(p => p.ID_DEUDA == d.ID_DEUDA)
                        .OrderBy(p => p.FECHA)
                        .ToListAsync();
                    foreach (var p in pagos)
                    {
                        movimientos.Add(new MovimientoCuentaDto
                        {
                            Tipo = "pago",
                            Fecha = p.FECHA,
                            Monto = p.MONTO,
                            PagoId = p.ID_PAGO_DEUDA,
                            Usuario = p.ID_USUARIO != null
                                ? await _context.Usuario.Where(u => u.ID_USUARIO == p.ID_USUARIO).Select(u => u.NOMBRE_USUARIO).FirstOrDefaultAsync()
                                : null,
                        });
                    }
                }
            }
            saldoActual = deudas.Sum(d => d.MONTO_DEUDA - d.MONTO_PAGADO);
        }
        else if (proveedorId.HasValue)
        {
            nombre = await _context.Proveedor.Where(p => p.ID_PROVEEDOR == proveedorId).Select(p => p.NOMBRE).FirstOrDefaultAsync() ?? "";
            var deudas = await _context.Deuda
                .Where(d => d.ID_PROVEEDOR == proveedorId)
                .OrderBy(d => d.FECHA_DEUDA)
                .ToListAsync();
            foreach (var d in deudas)
            {
                movimientos.Add(new MovimientoCuentaDto
                {
                    Tipo = "deuda",
                    Fecha = d.FECHA_DEUDA,
                    Monto = d.MONTO_DEUDA,
                    Descripcion = d.ID_COMPRA != null ? $"Compra #{d.ID_COMPRA}" : "Deuda registrada",
                });
                if (d.MONTO_PAGADO > 0)
                {
                    var pagos = await _context.PagoDeuda
                        .Where(p => p.ID_DEUDA == d.ID_DEUDA)
                        .OrderBy(p => p.FECHA)
                        .ToListAsync();
                    foreach (var p in pagos)
                    {
                        movimientos.Add(new MovimientoCuentaDto
                        {
                            Tipo = "pago",
                            Fecha = p.FECHA,
                            Monto = p.MONTO,
                            PagoId = p.ID_PAGO_DEUDA,
                            Usuario = p.ID_USUARIO != null
                                ? await _context.Usuario.Where(u => u.ID_USUARIO == p.ID_USUARIO).Select(u => u.NOMBRE_USUARIO).FirstOrDefaultAsync()
                                : null,
                        });
                    }
                }
            }
            saldoActual = deudas.Sum(d => d.MONTO_DEUDA - d.MONTO_PAGADO);
        }
        else
        {
            throw new ArgumentException("Debe especificar clienteId o proveedorId");
        }

        movimientos = movimientos.OrderBy(m => m.Fecha).ToList();

        return new CuentaCorrienteDto
        {
            EntidadNombre = nombre,
            SaldoActual = saldoActual,
            Movimientos = movimientos,
        };
    }
}
