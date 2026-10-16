using Microsoft.Extensions.Configuration;
using PosWeb.Domain;

namespace PosWeb.Application.Licensing;

public static class DevTrialBootstrap
{
    public static bool ShouldRun(bool isDevelopment, IConfiguration configuration, string? adminRole, string? adminMail, bool hasLicense)
    {
        var configured = bool.TryParse(configuration["Licensing:DevTrialBootstrap"], out var value) && value;
        return (isDevelopment || configured)
        && adminRole == Roles.SuperAdmin
        && adminMail == "admin@posweb.com"
        && !hasLicense;
    }
}
