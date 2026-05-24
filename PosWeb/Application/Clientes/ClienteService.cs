using Microsoft.EntityFrameworkCore;
using PosWeb.Application.Exceptions;
using PosWeb.Contracts;
using PosWeb.Data;
using PosWeb.Domain;

namespace PosWeb.Application.Clientes;

public class ClienteService
{
    private readonly PosDbContext _context;

    public ClienteService(PosDbContext context)
    {
        _context = context;
    }

    public PagedResult<ClienteDto> Listar(string? q, int page, int pageSize)
    {
        IQueryable<Cliente> query = _context.Clientes;

        if (!string.IsNullOrWhiteSpace(q))
        {
            q = q.Trim();
            query = query.Where(c =>
                EF.Functions.Like(c.NOMBRE, $"%{q}%") ||
                EF.Functions.Like(c.NUMERO_DOCUMENTO, $"%{q}%")
            );
        }

        var totalCount = query.Count();

        var items = query
            .OrderBy(c => c.NOMBRE)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(c => new ClienteDto
            {
                Id = c.ID_CLIENTE,
                Nombre = c.NOMBRE,
                TipoDocumento = c.TIPO_DOCUMENTO,
                NumeroDocumento = c.NUMERO_DOCUMENTO,
                IvaCondicion = c.IVA_CONDICION,
                Telefono = c.TELEFONO,
                Domicilio = c.DOMICILIO,
                Activo = c.ACTIVO
            })
            .ToList();

        return new PagedResult<ClienteDto>
        {
            Items = items,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };
    }

    public ClienteDto? Obtener(int id)
    {
        Cliente? cliente = _context.Clientes.Find(id);
        if (cliente == null) return null;

        return MapToDto(cliente);
    }

    public ClienteDto Crear(ClienteDto dto)
    {
        // Check duplicate document
        bool duplicado = _context.Clientes
            .Any(c => c.TIPO_DOCUMENTO == dto.TipoDocumento
                      && c.NUMERO_DOCUMENTO == dto.NumeroDocumento
                      && c.ACTIVO);

        if (duplicado)
        {
            throw new ClienteDuplicadoException(dto.TipoDocumento, dto.NumeroDocumento);
        }

        var cliente = new Cliente(
            dto.Nombre,
            dto.TipoDocumento,
            dto.NumeroDocumento,
            dto.IvaCondicion,
            dto.Telefono,
            dto.Domicilio
        );

        _context.Clientes.Add(cliente);
        _context.SaveChanges();

        return MapToDto(cliente);
    }

    public ClienteDto Actualizar(int id, ClienteDto dto)
    {
        Cliente? cliente = _context.Clientes.Find(id);
        if (cliente == null)
        {
            throw new ClienteNoEncontradoException(id);
        }

        // Check duplicate document excluding self
        bool duplicado = _context.Clientes
            .Any(c => c.TIPO_DOCUMENTO == dto.TipoDocumento
                      && c.NUMERO_DOCUMENTO == dto.NumeroDocumento
                      && c.ID_CLIENTE != id
                      && c.ACTIVO);

        if (duplicado)
        {
            throw new ClienteDuplicadoException(dto.TipoDocumento, dto.NumeroDocumento);
        }

        cliente.CambiarNombre(dto.Nombre);
        cliente.CambiarTipoDocumento(dto.TipoDocumento, dto.NumeroDocumento);
        cliente.CambiarIvaCondicion(dto.IvaCondicion);
        cliente.CambiarTelefono(dto.Telefono);
        cliente.CambiarDomicilio(dto.Domicilio);

        _context.SaveChanges();

        return MapToDto(cliente);
    }

    private static ClienteDto MapToDto(Cliente cliente)
    {
        return new ClienteDto
        {
            Id = cliente.ID_CLIENTE,
            Nombre = cliente.NOMBRE,
            TipoDocumento = cliente.TIPO_DOCUMENTO,
            NumeroDocumento = cliente.NUMERO_DOCUMENTO,
            IvaCondicion = cliente.IVA_CONDICION,
            Telefono = cliente.TELEFONO,
            Domicilio = cliente.DOMICILIO,
            Activo = cliente.ACTIVO
        };
    }
}
