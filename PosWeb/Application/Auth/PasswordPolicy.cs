using PosWeb.Application.Seed;

namespace PosWeb.Application.Auth;

public static class PasswordPolicy
{
    public const int MinimumLength = 6;

    public static void Validate(string password)
    {
        if (FactoryAdminPassword.KnownFactoryPasswords.Contains(password))
            throw new ArgumentException("La contraseña no puede ser una contraseña de fábrica");

        if (string.IsNullOrWhiteSpace(password) || password.Length < MinimumLength)
            throw new ArgumentException("La contraseña debe tener al menos 6 caracteres");
    }
}
