using PosWeb.Application.Exceptions;
using PosWeb.Contracts;
using PosWeb.Data;
using PosWeb.Domain;

namespace PosWeb.Application.Sucursales;

public class SucursalService
{
    private readonly PosDbContext _context;

    public SucursalService(PosDbContext context)
    {
        _context = context;
    }

    public List<SucursalDto> ObtenerActivas()
    {
        return _context.Sucursal
            .Where(s => s.ACTIVO)
            .OrderBy(s => s.COD_SUCURSAL)
            .Select(s => new SucursalDto
            {
                Id = s.ID_SUCURSAL,
                Numero = 0,
                Codigo = s.COD_SUCURSAL,
                Nombre = s.DESC_SUCURSAL,
                Activo = s.ACTIVO
            })
            .ToList();
    }

    public SucursalDto Crear(SucursalDto dto)
    {
        Sucursal sucursal = new Sucursal(
            dto.Codigo,
            dto.Nombre,
            1 // Default ID_EMPRESA = 1
        );

        _context.Sucursal.Add(sucursal);
        _context.SaveChanges();

        return new SucursalDto
        {
            Id = sucursal.ID_SUCURSAL,
            Numero = 0,
            Codigo = sucursal.COD_SUCURSAL,
            Nombre = sucursal.DESC_SUCURSAL,
            Activo = sucursal.ACTIVO
        };
    }

    public SucursalDto ObtenerPorId(int id)
    {
        Sucursal? sucursal = _context.Sucursal
            .FirstOrDefault(s => s.ID_SUCURSAL == id && s.ACTIVO);

        if (sucursal == null)
        {
            throw new SucursalNoExisteException(id);
        }

        return new SucursalDto
        {
            Id = sucursal.ID_SUCURSAL,
            Numero = 0,
            Codigo = sucursal.COD_SUCURSAL,
            Nombre = sucursal.DESC_SUCURSAL,
            Activo = sucursal.ACTIVO
        };
    }

    public void Eliminar(int id)
    {
        Sucursal? sucursal = _context.Sucursal.Find(id);

        if (sucursal == null)
        {
            throw new SucursalNoExisteException(id);
        }

        sucursal.Desactivar();
        _context.SaveChanges();
    }
}
