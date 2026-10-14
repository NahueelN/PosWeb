using Microsoft.Extensions.Configuration;
using PosWeb.Application.Licensing;
using PosWeb.Domain;

namespace PosWeb.Application.Test.Licensing;

public class DevTrialBootstrapTest
{
    [Fact]
    public void ShouldRun_ProductionWithoutFlag_ReturnsFalse()
    {
        Assert.False(DevTrialBootstrap.ShouldRun(false, Configuration(), Roles.SuperAdmin, "admin@posweb.com", false));
    }

    [Fact]
    public void ShouldRun_ProductionWithFlag_ReturnsTrue()
    {
        Assert.True(DevTrialBootstrap.ShouldRun(false, Configuration(("Licensing:DevTrialBootstrap", "true")), Roles.SuperAdmin, "admin@posweb.com", false));
    }

    [Fact]
    public void ShouldRun_DevelopmentWithoutFlag_ReturnsTrue()
    {
        Assert.True(DevTrialBootstrap.ShouldRun(true, Configuration(), Roles.SuperAdmin, "admin@posweb.com", false));
    }

    [Fact]
    public void ShouldRun_WhenLicenseExists_ReturnsFalse()
    {
        Assert.False(DevTrialBootstrap.ShouldRun(false, Configuration(("Licensing:DevTrialBootstrap", "true")), Roles.SuperAdmin, "admin@posweb.com", true));
    }

    [Theory]
    [InlineData("Admin", "admin@posweb.com")]
    [InlineData(Roles.SuperAdmin, "other@posweb.com")]
    public void ShouldRun_WhenSeedIdentityDiffers_ReturnsFalse(string role, string mail)
    {
        Assert.False(DevTrialBootstrap.ShouldRun(false, Configuration(("Licensing:DevTrialBootstrap", "true")), role, mail, false));
    }

    [Theory]
    [InlineData("false")]
    [InlineData("invalid")]
    public void ShouldRun_WhenFlagIsNotTrue_ReturnsFalse(string value)
    {
        Assert.False(DevTrialBootstrap.ShouldRun(false, Configuration(("Licensing:DevTrialBootstrap", value)), Roles.SuperAdmin, "admin@posweb.com", false));
    }

    private static IConfiguration Configuration(params (string Key, string Value)[] values) =>
        new ConfigurationBuilder().AddInMemoryCollection(values.ToDictionary(value => value.Key, value => (string?)value.Value)).Build();
}
