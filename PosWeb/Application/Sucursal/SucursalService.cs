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
        return _context.Sucursales
            .Where(s => s.ACTIVO)
            .OrderBy(s => s.NUMERO)
            .Select(s => new SucursalDto
            {
                Id = s.ID_SUCURSAL,
                Numero = s.NUMERO,
                Codigo = s.CODIGO,
                Nombre = s.NOMBRE,
                Activo = s.ACTIVO
            })
            .ToList();
    }

    public SucursalDto Crear(SucursalDto dto)
    {
        bool numeroExiste = _context.Sucursales
            .Any(s => s.NUMERO == dto.Numero);

        if (numeroExiste)
        {
            throw new ArgumentException("Ya existe una sucursal con ese número");
        }

        Sucursal sucursal = new Sucursal(
            dto.Numero,
            dto.Codigo,
            dto.Nombre
        );

        _context.Sucursales.Add(sucursal);
        _context.SaveChanges();

        return new SucursalDto
        {
            Id = sucursal.ID_SUCURSAL,
            Numero = sucursal.NUMERO,
            Codigo = sucursal.CODIGO,
            Nombre = sucursal.NOMBRE,
            Activo = sucursal.ACTIVO
        };
    }

    public void Eliminar(int id)
    {
        Sucursal? sucursal = _context.Sucursales.Find(id);

        if (sucursal == null)
        {
            throw new ArgumentException("Sucursal inexistente");
        }

        sucursal.Desactivar();
        _context.SaveChanges();
    }
}