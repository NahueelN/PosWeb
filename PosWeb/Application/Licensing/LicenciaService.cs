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
    private readonly string? _internalKey;
    private readonly int _offlineHours;
    private readonly TimeSpan _pruebaGratuitaDuracion;
    private readonly IEncryptionService _encryption;

    // Retroceso del reloj del sistema: tolerancia en minutos antes de considerarlo manipulación
    // (NTP o correcciones menores), y frecuencia mínima (minutos) con la que se persiste la marca.
    private const int RollbackToleranciaMinutos = 5;
    private const int PersistenciaMinutos = 1;

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
        _internalKey = configuration["Licensing:InternalKey"];
        _offlineHours = int.Parse(configuration["Licensing:OfflineHours"] ?? "72");
        // Duración de la prueba gratuita, en minutos. Config-driven para poder acortarla en dev
        // (ej. "Licensing:PruebaGratuitaMinutos": "5") sin recompilar; 7 días si no está seteado.
        var pruebaGratuitaMinutos = configuration["Licensing:PruebaGratuitaMinutos"];
        _pruebaGratuitaDuracion = pruebaGratuitaMinutos != null
            ? TimeSpan.FromMinutes(double.Parse(pruebaGratuitaMinutos))
            : TimeSpan.FromDays(7);
        _encryption = encryption;
    }

    public async Task<(bool exito, string? mensaje, LicenciaConfig? licencia)> BuscarYActivarPorEmail(string email)
    {
        if (string.IsNullOrWhiteSpace(_workerUrl) || string.IsNullOrWhiteSpace(_internalKey))
            return (false, "Worker o clave interna no configurados", null);

        try
        {
            var request = new HttpRequestMessage(HttpMethod.Post, $"{_workerUrl}/license-by-email")
            {
                Content = JsonContent.Create(new { email }, options: JsonOptions)
            };
            request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _internalKey);

            var response = await _httpClient.SendAsync(request);

            if (!response.IsSuccessStatusCode)
                return (false, $"Error del Worker: {(int)response.StatusCode}", null);

            var result = await response.Content.ReadFromJsonAsync<EmailLookupResponse>(JsonOptions);

            if (result == null || !result.Found)
                return (false, "No se encontró una licencia para este email", null);

            // Una licencia registrada como plan gratuito es solo un placeholder para el
            // checkout posterior: no se activa, para no pisar la prueba gratuita local.
            if (NormalizarPlan(result.Plan) == NivelesSuscripcion.Gratuito)
                return (false, "No se encontró una licencia para este email", null);

            var machineId = await ObtenerOCrearMachineId();

            var request2 = new HttpRequestMessage(HttpMethod.Post, $"{_workerUrl}/activate")
            {
                Content = JsonContent.Create(new
                {
                    license_key = result.LicenseKey,
                    machine_id = machineId
                }, options: JsonOptions)
            };

            var response2 = await _httpClient.SendAsync(request2);

            if (!response2.IsSuccessStatusCode)
            {
                var errorObj = await response2.Content.ReadFromJsonAsync<WorkerErrorResponse>(JsonOptions);
                return (false, errorObj?.Error ?? $"Error al activar: {(int)response2.StatusCode}", null);
            }

            var activateResult = await response2.Content.ReadFromJsonAsync<ActivateWorkerResponse>(JsonOptions);
            if (activateResult == null || !activateResult.Success)
                return (false, "No se pudo activar la licencia en este dispositivo", null);

            var existente = await _context.Set<LicenciaConfig>().FirstOrDefaultAsync();
            if (existente != null)
                _context.Set<LicenciaConfig>().Remove(existente);

            var nextBillingParsed = result.NextBilling != null ? DateTime.Parse(result.NextBilling) : (DateTime?)null;
            var graceHastaParsed = result.GraceUntil != null ? DateTime.Parse(result.GraceUntil) : (DateTime?)null;

            var licencia = new LicenciaConfig
            {
                LicenseKey = _encryption.Encrypt(result.LicenseKey),
                Plan = NormalizarPlan(result.Plan),
                Estado = result.Status,
                MachineId = machineId,
                NextBilling = nextBillingParsed,
            };
            licencia.ActualizarEstado(result.Status, graceUntil: graceHastaParsed, nextBilling: nextBillingParsed);

            _context.Set<LicenciaConfig>().Add(licencia);
            await SincronizarSuscripcionConLicencia(licencia);
            await _context.SaveChangesAsync();

            return (true, null, licencia);
        }
        catch (HttpRequestException)
        {
            return (false, "No se pudo conectar con el servidor de licencias", null);
        }
    }

    /// <summary>
    /// Registro: intenta activar por email; si no hay licencia paga, inicia la prueba gratuita.
    /// Retorna <c>esTrial = true</c> cuando se inició la prueba gratuita.
    /// </summary>
    public async Task<(bool esTrial, LicenciaConfig? licencia)> ActivarPorEmailOPrueba(string email)
    {
        var (exito, _, licencia) = await BuscarYActivarPorEmail(email);
        if (exito && licencia != null)
            return (false, licencia);

        var machineId = await ObtenerOCrearMachineId();
        var trial = await IniciarPruebaGratuita(machineId);
        return (true, trial);
    }

    /// <summary>
    /// Da de alta el email en el worker de licensing como plan gratuito (placeholder, status
    /// pending) para que cuando el usuario actualice/contrate el plan ya exista el registro.
    /// Fire-and-forget: si el worker falla no se propaga el error.
    /// </summary>
    public async Task RegistrarEmailEnWorker(string email)
    {
        if (string.IsNullOrWhiteSpace(_workerUrl) || string.IsNullOrWhiteSpace(_internalKey))
            return;

        try
        {
            var request = new HttpRequestMessage(HttpMethod.Post, $"{_workerUrl}/register")
            {
                Content = JsonContent.Create(new { email }, options: JsonOptions)
            };
            request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _internalKey);
            await _httpClient.SendAsync(request);
        }
        catch (HttpRequestException)
        {
            // No romper el registro si el worker no responde.
        }
    }

    public async Task<LicenciaConfig?> IniciarPruebaGratuita(string machineId, TimeSpan? duracion = null)
    {
        // Idempotente a propósito: si esta instalación ya tiene una LicenciaConfig (trial, paga,
        // vencida, lo que sea), no se le regala otra prueba gratuita nueva. Antes esto borraba y
        // recreaba la fila incondicionalmente, lo que permitía reiniciar el trial indefinidamente.
        var existente = await _context.Set<LicenciaConfig>().FirstOrDefaultAsync();
        if (existente != null)
            return null;

        var licencia = new LicenciaConfig();
        licencia.IniciarPruebaGratuita(machineId, duracion ?? _pruebaGratuitaDuracion);

        _context.Set<LicenciaConfig>().Add(licencia);
        await SincronizarSuscripcionConLicencia(licencia);
        await _context.SaveChangesAsync();

        return licencia;
    }

    public async Task<(bool permitido, string? motivo)> VerificarAcceso()
    {
        if (string.IsNullOrWhiteSpace(_workerUrl))
            return (true, null);

        var licencia = await _context.Set<LicenciaConfig>().FirstOrDefaultAsync();
        if (licencia == null)
            return (false, "No hay licencia activa. Active su licencia para continuar.");

        // Detección de retroceso del reloj: si la hora del sistema es anterior a la marca máxima
        // vista (persistida localmente), alguien atrasó el reloj para extender la licencia.
        var ahora = DateTime.UtcNow;
        if (licencia.LastSeenUtc.HasValue
            && ahora < licencia.LastSeenUtc.Value.AddMinutes(-RollbackToleranciaMinutos))
        {
            return (false, "Se detectó un cambio de hora. Verificar fecha y hora.");
        }

        if (!licencia.LastSeenUtc.HasValue
            || (ahora - licencia.LastSeenUtc.Value).TotalMinutes >= PersistenciaMinutos)
        {
            licencia.LastSeenUtc = ahora;
            await _context.SaveChangesAsync();
        }

        // Prueba gratuita: manejo local (sin verificación remota), tanto mientras corre como
        // una vez que ya quedó marcada vencida. Una prueba nunca tuvo una LicenseKey real, así
        // que dejarla caer al chequeo contra el Worker (más abajo) siempre falla ahí, y ese
        // fallo se interpreta como "sin conexión" — la gracia offline se calcula contra
        // VerifiedUntil, que para una prueba sigue apuntando a 72h después de que arrancó (no
        // de cuando venció), da una resta negativa, y "negativo <= horas de gracia" es siempre
        // verdadero: el acceso se reabría solo en el siguiente request después de bloquear una vez.
        if (licencia.EsTrial || licencia.Estado == EstadosLicencia.PruebaExpirada)
        {
            if (licencia.EsTrial && !licencia.PruebaExpirada)
                return (true, null);

            if (licencia.EsTrial)
            {
                DegradarSuscripcionAGratuita();
                licencia.MarcarPruebaExpirada();
                await _context.SaveChangesAsync();
            }

            // La prueba vence y NO bloquea: el comercio pasa a nivel Gratuito y sigue operando.
            return (true, null);
        }

        // Plan Gratuito: estado local siempre activo, sin verificación remota ni vencimiento.
        // Se evalúa sobre el NIVEL EFECTIVO (Suscripcion del titular, no la LicenciaConfig):
        // así editar la DB local a Plan=Gratuito en LicenciaConfig NO escapa del bloqueo si
        // la Suscripcion sigue en un plan pago vencido.
        if (ObtenerNivelActual() == NivelesSuscripcion.Gratuito)
        {
            // Defensa anti-elusión: aunque alguien edite la DB local a Gratuito (o un plan pago
            // vencido intente escapar del bloqueo), se mantiene el tope de 500 productos activos
            // de forma idempotente (si ya hay <=500 no se toca nada).
            if (RecortarProductosActivos(500))
                await _context.SaveChangesAsync();
            return (true, null);
        }

        // Vencimiento + gracia evaluado localmente, sin depender del cache de 72h ni del Worker:
        // el vencimiento queda persistido en la base local, así que el bloqueo se respeta incluso
        // estando offline. Se retorna false SIEMPRE que ya pasó la gracia, sin importar el estado
        // ya guardado (si no, la gracia offline del cache reabriría el acceso en el siguiente request).
        if (licencia.NextBilling.HasValue)
        {
            var graceHasta = licencia.GraceUntil ?? licencia.NextBilling.Value.AddHours(LicenciaConfig.GraceHoras);
            if (DateTime.UtcNow > graceHasta)
            {
                if (licencia.Estado != EstadosLicencia.Expirada
                    && licencia.Estado != EstadosLicencia.Cancelada
                    && licencia.Estado != EstadosLicencia.Pausada)
                {
                    licencia.ActualizarEstado(EstadosLicencia.Expirada);
                    await _context.SaveChangesAsync();
                }

                return (false, "Tu licencia está vencida. Renovala para continuar.");
            }
        }

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
                licencia.ActualizarEstado(string.IsNullOrWhiteSpace(result.Status)
                    ? EstadosLicencia.Cancelada
                    : result.Status);
                await _context.SaveChangesAsync();
                return (false, $"Licencia en estado \"{result.Status}\". Renovala para continuar.");
            }

            var graceUntil = result.GraceUntil != null ? DateTime.Parse(result.GraceUntil) : (DateTime?)null;
            var nextBilling = result.NextBilling != null ? DateTime.Parse(result.NextBilling) : (DateTime?)null;
            licencia.ActualizarEstado(result.Status, graceUntil, nextBilling);

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

    public (int maxSucursales, int maxAdmins, int maxUsuarios, int maxProductos) ObtenerLimitesPlan()
    {
        var admin = ObtenerAdminTitular();
        var suscripcion = admin != null
            ? _context.Suscripcion.FirstOrDefault(s => s.ID_USUARIO_TITULAR == admin.ID_USUARIO)
            : null;

        // La tabla canónica (PlanLimits) es la fuente única: se ignora lo guardado en la
        // Suscripcion para no mezclar fuentes divergentes (los MAX_* locales solo son copia).
        if (suscripcion != null)
            return PlanLimits.Get(suscripcion.NIVEL);

        var licencia = _context.Set<LicenciaConfig>().FirstOrDefault();
        if (licencia != null)
            return PlanLimits.Get(licencia.Plan);

        return (0, 0, 0, 0);
    }

    /// <summary>
    /// MercadoPago (vincular, QR, cobrar/verificar pagos) está disponible solo para el plan
    /// Maxima (incluye la prueba gratuita, que opera como Maxima). Si el plan no es Maxima,
    /// se bloquea la operación pero NO se desvincula la cuenta ni se borran tokens.
    /// </summary>
    public bool PermiteMercadoPago()
    {
        var admin = ObtenerAdminTitular();
        if (admin != null)
        {
            var suscripcion = _context.Suscripcion
                .FirstOrDefault(s => s.ID_USUARIO_TITULAR == admin.ID_USUARIO);
            if (suscripcion != null)
                return suscripcion.NIVEL == NivelesSuscripcion.Maxima;
        }

        var licencia = _context.Set<LicenciaConfig>().FirstOrDefault();
        return licencia?.Plan == NivelesSuscripcion.Maxima;
    }

    /// <summary>
    /// Nivel actual del titular (de la Suscripcion local si existe, si no de la LicenciaConfig).
    /// </summary>
    public string ObtenerNivelActual()
    {
        var admin = ObtenerAdminTitular();
        if (admin != null)
        {
            var suscripcion = _context.Suscripcion
                .FirstOrDefault(s => s.ID_USUARIO_TITULAR == admin.ID_USUARIO);
            if (suscripcion != null)
                return suscripcion.NIVEL;
        }

        var licencia = _context.Set<LicenciaConfig>().FirstOrDefault();
        return licencia?.Plan ?? NivelesSuscripcion.Gratuito;
    }

    /// <summary>
    /// Aplica el recorte de productos ACTIVOS al máximo del plan vigente. Se usa tras un import
    /// masivo: el import da de alta todos los productos y recién al terminar se desactivan los
    /// sobrantes hasta el tope del plan. Idempotente; retorna <c>true</c> si hubo recorte.
    /// </summary>
    public bool RecortarProductosAlMaximoDelPlan()
    {
        var (_, _, _, maxProductos) = ObtenerLimitesPlan();
        if (maxProductos == int.MaxValue || maxProductos <= 0)
            return false;

        return RecortarProductosActivos(maxProductos);
    }

    public async Task<string> ObtenerOCrearMachineId()
    {
        var existente = await _context.Set<LicenciaConfig>().FirstOrDefaultAsync();
        if (existente != null && !string.IsNullOrEmpty(existente.MachineId))
            return existente.MachineId;

        return Guid.NewGuid().ToString("N")[..16];
    }

    /// <summary>
    /// Admin dueño de la Suscripcion/LicenciaConfig de esta instalación: el marcado ES_TITULAR,
    /// o (dato legado sin backfill) el de menor ID como antes.
    /// </summary>
    private Usuario? ObtenerAdminTitular()
    {
        return _context.Usuario.FirstOrDefault(u => u.ROL == Roles.Admin && u.ES_TITULAR)
            ?? _context.Usuario.Where(u => u.ROL == Roles.Admin).OrderBy(u => u.ID_USUARIO).FirstOrDefault();
    }

    private async Task<Usuario?> ObtenerAdminTitularAsync()
    {
        return await _context.Usuario.FirstOrDefaultAsync(u => u.ROL == Roles.Admin && u.ES_TITULAR)
            ?? await _context.Usuario.Where(u => u.ROL == Roles.Admin).OrderBy(u => u.ID_USUARIO).FirstOrDefaultAsync();
    }

    private void DegradarSuscripcionAGratuita()
    {
        var admin = ObtenerAdminTitular();

        if (admin != null)
        {
            var suscripcion = _context.Suscripcion
                .FirstOrDefault(s => s.ID_USUARIO_TITULAR == admin.ID_USUARIO);

            if (suscripcion != null)
            {
                suscripcion.CambiarNivel(NivelesSuscripcion.Gratuito, 0m, 1, 1, 1);
                suscripcion.Activar();
                admin.ActivarSuscripcion();
            }
        }

        // El recorte corre siempre: al pasar a Gratuito el tope baja a 500 productos activos.
        RecortarProductosActivos(500);
    }

    /// <summary>
    /// Desactiva (borrado lógico, sin borrar filas) los productos ACTIVOS sobrantes hasta
    /// dejar a lo sumo <c>maximo</c> activos. Idempotente: si ya hay &lt;= maximo no toca nada.
    /// La selección es aleatoria para no desactivar siempre los mismos; los tickets históricos
    /// conservan la referencia. Retorna <c>true</c> si hubo recorte (requiere SaveChanges).
    /// </summary>
    private bool RecortarProductosActivos(int maximo)
    {
        // Short-circuit: si ya hay <=maximo activos (caso normal) no se carga nada.
        if (_context.Producto.Count(p => p.ACTIVO) <= maximo)
            return false;

        var activos = _context.Producto
            .Where(p => p.ACTIVO)
            .OrderBy(p => p.ID_PRODUCTO)
            .ToList();

        if (activos.Count <= maximo)
            return false;

        var sobrantes = activos.Skip(maximo).ToList();
        // Desactivación aleatoria: mezclar y tomar el sobrante (el orden aleatorio evita
        // desactivar siempre los mismos; los tickets históricos conservan la referencia).
        var rnd = new Random();
        for (int i = sobrantes.Count - 1; i > 0; i--)
        {
            var j = rnd.Next(i + 1);
            (sobrantes[i], sobrantes[j]) = (sobrantes[j], sobrantes[i]);
        }

        foreach (var producto in sobrantes)
        {
            producto.Desactivar();
        }

        return true;
    }

    private async Task SincronizarSuscripcionConLicencia(LicenciaConfig licencia)
    {
        var admin = await ObtenerAdminTitularAsync();

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
        "gratuito" => NivelesSuscripcion.Gratuito,
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

    private class EmailLookupResponse
    {
        [JsonPropertyName("found")]
        public bool Found { get; set; }

        [JsonPropertyName("license_key")]
        public string LicenseKey { get; set; } = "";

        [JsonPropertyName("plan")]
        public string Plan { get; set; } = "";

        [JsonPropertyName("status")]
        public string Status { get; set; } = "";

        [JsonPropertyName("next_billing")]
        public string? NextBilling { get; set; }

        [JsonPropertyName("grace_until")]
        public string? GraceUntil { get; set; }

        [JsonPropertyName("days_remaining")]
        public int? DaysRemaining { get; set; }
    }
}
