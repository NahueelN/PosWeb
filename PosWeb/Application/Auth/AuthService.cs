using PosWeb.Application.Exceptions;
using PosWeb.Contracts;
using PosWeb.Data;
using PosWeb.Domain;
using System.Net.Mail;

namespace PosWeb.Application.Auth;

public class AuthService
{
    private readonly PosDbContext _context;
    private readonly JwtTokenService _jwtTokenService;

    public AuthService(PosDbContext context, JwtTokenService jwtTokenService)
    {
        _context = context;
        _jwtTokenService = jwtTokenService;
    }

    public LoginResponseDto Login(LoginRequestDto request)
    {
        if (string.IsNullOrWhiteSpace(request.Usuario))
        {
            throw new CredencialesInvalidasException();
        }

        if (string.IsNullOrWhiteSpace(request.Password))
        {
            throw new CredencialesInvalidasException();
        }

        Usuario? usuario = _context.Usuarios
            .FirstOrDefault(u => u.NOMBRE_USUARIO == request.Usuario);

        if (usuario == null)
        {
            throw new CredencialesInvalidasException();
        }

        if (!usuario.ACTIVO)
        {
            throw new UsuarioInactivoException(request.Usuario);
        }

        if (!TieneAccesoPorSuscripcion(usuario))
        {
            throw new UsuarioSinSuscripcionException(request.Usuario);
        }

        if (!BCrypt.Net.BCrypt.Verify(request.Password, usuario.PASSWORD_HASH))
        {
            throw new CredencialesInvalidasException();
        }

        var (token, expires) = _jwtTokenService.GenerarToken(usuario, request.SucursalId);

        return new LoginResponseDto
        {
            Token = token,
            ExpiresAt = expires,
            Usuario = new UsuarioInfoDto
            {
                Id = usuario.ID_USUARIO,
                Nombre = usuario.NOMBRE_USUARIO,
                Rol = usuario.ROL
            }
        };
    }

    public LoginResponseDto PinLogin(LoginRequestDto request)
    {
        if (string.IsNullOrWhiteSpace(request.Pin))
        {
            throw new PinNoConfiguradoException();
        }

        Usuario? usuario = _context.Usuarios
            .FirstOrDefault(u => u.NOMBRE_USUARIO == request.Usuario);

        if (usuario == null)
        {
            throw new CredencialesInvalidasException();
        }

        if (!usuario.ACTIVO)
        {
            throw new UsuarioInactivoException(request.Usuario);
        }

        if (!TieneAccesoPorSuscripcion(usuario))
        {
            throw new UsuarioSinSuscripcionException(request.Usuario);
        }

        if (!usuario.TienePin())
        {
            throw new PinNoConfiguradoException();
        }

        // PIN is stored hashed with BCrypt too
        if (!BCrypt.Net.BCrypt.Verify(request.Pin, usuario.PIN_HASH))
        {
            throw new CredencialesInvalidasException();
        }

        var (token, expires) = _jwtTokenService.GenerarToken(usuario, request.SucursalId);

        return new LoginResponseDto
        {
            Token = token,
            ExpiresAt = expires,
            Usuario = new UsuarioInfoDto
            {
                Id = usuario.ID_USUARIO,
                Nombre = usuario.NOMBRE_USUARIO,
                Rol = usuario.ROL
            }
        };
    }

    public RegisterResponseDto Register(RegisterRequestDto request, int? currentUserId = null)
    {
        if (string.IsNullOrWhiteSpace(request.Usuario))
        {
            throw new ArgumentException("Usuario requerido");
        }

        if (string.IsNullOrWhiteSpace(request.Password) || request.Password.Length < 6)
        {
            throw new ArgumentException("Password requerido (mínimo 6 caracteres)");
        }

        if (string.IsNullOrWhiteSpace(request.Mail))
        {
            throw new ArgumentException("Mail requerido");
        }

        try
        {
            _ = new MailAddress(request.Mail);
        }
        catch
        {
            throw new ArgumentException("Mail inválido");
        }

        var nombreUsuario = request.Usuario.Trim();
        var mail = request.Mail.Trim();
        var rol = currentUserId == null
            ? Roles.Admin
            : (request.Rol?.Trim() ?? string.Empty);

        if (_context.Usuarios.Any(u => u.NOMBRE_USUARIO == nombreUsuario))
        {
            throw new ArgumentException("El usuario ya existe");
        }

        int? usuarioResponsableId = rol == Roles.UsuarioComun ? currentUserId : null;
        string? empresaRepresenta = rol == Roles.Admin
            ? request.EmpresaRepresenta?.Trim()
            : null;

        if (rol == Roles.Admin && string.IsNullOrWhiteSpace(empresaRepresenta))
        {
            throw new ArgumentException("Empresa requerida para el alta de administrador");
        }

        var passwordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);

        var nuevoUsuario = new Usuario(
            nombreUsuario,
            passwordHash,
            rol,
            mail,
            usuarioResponsableId: usuarioResponsableId,
            empresaRepresenta: empresaRepresenta);

        _context.Usuarios.Add(nuevoUsuario);
        _context.SaveChanges();

        if (rol == Roles.Admin)
        {
            var suscripcion = Suscripcion.CrearBasica(nuevoUsuario.ID_USUARIO);
            _context.Suscripciones.Add(suscripcion);
            _context.SaveChanges();
        }

        return new RegisterResponseDto
        {
            Id = nuevoUsuario.ID_USUARIO,
            Usuario = nuevoUsuario.NOMBRE_USUARIO,
            Mail = mail,
            Rol = nuevoUsuario.ROL,
            UsuarioResponsableId = nuevoUsuario.ID_USUARIO_RESPONSABLE,
            EmpresaRepresenta = nuevoUsuario.EMPRESA_REPRESENTA
        };
    }

    private bool TieneAccesoPorSuscripcion(Usuario usuario)
    {
        var titular = ObtenerTitularSuscripcion(usuario);
        if (titular == null)
        {
            return usuario.SUSCRIPCION_ACTIVA;
        }

        var suscripcion = _context.Suscripciones
            .FirstOrDefault(s => s.ID_USUARIO_TITULAR == titular.ID_USUARIO);

        if (suscripcion == null)
        {
            return titular.SUSCRIPCION_ACTIVA;
        }

        return suscripcion.EstaActiva();
    }

    private Usuario? ObtenerTitularSuscripcion(Usuario usuario)
    {
        if (!usuario.ID_USUARIO_RESPONSABLE.HasValue)
        {
            return usuario;
        }

        return _context.Usuarios
            .FirstOrDefault(u => u.ID_USUARIO == usuario.ID_USUARIO_RESPONSABLE.Value);
    }
}
