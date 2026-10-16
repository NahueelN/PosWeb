using PosWeb.Application.Seed;
using PosWeb.Domain;

namespace PosWeb.Application.Test.Seed;

public class FactoryAdminPasswordTest
{
    [Theory]
    [MemberData(nameof(KnownFactoryPasswords))]
    public void IsFactory_KnownFactoryPasswordHash_ReturnsTrue(string password)
    {
        Assert.True(FactoryAdminPassword.IsFactory(BCrypt.Net.BCrypt.HashPassword(password)));
    }

    [Fact]
    public void IsFactory_CustomPasswordHash_ReturnsFalse()
    {
        Assert.False(FactoryAdminPassword.IsFactory(BCrypt.Net.BCrypt.HashPassword("custom-password")));
    }

    [Fact]
    public void RandomPassword_ReturnsAtLeast32RandomBytesAsBase64Url()
    {
        var password = FactoryAdminPassword.RandomPassword();

        Assert.True(password.Length >= 43);
        Assert.Matches("^[A-Za-z0-9_-]+$", password);
    }

    [Theory]
    [MemberData(nameof(KnownFactoryPasswords))]
    public void TryRotate_FactoryAdminWithAnotherActiveAdministrator_Rotates(string password)
    {
        var admin = User(1, "admin", password, Roles.SuperAdmin);
        var otherAdmin = User(2, "owner", "custom-password", Roles.Admin);

        var rotated = FactoryAdminPassword.TryRotate(admin, [admin, otherAdmin]);

        Assert.True(rotated);
        Assert.False(FactoryAdminPassword.IsFactory(admin.PASSWORD_HASH));
    }

    [Fact]
    public void TryRotate_CustomPassword_DoesNotChange()
    {
        var admin = User(1, "admin", "custom-password", Roles.SuperAdmin);
        var hash = admin.PASSWORD_HASH;

        var rotated = FactoryAdminPassword.TryRotate(admin, [admin, User(2, "owner", "another-custom-password", Roles.Admin)]);

        Assert.False(rotated);
        Assert.Equal(hash, admin.PASSWORD_HASH);
    }

    [Fact]
    public void TryRotate_OnlyActiveAdministrator_DoesNotChange()
    {
        var admin = User(1, "admin", FactoryAdminPassword.KnownFactoryPasswords[0], Roles.SuperAdmin);
        var hash = admin.PASSWORD_HASH;

        var rotated = FactoryAdminPassword.TryRotate(admin, [admin]);

        Assert.False(rotated);
        Assert.Equal(hash, admin.PASSWORD_HASH);
    }

    public static IEnumerable<object[]> KnownFactoryPasswords() =>
        FactoryAdminPassword.KnownFactoryPasswords.Select(password => new object[] { password });

    private static Usuario User(int id, string username, string password, string role) =>
        new(id, username, BCrypt.Net.BCrypt.HashPassword(password), role);
}
