using System.ComponentModel.DataAnnotations;

namespace PosWeb.Domain;

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

    public bool Activa => Estado is "active" or "grace";

    public string MachineId { get; set; } = string.Empty;

    public DateTime? LastVerifiedAt { get; set; }

    public DateTime? VerifiedUntil { get; set; }

    public DateTime? GraceUntil { get; set; }

    public DateTime? NextBilling { get; set; }

    public bool CacheValido => VerifiedUntil.HasValue && VerifiedUntil.Value > DateTime.UtcNow;

    public void ActualizarEstado(string estado, DateTime? graceUntil = null, DateTime? nextBilling = null)
    {
        Estado = estado;
        LastVerifiedAt = DateTime.UtcNow;
        VerifiedUntil = DateTime.UtcNow.AddHours(72);
        GraceUntil = graceUntil;
        NextBilling = nextBilling ?? NextBilling;
    }
}

public static class PlanLimits
{
    public static (int maxSucursales, int maxAdmins, int maxUsuarios) Get(string plan) => plan switch
    {
        NivelesSuscripcion.Media => (3, 1, 5),
        NivelesSuscripcion.Maxima => (int.MaxValue, int.MaxValue, int.MaxValue),
        _ => (1, 1, 1)
    };
}
