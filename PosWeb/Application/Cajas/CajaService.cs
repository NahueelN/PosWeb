using Microsoft.EntityFrameworkCore;
using PosWeb.Application.Exceptions;
using PosWeb.Contracts;
using PosWeb.Data;
using PosWeb.Domain;

namespace PosWeb.Application.Cajas;

public class CajaService
{
    private readonly PosDbContext _context;

    public CajaService(PosDbContext context)
    {
        _context = context;
    }

    public CajaDto Abrir(AbrirCajaRequest request, int userId)
    {
        // Each user can only have one open caja (across all sucursales)
        bool tieneCajaActiva = _context.Caja
            .Any(c => c.ID_USUARIO_APERTURA == userId && c.ESTADO == "Abierta");

        if (tieneCajaActiva)
        {
            throw new CajaYaAbiertaException(userId);
        }

        Sucursal? sucursal = _context.Sucursal.Find(request.SucursalId);
        if (sucursal == null)
        {
            throw new SucursalNoExisteException(request.SucursalId);
        }

        if (!sucursal.ACTIVO)
        {
            throw new SucursalInactivaException(request.SucursalId);
        }

        var caja = new Caja(request.SucursalId, request.MontoInicial, userId);
        _context.Caja.Add(caja);
        _context.SaveChanges();

        return MapToDto(caja);
    }

    public CajaDto Cerrar(int cajaId, CerrarCajaRequest request, int userId)
    {
        Caja? caja = _context.Caja.Find(cajaId);

        if (caja == null || caja.ESTADO != "Abierta")
        {
            throw new CajaNoEncontradaException(cajaId);
        }

        try
        {
            caja.Cerrar(request.MontoContadoEfectivo, request.MontoContadoTarjetas, userId, request.Gastos);
        }
        catch (ArgumentException ex)
        {
            throw new CajaException(ex.Message);
        }

        // Calculate total sales in this caja — via Pagos.ID_CAJA (Venta.ID_CAJA removed in PR 1)
        // Note: materialize first — SQLite can't SUM(decimal) server-side
        var ventaIdsParaCaja = _context.Pago
            .Where(p => p.ID_CAJA == cajaId)
            .Select(p => p.ID_VENTA)
            .Distinct()
            .ToList();

        List<decimal> montosVentas = _context.Venta
            .Where(v => ventaIdsParaCaja.Contains(v.ID_VENTA))
            .Select(v => v.TOTAL)
            .ToList();

        decimal totalVentas = montosVentas.Sum();

        try
        {
            caja.SetDiferencia(totalVentas);
        }
        catch (InvalidOperationException ex)
        {
            throw new CajaException(ex.Message);
        }

        _context.SaveChanges();

        var dto = MapToDto(caja);
        dto.TotalVentas = totalVentas;
        dto.Gastos = request.Gastos;
        dto.Esperado = caja.MONTO_INICIAL + totalVentas - caja.MONTO_GASTOS;
        dto.DesglosePagos = GetDesglosePagos(cajaId);

        return dto;
    }

    private List<PagoPorMedioDto> GetDesglosePagos(int cajaId)
    {
        // Get venta IDs for this caja — via Pagos.ID_CAJA (Venta.ID_CAJA removed in PR 1)
        var ventaIds = _context.Pago
            .Where(p => p.ID_CAJA == cajaId)
            .Select(p => p.ID_VENTA)
            .Distinct()
            .ToList();

        if (ventaIds.Count == 0) return new();

        // Materialize raw payment data, then group/sum client-side (SQLite can't SUM(decimal))
        var pagosRaw = _context.Pago
            .Where(p => ventaIds.Contains(p.ID_VENTA))
            .Select(p => new { p.ID_MEDIO_PAGO, p.MONTO })
            .ToList();

        var medios = _context.MedioPago
            .Select(m => new { m.ID_MEDIO_PAGO, m.DESC_MEDIO_PAGO, m.PAGA_VUELTO })
            .ToList();

        return pagosRaw
            .GroupBy(p => p.ID_MEDIO_PAGO)
            .Select(g =>
            {
                var medio = medios.FirstOrDefault(m => m.ID_MEDIO_PAGO == g.Key);
                return new PagoPorMedioDto
                {
                    IdMedioPago = g.Key,
                    MedioPago = medio?.DESC_MEDIO_PAGO ?? "Otro",
                    Monto = g.Sum(p => p.MONTO),
                    PagaVuelto = medio?.PAGA_VUELTO ?? false,
                };
            })
            .OrderByDescending(p => p.Monto)
            .ToList();
    }

    public CierrePreviewDto? ObtenerPreviewCierre(int cajaId)
    {
        Caja? caja = _context.Caja.Find(cajaId);
        if (caja == null || caja.ESTADO != "Abierta") return null;

        var ventaIdsPreview = _context.Pago
            .Where(p => p.ID_CAJA == cajaId)
            .Select(p => p.ID_VENTA)
            .Distinct()
            .ToList();

        List<decimal> montosVentas = _context.Venta
            .Where(v => ventaIdsPreview.Contains(v.ID_VENTA))
            .Select(v => v.TOTAL)
            .ToList();

        // Materialize gasto amounts then sum client-side (SQLite can't SUM(decimal))
        List<decimal> montosGastos = _context.Gasto
            .Where(g => g.ID_CAJA == cajaId)
            .Select(g => g.MONTO)
            .ToList();

        return new CierrePreviewDto
        {
            CajaId = cajaId,
            MontoInicial = caja.MONTO_INICIAL,
            TotalVentas = montosVentas.Sum(),
            TotalGastos = montosGastos.Sum(),
            DesglosePagos = GetDesglosePagos(cajaId),
        };
    }

    public CajaDto? ObtenerActiva(int sucursalId, int userId)
    {
        Caja? caja = _context.Caja
            .FirstOrDefault(c => c.ID_USUARIO_APERTURA == userId && c.ESTADO == "Abierta");

        if (caja == null) return null;

        return MapToDto(caja);
    }

    public CajaDto? ObtenerPorId(int cajaId)
    {
        Caja? caja = _context.Caja.Find(cajaId);
        return caja == null ? null : MapToDto(caja);
    }

    private CajaDto MapToDto(Caja caja)
    {
        string usuarioApertura = _context.Usuario
            .Where(u => u.ID_USUARIO == caja.ID_USUARIO_APERTURA)
            .Select(u => u.NOMBRE_USUARIO)
            .FirstOrDefault() ?? "";

        string? usuarioCierre = null;
        if (caja.ID_USUARIO_CIERRE.HasValue)
        {
            usuarioCierre = _context.Usuario
                .Where(u => u.ID_USUARIO == caja.ID_USUARIO_CIERRE.Value)
                .Select(u => u.NOMBRE_USUARIO)
                .FirstOrDefault();
        }

        return new CajaDto
        {
            Id = caja.ID_CAJA,
            SucursalId = caja.ID_SUCURSAL,
            Estado = caja.ESTADO,
            FechaApertura = caja.FECHA_APERTURA,
            FechaCierre = caja.FECHA_CIERRE,
            MontoInicial = caja.MONTO_INICIAL,
            MontoContadoEfectivo = caja.MONTO_CONTADO_EFECTIVO,
            MontoContadoTarjetas = caja.MONTO_CONTADO_TARJETAS,
            Diferencia = caja.DIFERENCIA,
            UsuarioApertura = usuarioApertura,
            UsuarioCierre = usuarioCierre
        };
    }
}
