using PosWeb.Application.Exceptions;
using PosWeb.Application.Licensing;
using PosWeb.Contracts;
using PosWeb.Data;
using PosWeb.Domain;
using System.Net.Mail;

namespace PosWeb.Application.Auth;

public class AuthService
{
    private readonly PosDbContextLocal _context;
    private readonly JwtTokenService _jwtTokenService;
    private readonly LicenciaService _licenciaService;

    public AuthService(PosDbContextLocal context, JwtTokenService jwtTokenService, LicenciaService licenciaService)
    {
        _context = context;
        _jwtTokenService = jwtTokenService;
        _licenciaService = licenciaService;
    }

    public async Task<LoginResponseDto> Login(LoginRequestDto request)
    {
        if (string.IsNullOrWhiteSpace(request.Usuario))
        {
            throw new CredencialesInvalidasException();
        }

        if (string.IsNullOrWhiteSpace(request.Password))
        {
            throw new CredencialesInvalidasException();
        }

        Usuario? usuario = _context.Usuario
            .FirstOrDefault(u => u.NOMBRE_USUARIO == request.Usuario);

        if (usuario == null)
        {
            throw new CredencialesInvalidasException();
        }

        if (!usuario.ACTIVO)
        {
            throw new UsuarioInactivoException(request.Usuario);
        }

        if (!await VerificarOActivarLicencia(usuario))
        {
            throw new LicenciaInvalidaException("No hay licencia configurada o la licencia no es válida");
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

    public async Task<LoginResponseDto> PinLogin(LoginRequestDto request)
    {
        if (string.IsNullOrWhiteSpace(request.Pin))
        {
            throw new PinNoConfiguradoException();
        }

        Usuario? usuario = _context.Usuario
            .FirstOrDefault(u => u.NOMBRE_USUARIO == request.Usuario);

        if (usuario == null)
        {
            throw new CredencialesInvalidasException();
        }

        if (!usuario.ACTIVO)
        {
            throw new UsuarioInactivoException(request.Usuario);
        }

        if (!await VerificarOActivarLicencia(usuario))
        {
            throw new LicenciaInvalidaException("No hay licencia configurada o la licencia no es válida");
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

    public UsuarioDto? GetCurrentUser(int userId)
    {
        var usuario = _context.Usuario.FirstOrDefault(u => u.ID_USUARIO == userId);
        if (usuario == null) return null;

        string? responsableNombre = null;
        if (usuario.ID_USUARIO_RESP.HasValue)
        {
            responsableNombre = _context.Usuario
                .Where(u => u.ID_USUARIO == usuario.ID_USUARIO_RESP.Value)
                .Select(u => u.NOMBRE_USUARIO)
                .FirstOrDefault();
        }

        return new UsuarioDto
        {
            Id = usuario.ID_USUARIO,
            NombreUsuario = usuario.NOMBRE_USUARIO,
            Mail = usuario.MAIL,
            Rol = usuario.ROL,
            UsuarioResponsableId = usuario.ID_USUARIO_RESP,
            UsuarioResponsableNombre = responsableNombre,
            Activo = usuario.ACTIVO,
            PinConfigurado = !string.IsNullOrEmpty(usuario.PIN_HASH),
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

        if (!Roles.Todos.Contains(rol) && rol != string.Empty)
        {
            throw new ArgumentException($"Rol inválido: {rol}. Debe ser uno de: {string.Join(", ", Roles.Todos)}");
        }

        if (string.IsNullOrEmpty(rol))
        {
            throw new ArgumentException("El rol es requerido");
        }

        if (_context.Usuario.Any(u => u.NOMBRE_USUARIO == nombreUsuario))
        {
            throw new ArgumentException("El usuario ya existe");
        }

        if (rol == Roles.Admin)
        {
            var adminCount = _context.Usuario.Count(u => u.ROL == Roles.Admin && u.ACTIVO);
            var limites = _licenciaService.ObtenerLimitesPlan();
            if (adminCount >= limites.maxAdmins)
                throw new SuscripcionSinCupoException("administradores", "actual");
        }
        else if (rol == Roles.UsuarioComun)
        {
            var userCount = _context.Usuario.Count(u => u.ROL == Roles.UsuarioComun && u.ACTIVO);
            var limites = _licenciaService.ObtenerLimitesPlan();
            if (userCount >= limites.maxUsuarios)
                throw new SuscripcionSinCupoException("usuarios", "actual");
        }

        int? usuarioResponsableId = rol == Roles.UsuarioComun ? currentUserId : null;

        int? empresaId = request.EmpresaId;

        var passwordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);

        var nuevoUsuario = new Usuario(
            nombreUsuario,
            passwordHash,
            rol,
            mail,
            usuarioResponsableId: usuarioResponsableId,
            empresaId: empresaId);

        _context.Usuario.Add(nuevoUsuario);
        _context.SaveChanges();

        if (rol == Roles.Admin)
        {
            var suscripcion = Suscripcion.CrearBasica(nuevoUsuario.ID_USUARIO);
            _context.Suscripcion.Add(suscripcion);
            _context.SaveChanges();
        }

        return new RegisterResponseDto
        {
            Id = nuevoUsuario.ID_USUARIO,
            Usuario = nuevoUsuario.NOMBRE_USUARIO,
            Mail = mail,
            Rol = nuevoUsuario.ROL,
            UsuarioResponsableId = nuevoUsuario.ID_USUARIO_RESP
        };
    }

    private bool TieneAccesoPorSuscripcion(Usuario usuario)
    {
        var titular = ObtenerTitularSuscripcion(usuario);
        if (titular == null)
        {
            return usuario.SUSCRIPCION_ACTIVA;
        }

        var suscripcion = _context.Suscripcion
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

        return _context.Usuario
            .FirstOrDefault(u => u.ID_USUARIO == usuario.ID_USUARIO_RESPONSABLE.Value);
    }

  private async Task<bool> VerificarOActivarLicencia(Usuario usuario)
  {
    var (permitido, _) = await _licenciaService.VerificarAcceso();
    if (permitido) return true;

    var local = await _licenciaService.ObtenerEstadoLocal();
    if (local != null) return false;

    if (string.IsNullOrWhiteSpace(usuario.MAIL))
      return false;

    var (exito, _, _) = await _licenciaService.BuscarYActivarPorEmail(usuario.MAIL);
    return exito;
  }
}
