using Microsoft.EntityFrameworkCore;
using PosWeb.Application.Exceptions;
using PosWeb.Contracts;
using PosWeb.Data;
using PosWeb.Domain;

namespace PosWeb.Application.Proveedores;

public class ProveedorService
{
    private readonly PosDbContext _context;

    public ProveedorService(PosDbContext context)
    {
        _context = context;
    }

    public List<ProveedorDto> Listar(string? search = null)
    {
        IQueryable<Proveedor> query = _context.Proveedores.Where(p => p.ACTIVO);

        if (!string.IsNullOrWhiteSpace(search))
        {
            string pattern = $"%{search}%";
            query = query.Where(p =>
                EF.Functions.Like(p.NOMBRE, pattern) ||
                EF.Functions.Like(p.COD_PROVEEDOR, pattern) ||
                EF.Functions.Like(p.NRO_DOCUMENTO ?? "", pattern));
        }

        return query
            .OrderBy(p => p.NOMBRE)
            .Select(p => MapToDto(p))
            .ToList();
    }

    public ProveedorDto Crear(CrearProveedorRequestDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Nombre))
            throw new ArgumentException("El nombre del proveedor es requerido");

        // Auto-generate COD_PROVEEDOR from NOMBRE: first 50 chars, uppercase, trimmed
        string codigo = dto.Nombre.Trim().ToUpperInvariant();
        if (codigo.Length > 50)
            codigo = codigo[..50];

        // Check duplicate codigo
        bool codigoExiste = _context.Proveedores
            .Any(p => p.COD_PROVEEDOR == codigo && p.ACTIVO);

        if (codigoExiste)
        {
            throw new ProveedorCodigoDuplicadoException(codigo);
        }

        var proveedor = new Proveedor(
            codigo,
            dto.Nombre.Trim(),
            dto.TipoDocumento,
            dto.NroDocumento,
            dto.Telefono,
            dto.Domicilio,
            dto.Mail
        );

        _context.Proveedores.Add(proveedor);
        _context.SaveChanges();

        return MapToDto(proveedor);
    }

    public ProveedorDto ObtenerPorId(int id)
    {
        Proveedor? proveedor = _context.Proveedores.Find(id);

        if (proveedor == null || !proveedor.ACTIVO)
        {
            throw new ProveedorNoEncontradoException(id);
        }

        return MapToDto(proveedor);
    }

    private static ProveedorDto MapToDto(Proveedor proveedor)
    {
        return new ProveedorDto
        {
            Id = proveedor.ID_PROVEEDOR,
            Codigo = proveedor.COD_PROVEEDOR,
            Nombre = proveedor.NOMBRE,
            TipoDocumento = proveedor.TIPO_DOCUMENTO,
            NroDocumento = proveedor.NRO_DOCUMENTO,
            Telefono = proveedor.TELEFONO,
            Domicilio = proveedor.DOMICILIO,
            Mail = proveedor.MAIL,
            Activo = proveedor.ACTIVO
        };
    }
}
