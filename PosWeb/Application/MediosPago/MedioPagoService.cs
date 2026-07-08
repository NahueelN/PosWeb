using PosWeb.Contracts;
using PosWeb.Data;

namespace PosWeb.Application.MediosPago;

public class MedioPagoService
{
    private readonly PosDbContextLocal _context;

    public MedioPagoService(PosDbContextLocal context)
    {
        _context = context;
    }

    public List<MedioPagoDto> ListarActivos()
    {
        return _context.MedioPago
            .Where(m => m.ACTIVO)
            .OrderBy(m => m.DESC_MEDIO_PAGO)
            .Select(m => new MedioPagoDto
            {
                Id = m.ID_MEDIO_PAGO,
                Nombre = m.DESC_MEDIO_PAGO,
                PagaVuelto = m.PAGA_VUELTO,
                Activo = m.ACTIVO
            })
            .ToList();
    }
}
