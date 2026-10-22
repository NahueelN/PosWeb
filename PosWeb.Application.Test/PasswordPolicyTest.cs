using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using PosWeb.Application.Auth;
using PosWeb.Application.Licensing;
using PosWeb.Application.Seed;
using PosWeb.Data;
using PosWeb.Domain;
using PosWeb.Testing;
using System.Text;

namespace PosWeb.Application.Test;

public class PasswordPolicyTest
{
    private static readonly string ValidPassword = new('a', PasswordPolicy.MinimumLength);
    private static readonly string OtherValidPassword = new('b', PasswordPolicy.MinimumLength);

    [Fact]
    public void Validate_RejectsShortPassword()
    {
        var exception = Assert.Throws<ArgumentException>(() => PasswordPolicy.Validate(new string('a', PasswordPolicy.MinimumLength - 1)));

        Assert.Contains("6 caracteres", exception.Message);
    }

    [Fact]
    public void Validate_RejectsFactoryPassword()
    {
        var exception = Assert.Throws<ArgumentException>(() => PasswordPolicy.Validate(FactoryAdminPassword.KnownFactoryPasswords[0]));

        Assert.Contains("fábrica", exception.Message);
    }

    [Fact]
    public void Validate_AcceptsMinimumLengthPassword()
    {
        PasswordPolicy.Validate(ValidPassword);
    }

    [Fact]
    public async Task Register_RejectsFactoryPassword()
    {
        var context = CrearContexto(nameof(Register_RejectsFactoryPassword));
        var request = new PosWeb.Contracts.RegisterRequestDto
        {
            Usuario = "new-user",
            Password = FactoryAdminPassword.KnownFactoryPasswords[0],
            Mail = "new-user@test.com",
        };

        var exception = await Assert.ThrowsAsync<ArgumentException>(() => CrearServicio(context).Register(request));

        Assert.Contains("fábrica", exception.Message);
    }

    [Fact]
    public void ResetearPassword_RejectsFactoryPassword()
    {
        var context = CrearContexto(nameof(ResetearPassword_RejectsFactoryPassword));
        CrearUsuario(context, 1, ValidPassword);

        var exception = Assert.Throws<ArgumentException>(() => CrearServicio(context).ResetearPassword("user-1@test.com", new string('1', PasswordPolicy.MinimumLength), FactoryAdminPassword.KnownFactoryPasswords[0]));

        Assert.Contains("fábrica", exception.Message);
    }

    [Fact]
    public void CambiarPassword_RejectsWrongCurrentPassword()
    {
        var context = CrearContexto(nameof(CambiarPassword_RejectsWrongCurrentPassword));
        var user = CrearUsuario(context, 1, ValidPassword);

        var exception = Assert.Throws<ArgumentException>(() => CrearServicio(context).CambiarPassword(user.ID_USUARIO, OtherValidPassword, new string('c', PasswordPolicy.MinimumLength)));

        Assert.Contains("actual", exception.Message);
    }

    [Fact]
    public void CambiarPassword_RejectsSamePassword()
    {
        var context = CrearContexto(nameof(CambiarPassword_RejectsSamePassword));
        var user = CrearUsuario(context, 1, ValidPassword);

        var exception = Assert.Throws<ArgumentException>(() => CrearServicio(context).CambiarPassword(user.ID_USUARIO, ValidPassword, ValidPassword));

        Assert.Contains("distinta", exception.Message);
    }

    [Fact]
    public void CambiarPassword_UpdatesOnlyCurrentUser()
    {
        var context = CrearContexto(nameof(CambiarPassword_UpdatesOnlyCurrentUser));
        var user = CrearUsuario(context, 1, ValidPassword);
        var otherUser = CrearUsuario(context, 2, OtherValidPassword);
        var otherHash = otherUser.PASSWORD_HASH;
        var newPassword = new string('c', PasswordPolicy.MinimumLength);

        CrearServicio(context).CambiarPassword(user.ID_USUARIO, ValidPassword, newPassword);

        Assert.True(BCrypt.Net.BCrypt.Verify(newPassword, user.PASSWORD_HASH));
        Assert.Equal(otherHash, otherUser.PASSWORD_HASH);
    }

    private static PosDbContextLocal CrearContexto(string dbName) => new(new DbContextOptionsBuilder<PosDbContextLocal>()
        .UseInMemoryDatabase(dbName)
        .Options);

    private static Usuario CrearUsuario(PosDbContextLocal context, int id, string password)
    {
        var user = new Usuario($"user-{id}", BCrypt.Net.BCrypt.HashPassword(password), Roles.Admin, $"user-{id}@test.com");
        TestHelpers.SetId(user, id, "ID_USUARIO");
        context.Usuario.Add(user);
        context.SaveChanges();
        return user;
    }

    private static AuthService CrearServicio(PosDbContextLocal context)
    {
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Jwt:Secret"] = "PosWeb_TestSecret_PosWeb_TestSecret_123!",
                ["Jwt:ExpirationHours"] = "1",
            })
            .Build();
        var encryption = new EncryptionService(Convert.ToBase64String(Encoding.UTF8.GetBytes("PosWeb_TestEncryptionKey_1234567890!")));
        return new AuthService(context, new JwtTokenService(configuration), new LicenciaService(context, configuration, encryption), new MailerService(configuration, NullLogger<MailerService>.Instance, new HttpClient()));
    }
}
