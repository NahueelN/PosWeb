using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using PosWeb.Application.Licensing;
using PosWeb.Data;

namespace PosWeb.Application.Test;

public class TrialPromoTest
{
    private sealed class Reloj(DateTimeOffset ahora) : TimeProvider
    {
        public DateTimeOffset Ahora { get; set; } = ahora;
        public override DateTimeOffset GetUtcNow() => Ahora;
    }

    private static readonly Dictionary<string, string?> Promo = new()
    {
        ["Licensing:PruebaGratuitaPromoDias"] = "30",
        ["Licensing:PruebaGratuitaPromoHasta"] = "2026-12-01T03:00:00Z"
    };

    private static async Task<TimeSpan> Duracion(string ahora, Dictionary<string, string?> config, TimeSpan? explicita = null, string? alIniciar = null)
    {
        var options = new DbContextOptionsBuilder<PosDbContextLocal>().UseInMemoryDatabase(Guid.NewGuid().ToString()).Options;
        await using var context = new PosDbContextLocal(options);
        var configuration = new ConfigurationBuilder().AddInMemoryCollection(config).Build();
        var encryption = new EncryptionService(Convert.ToBase64String(Encoding.UTF8.GetBytes("PosWeb_TestEncryptionKey_1234567890!")));
        var reloj = new Reloj(DateTimeOffset.Parse(ahora));
        var service = new LicenciaService(context, configuration, encryption, timeProvider: reloj);
        if (alIniciar != null) reloj.Ahora = DateTimeOffset.Parse(alIniciar);
        var trial = await service.IniciarPruebaGratuita("machine", explicita);
        Assert.NotNull(trial);
        Assert.NotNull(trial.NextBilling);
        Assert.NotNull(trial.LastVerifiedAt);
        return trial.NextBilling.Value - trial.LastVerifiedAt.Value;
    }

    [Theory]
    [InlineData("2026-11-15T12:00:00Z", 30)]
    [InlineData("2026-12-01T03:00:00Z", 7)]
    [InlineData("2026-11-30T23:00:00-03:00", 30)]
    public async Task PromoSegunFecha(string ahora, int dias)
    {
        Assert.Equal(dias, (await Duracion(ahora, Promo)).TotalDays, 4);
    }

    [Fact]
    public async Task SinPromoSonSieteDias()
    {
        Assert.Equal(7, (await Duracion("2026-11-15T12:00:00Z", new())).TotalDays, 4);
    }

    [Theory]
    [InlineData(null, "2026-12-01T03:00:00Z")]
    [InlineData("30", null)]
    [InlineData("0", "2026-12-01T03:00:00Z")]
    [InlineData("invalido", "2026-12-01T03:00:00Z")]
    [InlineData("30", "invalido")]
    public async Task PromoIncompletaOInvalidaNoAplica(string? dias, string? hasta)
    {
        var config = new Dictionary<string, string?> { ["Licensing:PruebaGratuitaPromoDias"] = dias, ["Licensing:PruebaGratuitaPromoHasta"] = hasta };
        Assert.Equal(7, (await Duracion("2026-11-15T12:00:00Z", config)).TotalDays, 4);
    }

    [Fact]
    public async Task OverrideEnMinutosTienePrioridad()
    {
        var config = new Dictionary<string, string?>(Promo) { ["Licensing:PruebaGratuitaMinutos"] = "5" };
        Assert.Equal(5, (await Duracion("2026-11-15T12:00:00Z", config)).TotalMinutes, 3);
    }

    [Fact]
    public async Task DuracionExplicitaTienePrioridad()
    {
        var config = new Dictionary<string, string?>(Promo) { ["Licensing:PruebaGratuitaMinutos"] = "5" };
        Assert.Equal(2, (await Duracion("2026-11-15T12:00:00Z", config, TimeSpan.FromHours(2))).TotalHours, 3);
    }

    [Fact]
    public async Task EvaluaFechaCuandoEmpiezaLaPrueba()
    {
        Assert.Equal(7, (await Duracion("2026-11-15T12:00:00Z", Promo, alIniciar: "2026-12-01T03:00:00Z")).TotalDays, 4);
    }
}
