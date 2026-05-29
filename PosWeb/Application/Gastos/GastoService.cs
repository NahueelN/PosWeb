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

    public GastoDto Crear(decimal monto, string detalle, int userId)
    {
        if (monto <= 0)
            throw new ArgumentException("El monto debe ser positivo", nameof(monto));

        if (string.IsNullOrWhiteSpace(detalle))
            throw new ArgumentException("El detalle es requerido", nameof(detalle));

        if (detalle.Length > 500)
            throw new ArgumentException("El detalle no puede superar los 500 caracteres", nameof(detalle));

        // Find active caja for this user
        Caja? cajaActiva = _context.Cajas
            .FirstOrDefault(c => c.ID_USUARIO_APERTURA == userId && c.ESTADO == "Abierta");

        if (cajaActiva == null)
        {
            throw new GastoSinCajaActivaException();
        }

        var gasto = new Gasto(cajaActiva.ID_CAJA, monto, detalle);
        _context.Gastos.Add(gasto);
        _context.SaveChanges();

        return MapToDto(gasto);
    }

    public List<GastoDto> ObtenerPorCaja(int cajaId)
    {
        return _context.Gastos
            .Where(g => g.ID_CAJA == cajaId)
            .OrderByDescending(g => g.FECHA)
            .Select(g => MapToDto(g))
            .ToList();
    }

    private static GastoDto MapToDto(Gasto gasto)
    {
        return new GastoDto
        {
            Id = gasto.ID_GASTO,
            CajaId = gasto.ID_CAJA,
            Monto = gasto.MONTO,
            Detalle = gasto.DETALLE,
            Fecha = gasto.FECHA,
        };
    }
}
