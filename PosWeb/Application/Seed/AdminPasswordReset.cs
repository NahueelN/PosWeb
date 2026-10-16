using Microsoft.Extensions.Configuration;

namespace PosWeb.Application.Seed;

public static class AdminPasswordReset
{
    public static bool ShouldRun(bool isDevelopment, IConfiguration configuration) =>
        isDevelopment || bool.TryParse(configuration["Seed:ResetAdminPassword"], out var value) && value;

    public static string Password(IConfiguration configuration) =>
        configuration["Seed:AdminPassword"] ?? FactoryAdminPassword.KnownFactoryPasswords[0];
}
