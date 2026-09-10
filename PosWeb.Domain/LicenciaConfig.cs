using System.ComponentModel.DataAnnotations;

namespace PosWeb.Domain;

public static class EstadosLicencia
{
    public const string Activa = "active";
    public const string Gracia = "grace";
    public const string Pausada = "paused";
    public const string Cancelada = "cancelled";
    public const string Expirada = "expired";
    public const string Pendiente = "pending";
    public const string Prueba = "trial";
    public const string PruebaExpirada = "trial-expired";
}

public class LicenciaConfig
{
    [Key]
    public int Id { get; set; }

    [Required]
    public string LicenseKey { get; set; } = string.Empty;

    [Required]
    public string Plan { get; set; } = NivelesSuscripcion.Basica;

    [Required]
    public string Estado { get; set; } = "pending";

    public bool EsTrial => Estado == EstadosLicencia.Prueba;

    public bool PruebaExpirada => EsTrial && NextBilling.HasValue && NextBilling.Value < DateTime.UtcNow;

    public bool Activa => Estado is EstadosLicencia.Activa or EstadosLicencia.Gracia
        || (EsTrial && !PruebaExpirada);

    public string MachineId { get; set; } = string.Empty;

    public DateTime? LastVerifiedAt { get; set; }

    public DateTime? VerifiedUntil { get; set; }

    public DateTime? GraceUntil { get; set; }

    public DateTime? NextBilling { get; set; }

    /// <summary>Marca de reloj (UTC) más alta vista localmente. Solo avanza; sirve para detectar retrocesos de la hora del sistema.</summary>
    public DateTime? LastSeenUtc { get; set; }

    public bool CacheValido => VerifiedUntil.HasValue && VerifiedUntil.Value > DateTime.UtcNow;

    /// <summary>Horas de gracia tras el vencimiento antes de revocar el acceso.</summary>
    public const double GraceHoras = 48;

    /// <summary>
    /// Fecha límite de la gracia: la reportada por el Worker, o (si aún no se re-verificó)
    /// el vencimiento + 48h. Sirve para calcular el tiempo restante sin depender del cache.
    /// </summary>
    public DateTime? GraceHastaEfectivo => NextBilling.HasValue
        ? GraceUntil ?? NextBilling.Value.AddHours(GraceHoras)
        : GraceUntil;

    public void ActualizarEstado(string estado, DateTime? graceUntil = null, DateTime? nextBilling = null)
    {
        Estado = estado;
        LastVerifiedAt = DateTime.UtcNow;
        VerifiedUntil = DateTime.UtcNow.AddHours(72);
        GraceUntil = graceUntil;
        NextBilling = nextBilling ?? NextBilling;
    }

    public void IniciarPruebaGratuita(string machineId, TimeSpan? duracion = null)
    {
        Plan = NivelesSuscripcion.Maxima;
        Estado = EstadosLicencia.Prueba;
        MachineId = machineId;
        LastVerifiedAt = DateTime.UtcNow;
        VerifiedUntil = DateTime.UtcNow.AddHours(72);
        NextBilling = DateTime.UtcNow.Add(duracion ?? TimeSpan.FromDays(7));
        GraceUntil = null;
    }

    public void MarcarPruebaExpirada()
    {
        Estado = EstadosLicencia.PruebaExpirada;
        Plan = NivelesSuscripcion.Basica;
        LastVerifiedAt = DateTime.UtcNow;
    }
}

public static class PlanLimits
{
    public static (int maxSucursales, int maxAdmins, int maxUsuarios) Get(string plan) => plan switch
    {
        NivelesSuscripcion.Maxima => (int.MaxValue, int.MaxValue, int.MaxValue),
        _ => (1, int.MaxValue, 3)
    };
}
