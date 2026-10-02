using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using System.Text;
using PosWeb.Application.Auth;
using PosWeb.Application.Licensing;
using PosWeb.Data;
using PosWeb.Domain;
using PosWeb.Testing;

namespace PosWeb.Application.Test;

public class RecuperacionPasswordTest
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

    private static MailerService CrearMailerService(bool conWorker)
    {
        // Con worker: falla la conexión (url inválida) y Enviar devuelve false.
        // Sin worker: Enviar devuelve false por no estar configurado.
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Mailer:WorkerUrl"] = conWorker ? "http://worker.invalid.test" : "",
                ["Mailer:InternalKey"] = "test-key"
            })
            .Build();

        return new MailerService(configuration);
    }

    private static Usuario CrearUsuario(PosDbContextLocal context, int id, string mail)
    {
        var usuario = new Usuario(
            "admin",
            BCrypt.Net.BCrypt.HashPassword("123456"),
            Roles.Admin,
            mail);
        TestHelpers.SetId(usuario, id, "ID_USUARIO");
        context.Usuario.Add(usuario);
        context.SaveChanges();
        return usuario;
    }

    private static void CrearToken(PosDbContextLocal context, int idUsuario, string codigo, int intentos = 0, bool usado = false, DateTime? expira = null)
    {
        var token = new PasswordResetToken(
            idUsuario,
            BCrypt.Net.BCrypt.HashPassword(codigo),
            expira ?? DateTime.UtcNow.AddMinutes(15));
        TestHelpers.SetId(token, 1, "ID_TOKEN");
        if (usado) token.MarcarUsado();
        for (int i = 0; i < intentos; i++) token.RegistrarIntento();
        context.PasswordResetToken.Add(token);
        context.SaveChanges();
    }

    [Fact]
    public async Task SolicitarRecuperacion_EmailExistente_CreaToken()
    {
        var context = CrearContexto(nameof(SolicitarRecuperacion_EmailExistente_CreaToken));
        CrearUsuario(context, 1, "admin@test.com");
        var service = new AuthService(context, CrearJwtTokenService(), CrearLicenciaService(context), CrearMailerService(false));

        await service.SolicitarRecuperacion("ADMIN@test.com");

        var token = Assert.Single(context.PasswordResetToken);
        Assert.Equal(1, token.ID_USUARIO);
        Assert.True(token.EXPIRA_UTC > DateTime.UtcNow);
    }

    [Fact]
    public async Task SolicitarRecuperacion_EmailInexistente_NoCreaToken()
    {
        var context = CrearContexto(nameof(SolicitarRecuperacion_EmailInexistente_NoCreaToken));
        CrearUsuario(context, 1, "admin@test.com");
        var service = new AuthService(context, CrearJwtTokenService(), CrearLicenciaService(context), CrearMailerService(false));

        await service.SolicitarRecuperacion("otro@test.com");

        Assert.Empty(context.PasswordResetToken);
    }

    [Fact]
    public async Task SolicitarRecuperacion_MailInvalido_NoCreaToken()
    {
        var context = CrearContexto(nameof(SolicitarRecuperacion_MailInvalido_NoCreaToken));
        CrearUsuario(context, 1, "admin@test.com");
        var service = new AuthService(context, CrearJwtTokenService(), CrearLicenciaService(context), CrearMailerService(false));

        await service.SolicitarRecuperacion("no-es-un-mail");

        Assert.Empty(context.PasswordResetToken);
    }

    [Fact]
    public void ResetearPassword_CodigoCorrecto_CambiaPassword()
    {
        var context = CrearContexto(nameof(ResetearPassword_CodigoCorrecto_CambiaPassword));
        var usuario = CrearUsuario(context, 1, "admin@test.com");
        var passwordAntes = usuario.PASSWORD_HASH;
        CrearToken(context, usuario.ID_USUARIO, "123456");
        var service = new AuthService(context, CrearJwtTokenService(), CrearLicenciaService(context), CrearMailerService(false));

        service.ResetearPassword("admin@test.com", "123456", "nueva123");

        var usuarioRefrescado = context.Usuario.First(u => u.ID_USUARIO == usuario.ID_USUARIO);
        Assert.NotEqual(passwordAntes, usuarioRefrescado.PASSWORD_HASH);
        Assert.True(BCrypt.Net.BCrypt.Verify("nueva123", usuarioRefrescado.PASSWORD_HASH));
        Assert.True(context.PasswordResetToken.Single().USADO);
    }

    [Fact]
    public void ResetearPassword_CodigoIncorrecto_LanzaYRegistraIntento()
    {
        var context = CrearContexto(nameof(ResetearPassword_CodigoIncorrecto_LanzaYRegistraIntento));
        var usuario = CrearUsuario(context, 1, "admin@test.com");
        CrearToken(context, usuario.ID_USUARIO, "123456");
        var service = new AuthService(context, CrearJwtTokenService(), CrearLicenciaService(context), CrearMailerService(false));

        var ex = Assert.Throws<ArgumentException>(() =>
            service.ResetearPassword("admin@test.com", "999999", "nueva123"));

        Assert.Equal("Código inválido o expirado", ex.Message);
        Assert.Equal(1, context.PasswordResetToken.Single().INTENTOS);
        Assert.True(BCrypt.Net.BCrypt.Verify("123456", usuario.PASSWORD_HASH));
    }

    [Fact]
    public void ResetearPassword_TokenUsado_Lanza()
    {
        var context = CrearContexto(nameof(ResetearPassword_TokenUsado_Lanza));
        var usuario = CrearUsuario(context, 1, "admin@test.com");
        CrearToken(context, usuario.ID_USUARIO, "123456", usado: true);
        var service = new AuthService(context, CrearJwtTokenService(), CrearLicenciaService(context), CrearMailerService(false));

        var ex = Assert.Throws<ArgumentException>(() =>
            service.ResetearPassword("admin@test.com", "123456", "nueva123"));

        Assert.Equal("Código inválido o expirado", ex.Message);
    }

    [Fact]
    public void ResetearPassword_TokenExpirado_Lanza()
    {
        var context = CrearContexto(nameof(ResetearPassword_TokenExpirado_Lanza));
        var usuario = CrearUsuario(context, 1, "admin@test.com");
        CrearToken(context, usuario.ID_USUARIO, "123456", expira: DateTime.UtcNow.AddMinutes(-5));
        var service = new AuthService(context, CrearJwtTokenService(), CrearLicenciaService(context), CrearMailerService(false));

        var ex = Assert.Throws<ArgumentException>(() =>
            service.ResetearPassword("admin@test.com", "123456", "nueva123"));

        Assert.Equal("Código inválido o expirado", ex.Message);
    }

    [Fact]
    public void ResetearPassword_PasswordCorta_Lanza()
    {
        var context = CrearContexto(nameof(ResetearPassword_PasswordCorta_Lanza));
        var usuario = CrearUsuario(context, 1, "admin@test.com");
        CrearToken(context, usuario.ID_USUARIO, "123456");
        var service = new AuthService(context, CrearJwtTokenService(), CrearLicenciaService(context), CrearMailerService(false));

        var ex = Assert.Throws<ArgumentException>(() =>
            service.ResetearPassword("admin@test.com", "123456", "corta"));

        Assert.Contains("6 caracteres", ex.Message);
    }

    [Fact]
    public void ResetearPassword_IntentaCincoVeces_AgotaIntentos()
    {
        var context = CrearContexto(nameof(ResetearPassword_IntentaCincoVeces_AgotaIntentos));
        var usuario = CrearUsuario(context, 1, "admin@test.com");
        CrearToken(context, usuario.ID_USUARIO, "123456", intentos: PasswordResetToken.MaxIntentos);
        var service = new AuthService(context, CrearJwtTokenService(), CrearLicenciaService(context), CrearMailerService(false));

        var ex = Assert.Throws<ArgumentException>(() =>
            service.ResetearPassword("admin@test.com", "123456", "nueva123"));

        Assert.Equal("Código inválido o expirado", ex.Message);
    }
}