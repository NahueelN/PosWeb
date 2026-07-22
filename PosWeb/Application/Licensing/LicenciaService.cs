using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using PosWeb.Data;
using PosWeb.Domain;

namespace PosWeb.Application.Licensing;

public class LicenciaService
{
    private readonly PosDbContextLocal _context;
    private readonly HttpClient _httpClient;
    private readonly string? _workerUrl;
    private readonly int _offlineHours;
    private readonly IEncryptionService _encryption;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
        PropertyNameCaseInsensitive = true
    };

    public LicenciaService(
        PosDbContextLocal context,
        IConfiguration configuration,
        IEncryptionService encryption)
    {
        _context = context;
        _httpClient = new HttpClient { Timeout = TimeSpan.FromSeconds(10) };
        _workerUrl = configuration["Licensing:WorkerUrl"];
        _offlineHours = int.Parse(configuration["Licensing:OfflineHours"] ?? "72");
        _encryption = encryption;
    }

    public async Task<(bool exito, string? mensaje, LicenciaConfig? licencia)> Activar(string licenseKey)
    {
        if (string.IsNullOrWhiteSpace(_workerUrl))
            return (false, "Worker de licencias no configurado", null);

        var machineId = await ObtenerOCrearMachineId();

        HttpResponseMessage response;
        try
        {
            response = await _httpClient.PostAsJsonAsync($"{_workerUrl}/activate", new
            {
                license_key = licenseKey,
                machine_id = machineId
            });
        }
        catch (HttpRequestException)
        {
            return (false, "No se pudo conectar con el servidor de licencias", null);
        }

        if (!response.IsSuccessStatusCode)
        {
            string errorMsg;
            try
            {
                var errorObj = await response.Content.ReadFromJsonAsync<WorkerErrorResponse>(JsonOptions);
                errorMsg = errorObj?.Error ?? $"HTTP {(int)response.StatusCode}";
            }
            catch
            {
                errorMsg = $"HTTP {(int)response.StatusCode}";
            }
            return (false, $"Error al activar: {errorMsg}", null);
        }

        var result = await response.Content.ReadFromJsonAsync<ActivateWorkerResponse>(JsonOptions);
        if (result == null || !result.Success)
            return (false, "Licencia inválida o ya activada en otro dispositivo", null);

        var existente = await _context.Set<LicenciaConfig>().FirstOrDefaultAsync();
        if (existente != null)
            _context.Set<LicenciaConfig>().Remove(existente);

        var licencia = new LicenciaConfig
        {
            LicenseKey = _encryption.Encrypt(licenseKey),
            Plan = NormalizarPlan(result.Plan),
            Estado = result.Status,
            MachineId = machineId,
        };
        licencia.ActualizarEstado(result.Status);

        _context.Set<LicenciaConfig>().Add(licencia);

        await SincronizarSuscripcionConLicencia(licencia);

        await _context.SaveChangesAsync();

        return (true, null, licencia);
    }

    public async Task<(bool permitido, string? motivo)> VerificarAcceso()
    {
        if (string.IsNullOrWhiteSpace(_workerUrl))
            return (true, null);

        var licencia = await _context.Set<LicenciaConfig>().FirstOrDefaultAsync();
        if (licencia == null)
            return (false, "No hay licencia activa. Active su licencia para continuar.");

        if (licencia.CacheValido && licencia.Activa)
            return (true, null);

        try
        {
            var licenseKey = _encryption.Decrypt(licencia.LicenseKey);

            var response = await _httpClient.PostAsJsonAsync($"{_workerUrl}/status", new
            {
                license_key = licenseKey,
                machine_id = licencia.MachineId
            });

            if (!response.IsSuccessStatusCode)
                return EvaluarCacheOffline(licencia);

            var result = await response.Content.ReadFromJsonAsync<StatusWorkerResponse>(JsonOptions);
            if (result == null)
                return EvaluarCacheOffline(licencia);

            if (!result.Valid)
            {
                licencia.ActualizarEstado("cancelled");
                await _context.SaveChangesAsync();
                return (false, "Licencia inválida o cancelada.");
            }

            var graceUntil = result.GraceUntil != null ? DateTime.Parse(result.GraceUntil) : (DateTime?)null;
            licencia.ActualizarEstado(result.Status, graceUntil);

            if (!licencia.Activa)
            {
                await _context.SaveChangesAsync();
                return (false, $"Licencia en estado: {result.Status}. Contacte al soporte para renovar.");
            }

            await _context.SaveChangesAsync();
            return (true, null);
        }
        catch (HttpRequestException)
        {
            return EvaluarCacheOffline(licencia);
        }
        catch (FormatException)
        {
            return (false, "Datos de licencia corruptos. Re-active su licencia.");
        }
    }

    private (bool permitido, string? motivo) EvaluarCacheOffline(LicenciaConfig licencia)
    {
        if (!licencia.LastVerifiedAt.HasValue)
            return (false, "No se pudo verificar la licencia. Requiere conexión inicial.");

        if (!licencia.VerifiedUntil.HasValue)
            return (false, "Datos de licencia inconsistentes.");

        var tiempoExpirado = DateTime.UtcNow - licencia.VerifiedUntil.Value;
        if (tiempoExpirado.TotalHours <= _offlineHours)
            return (true, null);

        return (false, $"Licencia sin verificar por más de {_offlineHours}h. Conéctese a internet.");
    }

    public async Task<LicenciaConfig?> ObtenerEstadoLocal()
    {
        return await _context.Set<LicenciaConfig>().FirstOrDefaultAsync();
    }

    public (int maxSucursales, int maxAdmins, int maxUsuarios) ObtenerLimitesPlan()
    {
        var licencia = _context.Set<LicenciaConfig>().FirstOrDefault();
        if (licencia == null)
            return (0, 0, 0);

        var suscripcion = _context.Suscripcion.FirstOrDefault(s =>
            s.ID_USUARIO_TITULAR == _context.Usuario
                .Where(u => u.ROL == Roles.Admin)
                .OrderBy(u => u.ID_USUARIO)
                .Select(u => u.ID_USUARIO)
                .FirstOrDefault());

        if (suscripcion != null)
            return (suscripcion.MAX_SUCURSALES ?? int.MaxValue,
                    suscripcion.MAX_ADMIN ?? int.MaxValue,
                    suscripcion.MAX_USUARIOS ?? int.MaxValue);

        return licencia.Plan switch
        {
            NivelesSuscripcion.Media => (3, 1, 5),
            NivelesSuscripcion.Maxima => (int.MaxValue, int.MaxValue, int.MaxValue),
            _ => (1, 1, 1)
        };
    }

    public async Task<string> ObtenerOCrearMachineId()
    {
        var existente = await _context.Set<LicenciaConfig>().FirstOrDefaultAsync();
        if (existente != null && !string.IsNullOrEmpty(existente.MachineId))
            return existente.MachineId;

        return Guid.NewGuid().ToString("N")[..16];
    }

    private async Task SincronizarSuscripcionConLicencia(LicenciaConfig licencia)
    {
        var admin = await _context.Usuario
            .Where(u => u.ROL == Roles.Admin)
            .OrderBy(u => u.ID_USUARIO)
            .FirstOrDefaultAsync();

        if (admin == null)
            return;

        var suscripcion = await _context.Suscripcion
            .FirstOrDefaultAsync(s => s.ID_USUARIO_TITULAR == admin.ID_USUARIO);

        if (suscripcion == null)
            return;

        var limites = PlanLimits.Get(licencia.Plan);
        suscripcion.Activar();
        suscripcion.CambiarNivel(
            licencia.Plan,
            suscripcion.COSTO_MENSUAL,
            limites.maxSucursales == int.MaxValue ? (int?)null : limites.maxSucursales,
            limites.maxAdmins == int.MaxValue ? (int?)null : limites.maxAdmins,
            limites.maxUsuarios == int.MaxValue ? (int?)null : limites.maxUsuarios);

        admin.ActivarSuscripcion();
    }

    private static string NormalizarPlan(string plan) => plan.ToLowerInvariant() switch
    {
        "media" => NivelesSuscripcion.Media,
        "maxima" => NivelesSuscripcion.Maxima,
        _ => NivelesSuscripcion.Basica
    };

    private class ActivateWorkerResponse
    {
        [JsonPropertyName("success")]
        public bool Success { get; set; }

        [JsonPropertyName("plan")]
        public string Plan { get; set; } = "";

        [JsonPropertyName("status")]
        public string Status { get; set; } = "";

        [JsonPropertyName("next_billing")]
        public string? NextBilling { get; set; }
    }

    private class StatusWorkerResponse
    {
        [JsonPropertyName("valid")]
        public bool Valid { get; set; }

        [JsonPropertyName("plan")]
        public string Plan { get; set; } = "";

        [JsonPropertyName("status")]
        public string Status { get; set; } = "";

        [JsonPropertyName("next_billing")]
        public string? NextBilling { get; set; }

        [JsonPropertyName("grace_until")]
        public string? GraceUntil { get; set; }
    }

    private class WorkerErrorResponse
    {
        [JsonPropertyName("error")]
        public string Error { get; set; } = "";
    }
}
