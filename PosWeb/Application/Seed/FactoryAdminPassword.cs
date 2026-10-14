using System.Security.Cryptography;
using PosWeb.Domain;

namespace PosWeb.Application.Seed;

public static class FactoryAdminPassword
{
    public static readonly IReadOnlyList<string> KnownFactoryPasswords = ["123", "admin123"];

    public static bool IsFactory(string hash) => KnownFactoryPasswords.Any(password => BCrypt.Net.BCrypt.Verify(password, hash));

    public static string RandomPassword()
    {
        var bytes = RandomNumberGenerator.GetBytes(32);
        return Convert.ToBase64String(bytes).TrimEnd('=').Replace('+', '-').Replace('/', '_');
    }

    public static bool TryRotate(Usuario admin, IEnumerable<Usuario> users)
    {
        if (!IsFactory(admin.PASSWORD_HASH)
            || !users.Any(user => user.ID_USUARIO != admin.ID_USUARIO && user.ACTIVO
                && (user.ROL == Roles.Admin || user.ROL == Roles.SuperAdmin)))
            return false;

        admin.SetPasswordHash(BCrypt.Net.BCrypt.HashPassword(RandomPassword()));
        return true;
    }
}
