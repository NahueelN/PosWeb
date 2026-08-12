using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using PosWeb.Data;
using PosWeb.Domain;

namespace PosWeb.Application.MercadoPago;

public class TransferenciaPollingService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<TransferenciaPollingService> _logger;
    private const int PollingIntervalMs = 5000;
    private const int IdleIntervalMs = 30000;
    private const decimal ToleranciaMatching = 0.01m;

    public TransferenciaPollingService(
        IServiceScopeFactory scopeFactory,
        ILogger<TransferenciaPollingService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("TransferenciaPollingService iniciado (payments/search cada {Interval}s)", PollingIntervalMs / 1000);

        while (!stoppingToken.IsCancellationRequested)
        {
            bool hayPendientes;
            try
            {
                hayPendientes = await ProcesarVentasPendientes(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error en polling de transferencias");
                hayPendientes = false;
            }

            var delay = hayPendientes ? PollingIntervalMs : IdleIntervalMs;
            await Task.Delay(delay, stoppingToken);
        }
    }

    private async Task<bool> ProcesarVentasPendientes(CancellationToken ct)
    {
        using var scope = _scopeFactory.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<PosDbContextLocal>();
        var mpService = scope.ServiceProvider.GetRequiredService<MercadoPagoService>();

        var ventasPendientes = await context.Venta
            .Where(v => v.ESTADO == EstadosVenta.PendientePago && !v.ANULADA)
            .OrderBy(v => v.ID_VENTA)
            .ToListAsync(ct);

        if (ventasPendientes.Count == 0)
            return false;

        var token = await mpService.ObtenerTokenValido();
        if (token == null)
            return false;

        foreach (var venta in ventasPendientes)
        {
            if (ct.IsCancellationRequested) break;

            bool encontrado;
            if (!string.IsNullOrEmpty(venta.REFERENCIA_MP))
            {
                encontrado = await BuscarPorReferencia(token, venta.REFERENCIA_MP, ct);
            }
            else
            {
                encontrado = await BuscarPagoReciente(token, venta.TOTAL, ct);
            }

            if (encontrado)
            {
                var ventaService = scope.ServiceProvider.GetRequiredService<Application.Ventas.VentaService>();
                ventaService.ConfirmarTransferencia(venta.ID_VENTA);
                _logger.LogInformation("Venta #{VentaId} confirmada automáticamente por ${Monto}",
                    venta.ID_VENTA, venta.TOTAL);
            }
        }

        return true;
    }

    private static async Task<bool> BuscarPorReferencia(string accessToken, string referencia, CancellationToken ct)
    {
        try
        {
            using var client = new HttpClient();
            client.Timeout = TimeSpan.FromSeconds(10);
            client.DefaultRequestHeaders.Add("Authorization", $"Bearer {accessToken}");

            var url = $"https://api.mercadopago.com/v1/payments/search?external_reference={Uri.EscapeDataString(referencia)}&status=approved&limit=5";

            var response = await client.GetAsync(url, ct);
            if (!response.IsSuccessStatusCode) return false;

            var content = await response.Content.ReadAsStringAsync(ct);
            var doc = JsonSerializer.Deserialize<JsonElement>(content);

            if (!doc.TryGetProperty("results", out var results)) return false;
            return results.GetArrayLength() > 0;
        }
        catch
        {
            return false;
        }
    }

    private static async Task<bool> BuscarPagoReciente(string accessToken, decimal montoEsperado, CancellationToken ct)
    {
        try
        {
            using var client = new HttpClient();
            client.Timeout = TimeSpan.FromSeconds(10);
            client.DefaultRequestHeaders.Add("Authorization", $"Bearer {accessToken}");

            var desde = DateTime.UtcNow.AddMinutes(-10).ToString("o");
            var hasta = DateTime.UtcNow.ToString("o");

            var url = $"https://api.mercadopago.com/v1/payments/search?sort=date_created&criteria=desc&range=date_created&begin_date={Uri.EscapeDataString(desde)}&end_date={Uri.EscapeDataString(hasta)}&status=approved&limit=30";

            var response = await client.GetAsync(url, ct);
            if (!response.IsSuccessStatusCode) return false;

            var content = await response.Content.ReadAsStringAsync(ct);
            var doc = JsonSerializer.Deserialize<JsonElement>(content);

            if (!doc.TryGetProperty("results", out var results)) return false;

            var minimo = montoEsperado * (1 - ToleranciaMatching);
            var maximo = montoEsperado * (1 + ToleranciaMatching);

            foreach (var payment in results.EnumerateArray())
            {
                if (payment.TryGetProperty("transaction_amount", out var amountProp) &&
                    amountProp.TryGetDecimal(out var amount))
                {
                    if (amount >= minimo && amount <= maximo)
                        return true;
                }
            }

            return false;
        }
        catch
        {
            return false;
        }
    }
}
