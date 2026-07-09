using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using System.Security.Claims;
using PosWeb.Application.Auth;
using PosWeb.Application.Exceptions;
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
    public void Register_Admin_CreaSuscripcionBasica()
    {
        var context = CrearContexto(nameof(Register_Admin_CreaSuscripcionBasica));
        var service = new AuthService(context, CrearJwtTokenService());

        var resultado = service.Register(new PosWeb.Contracts.RegisterRequestDto
        {
            Usuario = "admin2",
            Password = "123456",
            Mail = "admin2@test.com",
            Rol = Roles.Admin,
            EmpresaId = 1
        });

        var usuario = Assert.Single(context.Usuario.Where(u => u.NOMBRE_USUARIO == "admin2"));
        var suscripcion = Assert.Single(context.Suscripcion.Where(s => s.ID_USUARIO_TITULAR == usuario.ID_USUARIO));

        Assert.Equal(NivelesSuscripcion.Basica, suscripcion.NIVEL);
        Assert.Equal(1, suscripcion.MAX_SUCURSALES);
        Assert.Equal(1, suscripcion.MAX_ADMIN);
        Assert.Equal(1, suscripcion.MAX_USUARIOS);
        Assert.True(suscripcion.EstaActiva());
        Assert.Equal(resultado.Id, usuario.ID_USUARIO);
    }

    [Fact]
    public void Login_ConSuscripcionSuspendida_LanzaExcepcion()
    {
        var context = CrearContexto(nameof(Login_ConSuscripcionSuspendida_LanzaExcepcion));
        var admin = CrearUsuario(context, 1, "admin", Roles.Admin);
        var suscripcion = Suscripcion.CrearBasica(admin.ID_USUARIO);
        suscripcion.Suspender();
        context.Suscripcion.Add(suscripcion);
        context.SaveChanges();

        var service = new AuthService(context, CrearJwtTokenService());

        Assert.Throws<UsuarioSinSuscripcionException>(() => service.Login(new PosWeb.Contracts.LoginRequestDto
        {
            Usuario = "admin",
            Password = "123456",
            SucursalId = 1
        }));
    }

    [Fact]
    public void Login_ConDependienteYAdminSuspendido_LanzaExcepcion()
    {
        var context = CrearContexto(nameof(Login_ConDependienteYAdminSuspendido_LanzaExcepcion));
        var admin = CrearUsuario(context, 1, "admin", Roles.Admin);
        var suscripcion = Suscripcion.CrearBasica(admin.ID_USUARIO);
        suscripcion.Suspender();
        context.Suscripcion.Add(suscripcion);
        CrearUsuario(context, 2, "usuario", Roles.UsuarioComun, responsableId: 1);
        context.SaveChanges();

        var service = new AuthService(context, CrearJwtTokenService());

        Assert.Throws<UsuarioSinSuscripcionException>(() => service.Login(new PosWeb.Contracts.LoginRequestDto
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
    public void Register_ConPlanBasico_NoPermiteMasUsuariosComunes()
    {
        var context = CrearContexto(nameof(Register_ConPlanBasico_NoPermiteMasUsuariosComunes));
        var admin = CrearUsuario(context, 1, "admin", Roles.Admin);
        context.Suscripcion.Add(Suscripcion.CrearBasica(admin.ID_USUARIO));
        context.SaveChanges();

        var service = new AuthService(context, CrearJwtTokenService());

        service.Register(new PosWeb.Contracts.RegisterRequestDto
        {
            Usuario = "usuario1",
            Password = "123456",
            Mail = "u1@test.com",
            Rol = Roles.UsuarioComun
        }, currentUserId: 1);

        Assert.Throws<SuscripcionSinCupoException>(() => service.Register(new PosWeb.Contracts.RegisterRequestDto
        {
            Usuario = "usuario2",
            Password = "123456",
            Mail = "u2@test.com",
            Rol = Roles.UsuarioComun
        }, currentUserId: 1));
    }

    [Fact]
    public void Register_ConPlanMedia_NoPermiteMasAdmins()
    {
        var context = CrearContexto(nameof(Register_ConPlanMedia_NoPermiteMasAdmins));
        var admin = CrearUsuario(context, 1, "admin", Roles.Admin);
        context.Suscripcion.Add(Suscripcion.CrearMedia(admin.ID_USUARIO));
        context.SaveChanges();

        var service = new AuthService(context, CrearJwtTokenService());

        Assert.Throws<SuscripcionSinCupoException>(() => service.Register(new PosWeb.Contracts.RegisterRequestDto
        {
            Usuario = "admin2",
            Password = "123456",
            Mail = "admin2@test.com",
            Rol = Roles.Admin,
            EmpresaId = 1
        }, currentUserId: 1));
    }
}
