using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using PosWeb.Application.Licensing;
using PosWeb.Data;
using PosWeb.Domain;

namespace PosWeb.Application.MercadoPago;

public class TransferenciaPollingService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<TransferenciaPollingService> _logger;
    private const int PollingIntervalMs = 5000;
    private const int IdleIntervalMs = 30000;
    private static readonly object LogMutex = new();
    private static DateTime _ultimoLogSinToken = DateTime.MinValue;
    private const int LogSinTokenIntervalMin = 10;

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

        // La confirmación automática (verificación instantánea del pago) es un beneficio del
        // plan Maxima. Sin Maxima las ventas pendientes se confirman manualmente por el cajero.
        var licenciaService = scope.ServiceProvider.GetRequiredService<LicenciaService>();
        if (!licenciaService.PermiteMercadoPago())
            return false;

        var ventasPendientes = await context.Venta
            .Where(v => v.ESTADO == EstadosVenta.PendientePago && !v.ANULADA)
            .OrderBy(v => v.ID_VENTA)
            .ToListAsync(ct);

        if (ventasPendientes.Count == 0)
            return false;

        var token = await mpService.ObtenerTokenValido();
        if (token == null)
        {
            LogSinToken();
            return false;
        }

        var httpClientFactory = scope.ServiceProvider.GetRequiredService<IHttpClientFactory>();
        var client = httpClientFactory.CreateClient("MercadoPago");

        foreach (var venta in ventasPendientes)
        {
            if (ct.IsCancellationRequested) break;

            // Solo se auto-confirman los cobros QR, que llevan external_reference y se atan
            // al pago. Las transferencias (sin referencia) se confirman manualmente: el
            // matching por monto no ata el pago a la venta.
            if (string.IsNullOrEmpty(venta.REFERENCIA_MP))
                continue;

            var encontrado = await BuscarPorReferencia(client, token, venta.REFERENCIA_MP, ct);

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

    private void LogSinToken()
    {
        lock (LogMutex)
        {
            var ahora = DateTime.UtcNow;
            if (ahora - _ultimoLogSinToken < TimeSpan.FromMinutes(LogSinTokenIntervalMin))
                return;
            _ultimoLogSinToken = ahora;
        }

        _logger.LogWarning(
            "MercadoPago: hay ventas pendientes pero el token no está disponible (sin vincular o requiere revincular). Las transferencias esperarán confirmación manual.");
    }

    private static async Task<bool> BuscarPorReferencia(HttpClient client, string accessToken, string referencia, CancellationToken ct)
    {
        try
        {
            var req = new HttpRequestMessage(HttpMethod.Get,
                $"https://api.mercadopago.com/v1/payments/search?external_reference={Uri.EscapeDataString(referencia)}&status=approved&limit=5");
            req.Headers.Add("Authorization", $"Bearer {accessToken}");

            var response = await client.SendAsync(req, ct);
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
}
