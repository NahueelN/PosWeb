using System.Security.Claims;
using PosWeb.Application.Exceptions;
using PosWeb.Contracts;
using PosWeb.Data;
using PosWeb.Domain;

namespace PosWeb.Application.Sucursales;

public class SucursalService
{
    private readonly PosDbContext _context;
    private readonly IHttpContextAccessor? _httpContextAccessor;

    public SucursalService(PosDbContext context, IHttpContextAccessor? httpContextAccessor = null)
    {
        _context = context;
        _httpContextAccessor = httpContextAccessor;
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
            throw new SucursalNumeroDuplicadoException(dto.Numero);
        }

        var titular = ObtenerTitularActual();
        Suscripcion? suscripcion = null;
        if (_httpContextAccessor != null)
        {
            suscripcion = ObtenerSuscripcionTitular(titular);
            if (suscripcion == null)
            {
                throw new UsuarioSinSuscripcionException(titular?.NOMBRE_USUARIO ?? "usuario");
            }

            ValidarCupoSucursales(suscripcion);
        }

        Sucursal sucursal = new Sucursal(
            dto.Numero,
            dto.Codigo,
            dto.Nombre,
            suscripcion?.ID_SUSCRIPCION
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

    public SucursalDto ObtenerPorId(int id)
    {
        Sucursal? sucursal = _context.Sucursales
            .FirstOrDefault(s => s.ID_SUCURSAL == id && s.ACTIVO);

        if (sucursal == null)
        {
            throw new SucursalNoExisteException(id);
        }

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
            throw new SucursalNoExisteException(id);
        }

        sucursal.Desactivar();
        _context.SaveChanges();
    }

    private Usuario? ObtenerTitularActual()
    {
        var userIdValue = _httpContextAccessor?.HttpContext?.User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(userIdValue, out var userId))
        {
            return null;
        }

        var usuario = _context.Usuarios.FirstOrDefault(u => u.ID_USUARIO == userId);
        if (usuario == null)
        {
            return null;
        }

        while (usuario.ID_USUARIO_RESPONSABLE.HasValue)
        {
            var responsable = _context.Usuarios.FirstOrDefault(u => u.ID_USUARIO == usuario.ID_USUARIO_RESPONSABLE.Value);
            if (responsable == null)
            {
                break;
            }

            usuario = responsable;
        }

        return usuario;
    }

    private Suscripcion? ObtenerSuscripcionTitular(Usuario? titular)
    {
        if (titular == null)
        {
            return null;
        }

        return _context.Suscripciones.FirstOrDefault(s => s.ID_USUARIO_TITULAR == titular.ID_USUARIO);
    }

    private void ValidarCupoSucursales(Suscripcion suscripcion)
    {
        if (suscripcion.PermiteSucursalesIlimitadas())
        {
            return;
        }

        var sucursalesActivas = _context.Sucursales.Count(s => s.ID_SUSCRIPCION == suscripcion.ID_SUSCRIPCION && s.ACTIVO);
        if (sucursalesActivas >= suscripcion.MAX_SUCURSALES)
        {
            throw new SuscripcionSinCupoException("sucursales", suscripcion.NIVEL);
        }
    }
}
