using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using System.Text;
using PosWeb.Application.Auth;
using PosWeb.Application.Exceptions;
using PosWeb.Application.Licensing;
using PosWeb.Data;
using PosWeb.Domain;
using PosWeb.Testing;

namespace PosWeb.Application.Test;

public class ConfirmacionEmailTest
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
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>())
            .Build();

        var base64Key = Convert.ToBase64String(Encoding.UTF8.GetBytes("PosWeb_TestEncryptionKey_1234567890!"));
        var encryption = new EncryptionService(base64Key);

        return new LicenciaService(context, configuration, encryption);
    }

    private static MailerService CrearMailerService()
    {
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>())
            .Build();

        return new MailerService(configuration, NullLogger<MailerService>.Instance, new HttpClient());
    }

    private static Usuario CrearUsuario(PosDbContextLocal context, int id, string mail, bool emailConfirmado = true)
    {
        var usuario = new Usuario(
            "admin",
            BCrypt.Net.BCrypt.HashPassword("123456"),
            Roles.Admin,
            mail,
            esTitular: false,
            emailConfirmado: emailConfirmado);
        TestHelpers.SetId(usuario, id, "ID_USUARIO");
        context.Usuario.Add(usuario);
        context.SaveChanges();
        return usuario;
    }

    private static void CrearTokenConfirmacion(PosDbContextLocal context, int idUsuario, string codigo, int intentos = 0, bool usado = false)
    {
        var token = new PasswordResetToken(
            idUsuario,
            BCrypt.Net.BCrypt.HashPassword(codigo),
            DateTime.UtcNow.AddMinutes(15),
            PasswordResetToken.PropositoConfirmacion);
        TestHelpers.SetId(token, 1, "ID_TOKEN");
        if (usado) token.MarcarUsado();
        for (int i = 0; i < intentos; i++) token.RegistrarIntento();
        context.PasswordResetToken.Add(token);
        context.SaveChanges();
    }

    [Fact]
    public async Task Register_UsuarioNuevo_IniciaSinEmailConfirmado()
    {
        var context = CrearContexto(nameof(Register_UsuarioNuevo_IniciaSinEmailConfirmado));
        var service = new AuthService(context, CrearJwtTokenService(), CrearLicenciaService(context), CrearMailerService());

        var resultado = await service.Register(new PosWeb.Contracts.RegisterRequestDto
        {
            Usuario = "nuevo",
            Password = "123456",
            Mail = "nuevo@test.com",
            Rol = Roles.Admin
        });

        Assert.False(resultado.EmailConfirmado);
        var usuario = context.Usuario.First(u => u.NOMBRE_USUARIO == "nuevo");
        Assert.False(usuario.EsEmailConfirmado());
    }

    [Fact]
    public void Login_EmailSinConfirmar_LanzaEmailNoConfirmado()
    {
        var context = CrearContexto(nameof(Login_EmailSinConfirmar_LanzaEmailNoConfirmado));
        CrearUsuario(context, 1, "admin@test.com", emailConfirmado: false);
        var service = new AuthService(context, CrearJwtTokenService(), CrearLicenciaService(context), CrearMailerService());

        var ex = Assert.ThrowsAsync<EmailNoConfirmadoException>(() =>
            service.Login(new PosWeb.Contracts.LoginRequestDto
            {
                Usuario = "admin",
                Password = "123456",
                SucursalId = 1
            }));

        Assert.Contains("Confirmá tu email", ex.Result.Message);
    }

    [Fact]
    public void Login_EmailConfirmado_NoLanza()
    {
        var context = CrearContexto(nameof(Login_EmailConfirmado_NoLanza));
        CrearUsuario(context, 1, "admin@test.com", emailConfirmado: true);
        var service = new AuthService(context, CrearJwtTokenService(), CrearLicenciaService(context), CrearMailerService());

        // Sin worker => VerificarAcceso cortocircuita; lo que importa acá es que NO lanza EmailNoConfirmado.
        var ex = Record.Exception(() =>
            service.Login(new PosWeb.Contracts.LoginRequestDto
            {
                Usuario = "admin",
                Password = "123456",
                SucursalId = 1
            }).GetAwaiter().GetResult());

        Assert.Null(ex);
    }

    [Fact]
    public async Task SolicitarConfirmacionEmail_EmailExistente_CreaTokenConProposito()
    {
        var context = CrearContexto(nameof(SolicitarConfirmacionEmail_EmailExistente_CreaTokenConProposito));
        CrearUsuario(context, 1, "admin@test.com", emailConfirmado: false);
        var service = new AuthService(context, CrearJwtTokenService(), CrearLicenciaService(context), CrearMailerService());

        await service.SolicitarConfirmacionEmail("admin@test.com");

        var token = Assert.Single(context.PasswordResetToken);
        Assert.Equal(PasswordResetToken.PropositoConfirmacion, token.PROPOSITO);
        Assert.Equal(1, token.ID_USUARIO);
    }

    [Fact]
    public void ConfirmarEmail_CodigoCorrecto_MarcaEmailConfirmado()
    {
        var context = CrearContexto(nameof(ConfirmarEmail_CodigoCorrecto_MarcaEmailConfirmado));
        CrearUsuario(context, 1, "admin@test.com", emailConfirmado: false);
        CrearTokenConfirmacion(context, 1, "123456");
        var service = new AuthService(context, CrearJwtTokenService(), CrearLicenciaService(context), CrearMailerService());

        service.ConfirmarEmail("admin@test.com", "123456");

        Assert.True(context.Usuario.First(u => u.ID_USUARIO == 1).EsEmailConfirmado());
        Assert.True(context.PasswordResetToken.Single().USADO);
    }

    [Fact]
    public void ConfirmarEmail_CodigoIncorrecto_LanzaYRegistraIntento()
    {
        var context = CrearContexto(nameof(ConfirmarEmail_CodigoIncorrecto_LanzaYRegistraIntento));
        CrearUsuario(context, 1, "admin@test.com", emailConfirmado: false);
        CrearTokenConfirmacion(context, 1, "123456");
        var service = new AuthService(context, CrearJwtTokenService(), CrearLicenciaService(context), CrearMailerService());

        var ex = Assert.Throws<ArgumentException>(() =>
            service.ConfirmarEmail("admin@test.com", "999999"));

        Assert.Equal("Código inválido o expirado", ex.Message);
        Assert.Equal(1, context.PasswordResetToken.Single().INTENTOS);
        Assert.False(context.Usuario.First(u => u.ID_USUARIO == 1).EsEmailConfirmado());
    }

    [Fact]
    public void ConfirmarEmail_TokenUsado_Lanza()
    {
        var context = CrearContexto(nameof(ConfirmarEmail_TokenUsado_Lanza));
        CrearUsuario(context, 1, "admin@test.com", emailConfirmado: false);
        CrearTokenConfirmacion(context, 1, "123456", usado: true);
        var service = new AuthService(context, CrearJwtTokenService(), CrearLicenciaService(context), CrearMailerService());

        var ex = Assert.Throws<ArgumentException>(() =>
            service.ConfirmarEmail("admin@test.com", "123456"));

        Assert.Equal("Código inválido o expirado", ex.Message);
    }

    [Fact]
    public void ConfirmarEmail_TokenReset_NoSirveParaConfirmacion()
    {
        var context = CrearContexto(nameof(ConfirmarEmail_TokenReset_NoSirveParaConfirmacion));
        CrearUsuario(context, 1, "admin@test.com", emailConfirmado: false);
        // Token de recuperación (proposito reset) no debe validar la confirmación.
        var token = new PasswordResetToken(1, BCrypt.Net.BCrypt.HashPassword("123456"), DateTime.UtcNow.AddMinutes(15));
        TestHelpers.SetId(token, 1, "ID_TOKEN");
        context.PasswordResetToken.Add(token);
        context.SaveChanges();
        var service = new AuthService(context, CrearJwtTokenService(), CrearLicenciaService(context), CrearMailerService());

        var ex = Assert.Throws<ArgumentException>(() =>
            service.ConfirmarEmail("admin@test.com", "123456"));

        Assert.Equal("Código inválido o expirado", ex.Message);
        Assert.False(context.Usuario.First(u => u.ID_USUARIO == 1).EsEmailConfirmado());
    }
}