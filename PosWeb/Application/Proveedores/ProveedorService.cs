using Microsoft.EntityFrameworkCore;
using PosWeb.Application.Exceptions;
using PosWeb.Contracts;
using PosWeb.Data;
using PosWeb.Domain;

namespace PosWeb.Application.Proveedores;

public class ProveedorService
{
    private readonly PosDbContextLocal _context;

    public ProveedorService(PosDbContextLocal context)
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

        // Check duplicate document
        if (!string.IsNullOrWhiteSpace(dto.TipoDocumento) && !string.IsNullOrWhiteSpace(dto.NroDocumento))
        {
            bool docExiste = _context.Proveedor
                .Any(p => p.TIPO_DOCUMENTO == dto.TipoDocumento
                          && p.NRO_DOCUMENTO == dto.NroDocumento
                          && p.ACTIVO);
            if (docExiste)
            {
                throw new ProveedorDocumentoDuplicadoException(dto.TipoDocumento, dto.NroDocumento);
            }
        }

        var proveedor = new Proveedor(
            codigo,
            dto.Nombre.Trim(),
            dto.TipoDocumento,
            dto.NroDocumento,
            dto.Telefono,
            dto.Domicilio,
            dto.Mail,
            dto.IvaCondicion
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

        // Check duplicate document excluding self
        if (!string.IsNullOrWhiteSpace(dto.TipoDocumento) && !string.IsNullOrWhiteSpace(dto.NroDocumento))
        {
            bool docExiste = _context.Proveedor
                .Any(p => p.TIPO_DOCUMENTO == dto.TipoDocumento
                          && p.NRO_DOCUMENTO == dto.NroDocumento
                          && p.ID_PROVEEDOR != id
                          && p.ACTIVO);
            if (docExiste)
            {
                throw new ProveedorDocumentoDuplicadoException(dto.TipoDocumento, dto.NroDocumento);
            }
        }

        proveedor.SetTipoDocumento(dto.TipoDocumento);
        proveedor.SetNroDocumento(dto.NroDocumento);
        proveedor.SetTelefono(dto.Telefono);
        proveedor.SetDomicilio(dto.Domicilio);
        proveedor.SetMail(dto.Mail);
        proveedor.SetIvaCondicion(dto.IvaCondicion);

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
            .Select(d => (decimal?)(d.MONTO_DEUDA - d.MONTO_PAGADO))
            .ToList()
            .Sum() ?? 0;

        var dto = MapToDto(proveedor);
        dto.DeudaPendiente = deudaPendiente;
        return dto;
    }

    public void Desactivar(int id)
    {
        Proveedor? proveedor = _context.Proveedor.Find(id);
        if (proveedor == null || !proveedor.ACTIVO)
            throw new ProveedorNoEncontradoException(id);

        proveedor.Desactivar();
        _context.SaveChanges();
    }

    private decimal CalcularDeudaPendiente(int proveedorId)
    {
        return _context.Deuda
            .Where(d => d.ID_PROVEEDOR == proveedorId && !d.PAGO)
            .Select(d => (decimal?)(d.MONTO_DEUDA - d.MONTO_PAGADO))
            .ToList()
            .Sum() ?? 0;
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
            IvaCondicion = proveedor.IVA_CONDICION,
            Activo = proveedor.ACTIVO
        };
    }
}
