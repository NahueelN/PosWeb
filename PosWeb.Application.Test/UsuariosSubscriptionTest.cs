using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using System.Security.Claims;
using System.Text;
using PosWeb.Application.Auth;
using PosWeb.Application.Exceptions;
using PosWeb.Application.Licensing;
using PosWeb.Controllers;
using PosWeb.Data;
using PosWeb.Domain;
using PosWeb.Testing;

namespace PosWeb.Application.Test;

public class UsuariosSubscriptionTest
{
    private static PosDbContextLocal CrearContexto(string dbName)
    {
        var options = new DbContextOptionsBuilder<PosDbContextLocal>()
            .UseInMemoryDatabase(dbName)
            .Options;

        return new PosDbContextLocal(options);
    }

    private static JwtTokenService CrearJwtTokenService()
    {
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Jwt:Secret"] = "PosWeb_TestSecret_PosWeb_TestSecret_123!",
                ["Jwt:ExpirationHours"] = "1"
            })
            .Build();

        return new JwtTokenService(configuration);
    }

    private static LicenciaService CrearLicenciaService(PosDbContextLocal context)
    {
        // Sin "Licensing:WorkerUrl" => VerificarAcceso devuelve true (modo sin worker)
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>())
            .Build();

        var base64Key = Convert.ToBase64String(Encoding.UTF8.GetBytes("PosWeb_TestEncryptionKey_1234567890!"));
        var encryption = new EncryptionService(base64Key);

        return new LicenciaService(context, configuration, encryption);
    }

    private static LicenciaService CrearLicenciaServiceConWorker(PosDbContextLocal context)
    {
        // Con "Licensing:WorkerUrl" seteado (aunque no responda) => VerificarAcceso ejecuta
        // la lógica real en vez de cortocircuitar en "modo sin worker".
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Licensing:WorkerUrl"] = "http://worker.invalid.test"
            })
            .Build();

        var base64Key = Convert.ToBase64String(Encoding.UTF8.GetBytes("PosWeb_TestEncryptionKey_1234567890!"));
        var encryption = new EncryptionService(base64Key);

        return new LicenciaService(context, configuration, encryption);
    }

    private static Usuario CrearUsuario(
        PosDbContextLocal context,
        int id,
        string nombreUsuario,
        string rol,
        int? responsableId = null)
    {
        var usuario = new Usuario(
            nombreUsuario,
            BCrypt.Net.BCrypt.HashPassword("123456"),
            rol,
            "test@mail.com",
            usuarioResponsableId: responsableId);

        TestHelpers.SetId(usuario, id, "ID_USUARIO");
        context.Usuario.Add(usuario);
        context.SaveChanges();
        return usuario;
    }

    private static void VincularUsuarioActual(HttpContext httpContext, int userId)
    {
        httpContext.User = new ClaimsPrincipal(new ClaimsIdentity(
            new[]
            {
                new Claim(ClaimTypes.NameIdentifier, userId.ToString())
            },
            "TestAuth"));
    }

    [Fact]
    public async Task Register_Admin_SinLicencia_IniciaPruebaGratuita()
    {
        var context = CrearContexto(nameof(Register_Admin_SinLicencia_IniciaPruebaGratuita));
        var service = new AuthService(context, CrearJwtTokenService(), CrearLicenciaService(context));

        var resultado = await service.Register(new PosWeb.Contracts.RegisterRequestDto
        {
            Usuario = "admin2",
            Password = "123456",
            Mail = "admin2@test.com",
            Rol = Roles.Admin,
            EmpresaId = 1
        });

        var usuario = Assert.Single(context.Usuario.Where(u => u.NOMBRE_USUARIO == "admin2"));
        var suscripcion = Assert.Single(context.Suscripcion.Where(s => s.ID_USUARIO_TITULAR == usuario.ID_USUARIO));
        var licencia = Assert.Single(context.Set<LicenciaConfig>());

        Assert.Equal(NivelesSuscripcion.Maxima, suscripcion.NIVEL);
        Assert.Null(suscripcion.MAX_SUCURSALES);
        Assert.Null(suscripcion.MAX_ADMIN);
        Assert.Null(suscripcion.MAX_USUARIOS);
        Assert.True(suscripcion.EstaActiva());
        Assert.True(licencia.EsTrial);
        Assert.Equal("trial", resultado.LicenciaEstado);
        Assert.Equal(resultado.Id, usuario.ID_USUARIO);
    }

    [Fact]
    public async Task Login_ConSuscripcionSuspendida_LanzaExcepcion()
    {
        var context = CrearContexto(nameof(Login_ConSuscripcionSuspendida_LanzaExcepcion));
        var admin = CrearUsuario(context, 1, "admin", Roles.Admin);
        var suscripcion = Suscripcion.CrearBasica(admin.ID_USUARIO);
        suscripcion.Suspender();
        context.Suscripcion.Add(suscripcion);
        context.SaveChanges();

        var service = new AuthService(context, CrearJwtTokenService(), CrearLicenciaService(context));

        await Assert.ThrowsAsync<UsuarioSinSuscripcionException>(() => service.Login(new PosWeb.Contracts.LoginRequestDto
        {
            Usuario = "admin",
            Password = "123456",
            SucursalId = 1
        }));
    }

    [Fact]
    public async Task Login_ConDependienteYAdminSuspendido_LanzaExcepcion()
    {
        var context = CrearContexto(nameof(Login_ConDependienteYAdminSuspendido_LanzaExcepcion));
        var admin = CrearUsuario(context, 1, "admin", Roles.Admin);
        var suscripcion = Suscripcion.CrearBasica(admin.ID_USUARIO);
        suscripcion.Suspender();
        context.Suscripcion.Add(suscripcion);
        CrearUsuario(context, 2, "usuario", Roles.UsuarioComun, responsableId: 1);
        context.SaveChanges();

        var service = new AuthService(context, CrearJwtTokenService(), CrearLicenciaService(context));

        await Assert.ThrowsAsync<UsuarioSinSuscripcionException>(() => service.Login(new PosWeb.Contracts.LoginRequestDto
        {
            Usuario = "usuario",
            Password = "123456",
            SucursalId = 1
        }));
    }

    [Fact]
    public void CambiarSuscripcion_Admin_ActualizaLaEntidadSuscripcion()
    {
        var context = CrearContexto(nameof(CambiarSuscripcion_Admin_ActualizaLaEntidadSuscripcion));
        var admin = CrearUsuario(context, 1, "admin", Roles.Admin);
        context.Suscripcion.Add(Suscripcion.CrearBasica(admin.ID_USUARIO));
        context.SaveChanges();

        var controller = new UsuariosController(context);

        var resultado = controller.CambiarSuscripcion(1, new CambiarSuscripcionRequest(false));

        Assert.IsType<OkObjectResult>(resultado);
        Assert.False(context.Suscripcion.Single(s => s.ID_USUARIO_TITULAR == 1).EstaActiva());
        Assert.False(context.Usuario.Single(u => u.ID_USUARIO == 1).SUSCRIPCION_ACTIVA);
    }

    [Fact]
    public async Task Register_ConPlanBasico_AdmiteTresCuentasTotales()
    {
        var context = CrearContexto(nameof(Register_ConPlanBasico_AdmiteTresCuentasTotales));
        var admin = CrearUsuario(context, 1, "admin", Roles.Admin);
        context.Suscripcion.Add(Suscripcion.CrearBasica(admin.ID_USUARIO));
        context.SaveChanges();

        var service = new AuthService(context, CrearJwtTokenService(), CrearLicenciaService(context));

        // Titular (1) + 2 cuentas más => 3 totales permitidas.
        await service.Register(new PosWeb.Contracts.RegisterRequestDto
        {
            Usuario = "usuario1",
            Password = "123456",
            Mail = "u1@test.com",
            Rol = Roles.UsuarioComun
        }, currentUserId: 1);

        await service.Register(new PosWeb.Contracts.RegisterRequestDto
        {
            Usuario = "usuario2",
            Password = "123456",
            Mail = "u2@test.com",
            Rol = Roles.UsuarioComun
        }, currentUserId: 1);

        await Assert.ThrowsAsync<SuscripcionSinCupoException>(() => service.Register(new PosWeb.Contracts.RegisterRequestDto
        {
            Usuario = "usuario3",
            Password = "123456",
            Mail = "u3@test.com",
            Rol = Roles.UsuarioComun
        }, currentUserId: 1));
    }

    [Fact]
    public async Task Register_ConPlanBasico_TopeTotalDeCuentas()
    {
        var context = CrearContexto(nameof(Register_ConPlanBasico_TopeTotalDeCuentas));
        var admin = CrearUsuario(context, 1, "admin", Roles.Admin);
        context.Suscripcion.Add(Suscripcion.CrearBasica(admin.ID_USUARIO));
        context.SaveChanges();

        var service = new AuthService(context, CrearJwtTokenService(), CrearLicenciaService(context));

        await service.Register(new PosWeb.Contracts.RegisterRequestDto
        {
            Usuario = "admin2",
            Password = "123456",
            Mail = "a2@test.com",
            Rol = Roles.Admin,
            EmpresaId = 1
        }, currentUserId: 1);

        await service.Register(new PosWeb.Contracts.RegisterRequestDto
        {
            Usuario = "admin3",
            Password = "123456",
            Mail = "a3@test.com",
            Rol = Roles.Admin,
            EmpresaId = 1
        }, currentUserId: 1);

        await Assert.ThrowsAsync<SuscripcionSinCupoException>(() => service.Register(new PosWeb.Contracts.RegisterRequestDto
        {
            Usuario = "admin4",
            Password = "123456",
            Mail = "a4@test.com",
            Rol = Roles.Admin,
            EmpresaId = 1
        }, currentUserId: 1));
    }

    [Fact]
    public async Task Register_ConPlanMaxima_SinLimiteDeCuentas()
    {
        var context = CrearContexto(nameof(Register_ConPlanMaxima_SinLimiteDeCuentas));
        var admin = CrearUsuario(context, 1, "admin", Roles.Admin);
        context.Suscripcion.Add(Suscripcion.CrearMaxima(admin.ID_USUARIO));
        context.SaveChanges();

        var service = new AuthService(context, CrearJwtTokenService(), CrearLicenciaService(context));

        await service.Register(new PosWeb.Contracts.RegisterRequestDto
        {
            Usuario = "admin2",
            Password = "123456",
            Mail = "a2@test.com",
            Rol = Roles.Admin,
            EmpresaId = 1
        }, currentUserId: 1);

        await service.Register(new PosWeb.Contracts.RegisterRequestDto
        {
            Usuario = "cajero1",
            Password = "123456",
            Mail = "c1@test.com",
            Rol = Roles.UsuarioComun
        }, currentUserId: 1);

        await service.Register(new PosWeb.Contracts.RegisterRequestDto
        {
            Usuario = "cajero2",
            Password = "123456",
            Mail = "c2@test.com",
            Rol = Roles.UsuarioComun
        }, currentUserId: 1);
    }

    [Fact]
    public async Task Register_SegundoAdmin_CompartesSuscripcionYLicenciaDelTitular()
    {
        var context = CrearContexto(nameof(Register_SegundoAdmin_CompartesSuscripcionYLicenciaDelTitular));
        var service = new AuthService(context, CrearJwtTokenService(), CrearLicenciaService(context));

        var resultadoTitular = await service.Register(new PosWeb.Contracts.RegisterRequestDto
        {
            Usuario = "titular",
            Password = "123456",
            Mail = "titular@test.com",
            Rol = Roles.Admin,
            EmpresaId = 1
        });

        var resultadoSecundario = await service.Register(new PosWeb.Contracts.RegisterRequestDto
        {
            Usuario = "secundario",
            Password = "123456",
            Mail = "secundario@test.com",
            Rol = Roles.Admin
        }, currentUserId: resultadoTitular.Id);

        var segundoAdmin = context.Usuario.Single(u => u.NOMBRE_USUARIO == "secundario");

        Assert.True(resultadoTitular.EsTitular);
        Assert.False(resultadoSecundario.EsTitular);
        Assert.False(segundoAdmin.ES_TITULAR);
        Assert.Equal(resultadoTitular.Id, segundoAdmin.ID_USUARIO_RESPONSABLE);
        Assert.Single(context.Suscripcion);
        Assert.Single(context.Set<LicenciaConfig>());
        Assert.Equal(NivelesSuscripcion.Maxima, context.Suscripcion.Single().NIVEL);
    }

    [Fact]
    public async Task Register_ConPlanBasico_CupoDeUsuariosSePooleaEntreAdminsQueComparenTitular()
    {
        var context = CrearContexto(nameof(Register_ConPlanBasico_CupoDeUsuariosSePooleaEntreAdminsQueComparenTitular));
        var service = new AuthService(context, CrearJwtTokenService(), CrearLicenciaService(context));

        var titular = CrearUsuario(context, 1, "titular", Roles.Admin);
        context.Suscripcion.Add(Suscripcion.CrearBasica(titular.ID_USUARIO));
        context.SaveChanges();

        var secundario = CrearUsuario(context, 2, "secundario", Roles.Admin, responsableId: titular.ID_USUARIO);

        await service.Register(new PosWeb.Contracts.RegisterRequestDto
        {
            Usuario = "cajero1",
            Password = "123456",
            Mail = "cajero1@test.com",
            Rol = Roles.UsuarioComun
        }, currentUserId: titular.ID_USUARIO);

        await Assert.ThrowsAsync<SuscripcionSinCupoException>(() => service.Register(new PosWeb.Contracts.RegisterRequestDto
        {
            Usuario = "cajero2",
            Password = "123456",
            Mail = "cajero2@test.com",
            Rol = Roles.UsuarioComun
        }, currentUserId: secundario.ID_USUARIO));
    }

    [Fact]
    public async Task Register_UsuarioComunIntentaCrearAdmin_LanzaExcepcion()
    {
        var context = CrearContexto(nameof(Register_UsuarioComunIntentaCrearAdmin_LanzaExcepcion));
        var admin = CrearUsuario(context, 1, "admin", Roles.Admin);
        context.Suscripcion.Add(Suscripcion.CrearMaxima(admin.ID_USUARIO));
        var cajero = CrearUsuario(context, 2, "cajero", Roles.UsuarioComun, responsableId: admin.ID_USUARIO);
        context.SaveChanges();

        var service = new AuthService(context, CrearJwtTokenService(), CrearLicenciaService(context));

        await Assert.ThrowsAsync<ArgumentException>(() => service.Register(new PosWeb.Contracts.RegisterRequestDto
        {
            Usuario = "otroadmin",
            Password = "123456",
            Mail = "otroadmin@test.com",
            Rol = Roles.Admin
        }, currentUserId: cajero.ID_USUARIO));
    }

    [Fact]
    public async Task VerificarAcceso_TrasVencerPrueba_SigueBloqueandoEnLlamadasPosteriores()
    {
        var context = CrearContexto(nameof(VerificarAcceso_TrasVencerPrueba_SigueBloqueandoEnLlamadasPosteriores));
        var licenciaService = CrearLicenciaServiceConWorker(context);

        var machineId = await licenciaService.ObtenerOCrearMachineId();
        await licenciaService.IniciarPruebaGratuita(machineId, TimeSpan.FromMilliseconds(1));
        await Task.Delay(50);

        var (permitidoPrimeraVez, _) = await licenciaService.VerificarAcceso();
        Assert.False(permitidoPrimeraVez);

        // Antes de este fix, esta segunda llamada volvía a dar acceso: EsTrial ya era false
        // (Estado pasó a trial-expired), caía al chequeo contra el Worker, fallaba, y la
        // gracia offline daba un resultado negativo que siempre se evaluaba como "true".
        var (permitidoSegundaVez, _) = await licenciaService.VerificarAcceso();
        Assert.False(permitidoSegundaVez);

        var licenciaFinal = await licenciaService.ObtenerEstadoLocal();
        Assert.Equal(EstadosLicencia.PruebaExpirada, licenciaFinal!.Estado);
        Assert.Equal(NivelesSuscripcion.Basica, licenciaFinal.Plan);
    }

    [Fact]
    public async Task VerificarAcceso_TrasVencerGracia_BloqueaOfflineEnLlamadasPosteriores()
    {
        var context = CrearContexto(nameof(VerificarAcceso_TrasVencerGracia_BloqueaOfflineEnLlamadasPosteriores));
        var licenciaService = CrearLicenciaServiceConWorker(context);

        // Licencia paga vencida hace 72h (ya pasó la gracia de 48h) pero con cache local todavía
        // vigente y sin poder contactar al Worker (offline): debe bloquear y seguir bloqueando.
        context.Set<LicenciaConfig>().Add(new LicenciaConfig
        {
            LicenseKey = "encrypted-key",
            Plan = NivelesSuscripcion.Basica,
            Estado = EstadosLicencia.Activa,
            MachineId = "maquina",
            NextBilling = DateTime.UtcNow.AddHours(-72),
            LastVerifiedAt = DateTime.UtcNow,
            VerifiedUntil = DateTime.UtcNow.AddHours(72),
        });
        await context.SaveChangesAsync();

        var (permitidoPrimeraVez, _) = await licenciaService.VerificarAcceso();
        Assert.False(permitidoPrimeraVez);

        // Antes del fix, esta segunda llamada reabría el acceso: al persistir 'expired' se
        // refrescaba VerifiedUntil (now+72h) y la gracia offline devolvía true (resta negativa).
        var (permitidoSegundaVez, _) = await licenciaService.VerificarAcceso();
        Assert.False(permitidoSegundaVez);

        var licenciaFinal = await licenciaService.ObtenerEstadoLocal();
        Assert.Equal(EstadosLicencia.Expirada, licenciaFinal!.Estado);
    }

    [Fact]
    public async Task VerificarAcceso_DuranteGracia_SiguePermitiendoOffline()
    {
        var context = CrearContexto(nameof(VerificarAcceso_DuranteGracia_SiguePermitiendoOffline));
        var licenciaService = CrearLicenciaServiceConWorker(context);

        // Vencida hace 24h (dentro de la gracia de 48h): debe seguir permitiendo el acceso.
        context.Set<LicenciaConfig>().Add(new LicenciaConfig
        {
            LicenseKey = "encrypted-key",
            Plan = NivelesSuscripcion.Basica,
            Estado = EstadosLicencia.Activa,
            MachineId = "maquina",
            NextBilling = DateTime.UtcNow.AddHours(-24),
            LastVerifiedAt = DateTime.UtcNow,
            VerifiedUntil = DateTime.UtcNow.AddHours(72),
        });
        await context.SaveChangesAsync();

        var (permitido, _) = await licenciaService.VerificarAcceso();
        Assert.True(permitido);
    }

    [Fact]
    public async Task VerificarAcceso_ConRelojAtrasado_Bloquea()
    {
        var context = CrearContexto(nameof(VerificarAcceso_ConRelojAtrasado_Bloquea));
        var licenciaService = CrearLicenciaServiceConWorker(context);

        // La marca máxima vista es "mañana": un reloj atrasado (hoy) dispara el bloqueo.
        context.Set<LicenciaConfig>().Add(new LicenciaConfig
        {
            LicenseKey = "encrypted-key",
            Plan = NivelesSuscripcion.Maxima,
            Estado = EstadosLicencia.Activa,
            MachineId = "maquina",
            NextBilling = DateTime.UtcNow.AddDays(30),
            LastVerifiedAt = DateTime.UtcNow,
            VerifiedUntil = DateTime.UtcNow.AddHours(72),
            LastSeenUtc = DateTime.UtcNow.AddDays(1),
        });
        await context.SaveChangesAsync();

        var (permitido, motivo) = await licenciaService.VerificarAcceso();
        Assert.False(permitido);
        Assert.Contains("cambio de hora", motivo);
    }

    [Fact]
    public async Task VerificarAcceso_AvanzaLaMarcaDeReloj()
    {
        var context = CrearContexto(nameof(VerificarAcceso_AvanzaLaMarcaDeReloj));
        var licenciaService = CrearLicenciaServiceConWorker(context);

        // Sin marca previa: tras una verificación normal, LastSeenUtc queda persistido y no bloquea.
        context.Set<LicenciaConfig>().Add(new LicenciaConfig
        {
            LicenseKey = "encrypted-key",
            Plan = NivelesSuscripcion.Maxima,
            Estado = EstadosLicencia.Activa,
            MachineId = "maquina",
            NextBilling = DateTime.UtcNow.AddDays(30),
            LastVerifiedAt = DateTime.UtcNow,
            VerifiedUntil = DateTime.UtcNow.AddHours(72),
        });
        await context.SaveChangesAsync();

        var (permitido, _) = await licenciaService.VerificarAcceso();
        Assert.True(permitido);

        var licenciaFinal = await licenciaService.ObtenerEstadoLocal();
        Assert.NotNull(licenciaFinal!.LastSeenUtc);
    }

    [Fact]
    public async Task Register_SegundoAdminAnonimo_NoReiniciaLaPruebaGratuita()
    {
        var context = CrearContexto(nameof(Register_SegundoAdminAnonimo_NoReiniciaLaPruebaGratuita));
        var service = new AuthService(context, CrearJwtTokenService(), CrearLicenciaService(context));

        await service.Register(new PosWeb.Contracts.RegisterRequestDto
        {
            Usuario = "primerAdmin",
            Password = "123456",
            Mail = "primero@test.com",
            Rol = Roles.Admin,
            EmpresaId = 1
        });

        var machineIdOriginal = context.Set<LicenciaConfig>().Single().MachineId;

        await Assert.ThrowsAsync<ArgumentException>(() => service.Register(new PosWeb.Contracts.RegisterRequestDto
        {
            Usuario = "segundoAdmin",
            Password = "123456",
            Mail = "otro@test.com",
            Rol = Roles.Admin,
            EmpresaId = 1
        }));

        Assert.Single(context.Usuario.Where(u => u.ROL == Roles.Admin));
        Assert.Single(context.Set<LicenciaConfig>());
        Assert.Equal(machineIdOriginal, context.Set<LicenciaConfig>().Single().MachineId);
    }

    [Fact]
    public void PermiteMercadoPago_False_SinPlanMaxima()
    {
        var context = CrearContexto(nameof(PermiteMercadoPago_False_SinPlanMaxima));
        var admin = CrearUsuario(context, 1, "admin", Roles.Admin);
        context.Suscripcion.Add(Suscripcion.CrearBasica(admin.ID_USUARIO));
        context.SaveChanges();

        var licenciaService = CrearLicenciaService(context);
        Assert.False(licenciaService.PermiteMercadoPago());
    }

    [Fact]
    public void PermiteMercadoPago_True_EnPlanMaxima()
    {
        var context = CrearContexto(nameof(PermiteMercadoPago_True_EnPlanMaxima));
        var admin = CrearUsuario(context, 1, "admin", Roles.Admin);
        context.Suscripcion.Add(Suscripcion.CrearMaxima(admin.ID_USUARIO));
        context.SaveChanges();

        var licenciaService = CrearLicenciaService(context);
        Assert.True(licenciaService.PermiteMercadoPago());
    }

    [Fact]
    public void PermiteMercadoPago_True_EnPruebaGratuita()
    {
        var context = CrearContexto(nameof(PermiteMercadoPago_True_EnPruebaGratuita));
        // La prueba gratuita opera como plan Maxima.
        context.Set<LicenciaConfig>().Add(new LicenciaConfig
        {
            LicenseKey = "trial",
            Plan = NivelesSuscripcion.Maxima,
            Estado = EstadosLicencia.Prueba,
            MachineId = "maquina",
            NextBilling = DateTime.UtcNow.AddDays(7),
        });
        context.SaveChanges();

        var licenciaService = CrearLicenciaService(context);
        Assert.True(licenciaService.PermiteMercadoPago());
    }

    [Fact]
    public void CambiarSuscripcion_SobreAdminSecundario_ActualizaLaSuscripcionDelTitular()
    {
        var context = CrearContexto(nameof(CambiarSuscripcion_SobreAdminSecundario_ActualizaLaSuscripcionDelTitular));
        var titular = CrearUsuario(context, 1, "titular", Roles.Admin);
        context.Suscripcion.Add(Suscripcion.CrearBasica(titular.ID_USUARIO));
        var secundario = CrearUsuario(context, 2, "secundario", Roles.Admin, responsableId: titular.ID_USUARIO);
        context.SaveChanges();

        var controller = new UsuariosController(context);

        var resultado = controller.CambiarSuscripcion(secundario.ID_USUARIO, new CambiarSuscripcionRequest(false));

        Assert.IsType<OkObjectResult>(resultado);
        Assert.Single(context.Suscripcion);
        Assert.False(context.Suscripcion.Single(s => s.ID_USUARIO_TITULAR == titular.ID_USUARIO).EstaActiva());
        Assert.False(context.Usuario.Single(u => u.ID_USUARIO == titular.ID_USUARIO).SUSCRIPCION_ACTIVA);
    }
}
