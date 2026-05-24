using PosWeb.Contracts;
using PosWeb.Data;

namespace PosWeb.Application.MediosPago;

public class MedioPagoService
{
    private readonly PosDbContext _context;

    public MedioPagoService(PosDbContext context)
    {
        _context = context;
    }

    public List<MedioPagoDto> ListarActivos()
    {
        return _context.MediosPago
            .Where(m => m.ACTIVO)
            .OrderBy(m => m.NOMBRE)
            .Select(m => new MedioPagoDto
            {
                Id = m.ID_MEDIO_PAGO,
                Nombre = m.NOMBRE,
                PagaVuelto = m.PAGA_VUELTO,
                Activo = m.ACTIVO
            })
            .ToList();
    }
}
