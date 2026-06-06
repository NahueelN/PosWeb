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
        IQueryable<Proveedor> query = _context.Proveedor.Where(p => p.ACTIVO);

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
        bool codigoExiste = _context.Proveedor
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

        _context.Proveedor.Add(proveedor);
        _context.SaveChanges();

        return MapToDto(proveedor);
    }

    public ProveedorDto Actualizar(int id, CrearProveedorRequestDto dto)
    {
        Proveedor? proveedor = _context.Proveedor.Find(id);
        if (proveedor == null || !proveedor.ACTIVO)
            throw new ProveedorNoEncontradoException(id);

        if (!string.IsNullOrWhiteSpace(dto.Nombre))
        {
            proveedor.CambiarNombre(dto.Nombre.Trim());
            string codigo = dto.Nombre.Trim().ToUpperInvariant();
            if (codigo.Length > 50) codigo = codigo[..50];
            proveedor.CambiarCodigo(codigo);
        }

        proveedor.SetTipoDocumento(dto.TipoDocumento);
        proveedor.SetNroDocumento(dto.NroDocumento);
        proveedor.SetTelefono(dto.Telefono);
        proveedor.SetDomicilio(dto.Domicilio);
        proveedor.SetMail(dto.Mail);

        _context.SaveChanges();
        return ObtenerPorId(id);
    }

    public ProveedorDto ObtenerPorId(int id)
    {
        Proveedor? proveedor = _context.Proveedor.Find(id);

        if (proveedor == null || !proveedor.ACTIVO)
        {
            throw new ProveedorNoEncontradoException(id);
        }

        var deudaPendiente = _context.Deuda
            .Where(d => d.ID_PROVEEDOR == id && !d.PAGO)
            .Sum(d => (decimal?)(d.MONTO_DEUDA - d.MONTO_PAGADO)) ?? 0;

        var dto = MapToDto(proveedor);
        dto.DeudaPendiente = deudaPendiente;
        return dto;
    }

    private decimal CalcularDeudaPendiente(int proveedorId)
    {
        return _context.Deuda
            .Where(d => d.ID_PROVEEDOR == proveedorId && !d.PAGO)
            .Sum(d => (decimal?)(d.MONTO_DEUDA - d.MONTO_PAGADO)) ?? 0;
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
