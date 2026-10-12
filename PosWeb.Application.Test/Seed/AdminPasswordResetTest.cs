using Microsoft.Extensions.Configuration;
using PosWeb.Application.Seed;

namespace PosWeb.Application.Test.Seed;

public class AdminPasswordResetTest
{
    [Fact]
    public void ShouldRun_ProductionWithoutFlag_ReturnsFalse()
    {
        Assert.False(AdminPasswordReset.ShouldRun(false, Configuration()));
    }

    [Fact]
    public void ShouldRun_ProductionWithTrueFlag_ReturnsTrue()
    {
        Assert.True(AdminPasswordReset.ShouldRun(false, Configuration(("Seed:ResetAdminPassword", "true"))));
    }

    [Fact]
    public void ShouldRun_Development_ReturnsTrue()
    {
        Assert.True(AdminPasswordReset.ShouldRun(true, Configuration()));
    }

    [Theory]
    [InlineData("false")]
    [InlineData("invalid")]
    public void ShouldRun_ProductionWithNonTrueFlag_ReturnsFalse(string value)
    {
        Assert.False(AdminPasswordReset.ShouldRun(false, Configuration(("Seed:ResetAdminPassword", value))));
    }

    private static IConfiguration Configuration(params (string Key, string Value)[] values) =>
        new ConfigurationBuilder().AddInMemoryCollection(values.ToDictionary(value => value.Key, value => (string?)value.Value)).Build();
}
