using Microsoft.EntityFrameworkCore;
using PosWeb.Application.Exceptions;
using PosWeb.Contracts;
using PosWeb.Data;
using PosWeb.Domain;

namespace PosWeb.Application.Gastos;

public class GastoService
{
    private readonly PosDbContext _context;

    public GastoService(PosDbContext context)
    {
        _context = context;
    }

    public GastoDto Crear(decimal monto, string detalle, int userId, string? fuentePago = null, decimal? montoPagadoCaja = null)
    {
        if (monto <= 0)
            throw new ArgumentException("El monto debe ser positivo", nameof(monto));

        if (string.IsNullOrWhiteSpace(detalle))
            throw new ArgumentException("El detalle es requerido", nameof(detalle));

        if (detalle.Length > 500)
            throw new ArgumentException("El detalle no puede superar los 500 caracteres", nameof(detalle));

        bool esAhorro = string.Equals(fuentePago, "ahorro", StringComparison.OrdinalIgnoreCase);
        bool esDividir = string.Equals(fuentePago, "dividir", StringComparison.OrdinalIgnoreCase);

        // Find active caja for this user (required for "caja" and "dividir")
        Caja? cajaActiva = null;
        if (!esAhorro)
        {
            cajaActiva = _context.Caja
                .FirstOrDefault(c => c.ID_USUARIO_APERTURA == userId && c.ESTADO == "Abierta");

            if (cajaActiva == null)
                throw new GastoSinCajaActivaException();
        }

        if (esDividir && cajaActiva != null)
        {
            // Split: create Gasto for caja portion + Gasto for ahorro portion
            decimal montoCaja = montoPagadoCaja ?? 0;
            decimal montoAhorro = monto - montoCaja;

            if (montoCaja > 0)
            {
                var gastoCaja = new Gasto(cajaActiva.ID_CAJA, montoCaja, $"{detalle} (Caja)", userId);
                _context.Gasto.Add(gastoCaja);
            }
            if (montoAhorro > 0)
            {
                var gastoAhorro = new Gasto(null, montoAhorro, $"{detalle} (Ahorro)", userId);
                _context.Gasto.Add(gastoAhorro);
            }
            _context.SaveChanges();
            return new GastoDto { Id = 0, CajaId = cajaActiva.ID_CAJA, Monto = monto, Detalle = detalle, Fecha = DateTime.Now };
        }

        int? idCaja = esAhorro ? null : cajaActiva?.ID_CAJA;
        var gasto = new Gasto(idCaja, monto, detalle, userId);
        _context.Gasto.Add(gasto);
        _context.SaveChanges();

        return MapToDto(gasto, GetUsuarioNombre(userId));
    }

    public List<GastoDto> ObtenerPorCaja(int cajaId)
    {
        var gastos = _context.Gasto
            .Where(g => g.ID_CAJA == cajaId)
            .OrderByDescending(g => g.FECHA_GASTO)
            .ToList();

        var usuarioIds = gastos.Select(g => g.ID_USUARIO).Where(id => id.HasValue).Select(id => id!.Value).Distinct().ToList();
        var usuarios = _context.Usuario
            .Where(u => usuarioIds.Contains(u.ID_USUARIO))
            .ToDictionary(u => u.ID_USUARIO, u => u.NOMBRE_USUARIO);

        return gastos.Select(g => MapToDto(g, g.ID_USUARIO.HasValue && usuarios.TryGetValue(g.ID_USUARIO.Value, out var nombre) ? nombre : "")).ToList();
    }

    public List<GastoDto> ObtenerHistorial(int? excluirCajaId = null, DateTime? fechaDesde = null, DateTime? fechaHasta = null)
    {
        IQueryable<Gasto> query = _context.Gasto;

        if (excluirCajaId.HasValue)
            query = query.Where(g => g.ID_CAJA != excluirCajaId.Value);

        if (fechaDesde.HasValue)
        {
            var desde = fechaDesde.Value.Date;
            query = query.Where(g => g.FECHA_GASTO >= desde);
        }

        if (fechaHasta.HasValue)
        {
            var hasta = fechaHasta.Value.Date.AddDays(1);
            query = query.Where(g => g.FECHA_GASTO < hasta);
        }

        var gastos = query
            .OrderByDescending(g => g.FECHA_GASTO)
            .ToList();

        var usuarioIds = gastos.Select(g => g.ID_USUARIO).Where(id => id.HasValue).Select(id => id!.Value).Distinct().ToList();
        var usuarios = _context.Usuario
            .Where(u => usuarioIds.Contains(u.ID_USUARIO))
            .ToDictionary(u => u.ID_USUARIO, u => u.NOMBRE_USUARIO);

        return gastos.Select(g => MapToDto(g, g.ID_USUARIO.HasValue && usuarios.TryGetValue(g.ID_USUARIO.Value, out var nombre) ? nombre : "")).ToList();
    }

    public void Anular(int gastoId)
    {
        Gasto? gasto = _context.Gasto.Find(gastoId);
        if (gasto == null)
            throw new ArgumentException("Gasto no encontrado");

        gasto.Anular();
        _context.SaveChanges();
    }

    private static GastoDto MapToDto(Gasto gasto, string usuarioNombre = "")
    {
        return new GastoDto
        {
            Id = gasto.ID_GASTO,
            CajaId = gasto.ID_CAJA,
            Monto = gasto.MONTO,
            Detalle = gasto.DETALLE,
            Fecha = gasto.FECHA_GASTO,
            Anulado = gasto.ANULADO,
            UsuarioNombre = usuarioNombre,
        };
    }

    private string GetUsuarioNombre(int userId)
    {
        return _context.Usuario
            .Where(u => u.ID_USUARIO == userId)
            .Select(u => u.NOMBRE_USUARIO)
            .FirstOrDefault() ?? "";
    }
}
