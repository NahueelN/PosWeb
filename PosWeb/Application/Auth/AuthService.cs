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
            EsTitular = usuario.ES_TITULAR,
            Activo = usuario.ACTIVO,
            PinConfigurado = !string.IsNullOrEmpty(usuario.PIN_HASH),
        };
    }

    public async Task<RegisterResponseDto> Register(RegisterRequestDto request, int? currentUserId = null)
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

        Usuario? currentUser = currentUserId.HasValue
            ? _context.Usuario.FirstOrDefault(u => u.ID_USUARIO == currentUserId.Value)
            : null;

        if (currentUserId.HasValue && (currentUser == null || (currentUser.ROL != Roles.Admin && currentUser.ROL != Roles.SuperAdmin)))
        {
            throw new ArgumentException("Solo un Admin o SuperAdmin puede crear usuarios");
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

        ValidarCupoSuscripcion(rol, currentUserId);

        // Solo el alta anónima (primer admin de la instalación) crea un titular nuevo;
        // un Admin/SuperAdmin ya logueado siempre está creando un usuario bajo su propio titular.
        var esTitular = currentUserId == null;

        // El registro anónimo es para el primer admin de una instalación nueva. Si ya hay un
        // titular, registrarse de nuevo sin sesión crearía otro titular independiente sobre la
        // misma base de datos (mismos productos/ventas/etc.) y reiniciaría la prueba gratuita
        // de licencia una y otra vez sin costo. Una vez que existe un titular, hay que loguearse.
        if (esTitular && _context.Usuario.Any(u => u.ES_TITULAR))
        {
            throw new ArgumentException("Ya existe un administrador registrado en esta instalación. Iniciá sesión o pedile a un Admin que te cree una cuenta.");
        }

        int? usuarioResponsableId;
        if (rol == Roles.UsuarioComun)
        {
            usuarioResponsableId = currentUserId;
        }
        else if (rol == Roles.Admin && currentUser != null)
        {
            usuarioResponsableId = ResolverTitular(currentUser).ID_USUARIO;
        }
        else
        {
            usuarioResponsableId = null;
        }

        int? empresaId = request.EmpresaId;
        string? crearEmpresaNombre = null;

        // Si viene el nombre en vez del ID, resolver la empresa por nombre.
        // Si no existe, se crea una empresa nueva con ese nombre (cualquier nombre es válido
        // para el primer Admin; para otros roles sin empresa existente se rechaza).
        if (!empresaId.HasValue && !string.IsNullOrWhiteSpace(request.EmpresaNombre))
        {
            var nombre = request.EmpresaNombre.Trim();
            var empresa = _context.Empresa.FirstOrDefault(e => e.NOMBRE == nombre);
            if (empresa != null)
            {
                empresaId = empresa.ID_EMPRESA;
            }
            else if (rol == Roles.Admin)
            {
                crearEmpresaNombre = nombre;
            }
            else
            {
                throw new ArgumentException($"No existe una empresa con el nombre '{nombre}'");
            }
        }

        var passwordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);

        var nuevoUsuario = new Usuario(
            nombreUsuario,
            passwordHash,
            rol,
            mail,
            usuarioResponsableId: usuarioResponsableId,
            empresaId: empresaId,
            esTitular: esTitular);

        _context.Usuario.Add(nuevoUsuario);
        _context.SaveChanges();

        // Un admin secundario comparte la Suscripcion y la LicenciaConfig del titular:
        // no se le crea una propia ni se vuelve a activar/otorgar licencia por su cuenta.
        if (rol == Roles.Admin && esTitular)
        {
            var suscripcion = Suscripcion.CrearBasica(nuevoUsuario.ID_USUARIO);
            _context.Suscripcion.Add(suscripcion);
            _context.SaveChanges();

            // Crear la empresa nueva y asignársela al titular.
            if (crearEmpresaNombre != null)
            {
                var empresaNueva = new Empresa(crearEmpresaNombre, "00000000000", suscripcion.ID_SUSCRIPCION);
                _context.Empresa.Add(empresaNueva);
                _context.SaveChanges();

                nuevoUsuario.AsignarEmpresa(empresaNueva.ID_EMPRESA);
                _context.SaveChanges();
            }
        }

        string? licenciaEstado = null;
        if (rol == Roles.Admin)
        {
            if (esTitular)
            {
                var (_, licencia) = await _licenciaService.ActivarPorEmailOPrueba(mail);
                licenciaEstado = licencia?.Estado;

                // Dar de alta el email en la API de licensing (plan gratuito placeholder) para
                // que cuando el usuario actualice el plan ya exista el registro.
                await _licenciaService.RegistrarEmailEnWorker(mail);
            }
            else
            {
                var licenciaCompartida = await _licenciaService.ObtenerEstadoLocal();
                licenciaEstado = licenciaCompartida?.Estado;
            }
        }

        return new RegisterResponseDto
        {
            Id = nuevoUsuario.ID_USUARIO,
            Usuario = nuevoUsuario.NOMBRE_USUARIO,
            Mail = mail,
            Rol = nuevoUsuario.ROL,
            UsuarioResponsableId = nuevoUsuario.ID_USUARIO_RESP,
            EsTitular = nuevoUsuario.ES_TITULAR,
            LicenciaEstado = licenciaEstado
        };
    }

    private void ValidarCupoSuscripcion(string rol, int? currentUserId)
    {
        if (!currentUserId.HasValue || (rol != Roles.Admin && rol != Roles.UsuarioComun))
        {
            return;
        }

        var currentUser = _context.Usuario.FirstOrDefault(u => u.ID_USUARIO == currentUserId.Value);
        if (currentUser == null)
        {
            return;
        }

        // El cupo del plan es del titular: se poolea entre el titular y todos los admins
        // secundarios que comparten su Suscripcion, no por empresa ni por creador directo.
        var titular = ResolverTitular(currentUser);
        var suscripcion = _context.Suscripcion.FirstOrDefault(s => s.ID_USUARIO_TITULAR == titular.ID_USUARIO);

        if (suscripcion == null)
        {
            return;
        }

        // Tope de cuentas totales bajo el titular (admins activos + usuarios comunes activos).
        // MAX_USUARIOS null = ilimitado (Maxima o prueba).
        if (!suscripcion.MAX_USUARIOS.HasValue)
        {
            return;
        }

        var adminIdsBajoTitular = _context.Usuario
            .Where(u => u.ROL == Roles.Admin && u.ACTIVO &&
                (u.ID_USUARIO == titular.ID_USUARIO || u.ID_USUARIO_RESPONSABLE == titular.ID_USUARIO))
            .Select(u => u.ID_USUARIO)
            .ToList();

        var cuentasExistentes = adminIdsBajoTitular.Count + _context.Usuario.Count(u =>
            u.ROL == Roles.UsuarioComun && u.ACTIVO &&
            u.ID_USUARIO_RESPONSABLE.HasValue &&
            adminIdsBajoTitular.Contains(u.ID_USUARIO_RESPONSABLE.Value));

        if (cuentasExistentes >= suscripcion.MAX_USUARIOS.Value)
        {
            throw new SuscripcionSinCupoException("usuarios", suscripcion.NIVEL);
        }
    }

    /// <summary>
    /// Resuelve el titular de la suscripción/licencia para un Admin o SuperAdmin: el titular
    /// explícito (ES_TITULAR) si es él mismo, o el usuario al que apunta ID_USUARIO_RESPONSABLE
    /// (nunca más de un salto: los admins secundarios siempre se enlazan directo al titular).
    /// </summary>
    private Usuario ResolverTitular(Usuario usuario)
    {
        if (usuario.ES_TITULAR || !usuario.ID_USUARIO_RESPONSABLE.HasValue)
        {
            return usuario;
        }

        return _context.Usuario.FirstOrDefault(u => u.ID_USUARIO == usuario.ID_USUARIO_RESPONSABLE.Value) ?? usuario;
    }

    private bool TieneAccesoPorSuscripcion(Usuario usuario)
    {
        var titular = ResolverTitular(usuario);

        var suscripcion = _context.Suscripcion
            .FirstOrDefault(s => s.ID_USUARIO_TITULAR == titular.ID_USUARIO);

        if (suscripcion == null)
        {
            return titular.SUSCRIPCION_ACTIVA;
        }

        return suscripcion.EstaActiva();
    }

  private async Task<bool> VerificarOActivarLicencia(Usuario usuario)
  {
    var (permitido, _) = await _licenciaService.VerificarAcceso();
    if (permitido) return true;

    if (string.IsNullOrWhiteSpace(usuario.MAIL))
      return false;

    var (exito, _, _) = await _licenciaService.BuscarYActivarPorEmail(usuario.MAIL);
    return exito;
  }
}
