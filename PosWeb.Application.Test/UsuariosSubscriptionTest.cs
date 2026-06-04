using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using PosWeb.Application.Auth;
using PosWeb.Application.Exceptions;
using PosWeb.Controllers;
using PosWeb.Data;
using PosWeb.Domain;
using PosWeb.Testing;

namespace PosWeb.Application.Test;

public class UsuariosSubscriptionTest
{
    private static PosDbContext CrearContexto(string dbName)
    {
        var options = new DbContextOptionsBuilder<PosDbContext>()
            .UseInMemoryDatabase(dbName)
            .Options;

        return new PosDbContext(options);
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
        PosDbContext context,
        int id,
        string nombreUsuario,
        string rol,
        int? responsableId = null,
        bool suscripcionActiva = true)
    {
        var usuario = new Usuario(
            nombreUsuario,
            BCrypt.Net.BCrypt.HashPassword("123456"),
            rol,
            "test@mail.com",
            usuarioResponsableId: responsableId,
            suscripcionActiva: suscripcionActiva);

        TestHelpers.SetId(usuario, id, "ID_USUARIO");
        context.Usuarios.Add(usuario);
        context.SaveChanges();
        return usuario;
    }

    [Fact]
    public void CambiarSuscripcion_Admin_DesactivaDependientes()
    {
        var context = CrearContexto(nameof(CambiarSuscripcion_Admin_DesactivaDependientes));
        CrearUsuario(context, 1, "admin", Roles.Admin);
        CrearUsuario(context, 2, "usuario", Roles.UsuarioComun, responsableId: 1);
        var controller = new UsuariosController(context);

        var result = controller.CambiarSuscripcion(1, new CambiarSuscripcionRequest(false));

        Assert.IsType<OkObjectResult>(result);
        Assert.False(context.Usuarios.Single(u => u.ID_USUARIO == 1).SUSCRIPCION_ACTIVA);
        Assert.False(context.Usuarios.Single(u => u.ID_USUARIO == 2).SUSCRIPCION_ACTIVA);
    }

    [Fact]
    public void Login_ConAdminSuspendido_LanzaExcepcionDeSuscripcion()
    {
        var context = CrearContexto(nameof(Login_ConAdminSuspendido_LanzaExcepcionDeSuscripcion));
        var admin = CrearUsuario(context, 1, "admin", Roles.Admin);
        admin.SuspenderSuscripcion();
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
    public void Login_ConDependienteYAdminSuspendido_LanzaExcepcionDeSuscripcion()
    {
        var context = CrearContexto(nameof(Login_ConDependienteYAdminSuspendido_LanzaExcepcionDeSuscripcion));
        var admin = CrearUsuario(context, 1, "admin", Roles.Admin);
        admin.SuspenderSuscripcion();
        CrearUsuario(context, 2, "usuario", Roles.UsuarioComun, responsableId: 1);

        var service = new AuthService(context, CrearJwtTokenService());

        Assert.Throws<UsuarioSinSuscripcionException>(() => service.Login(new PosWeb.Contracts.LoginRequestDto
        {
            Usuario = "usuario",
            Password = "123456",
            SucursalId = 1
        }));
    }
}
