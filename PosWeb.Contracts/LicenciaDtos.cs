namespace PosWeb.Contracts;

/// <summary>
/// Request para activar una licencia a partir del email con el que se contrató.
/// </summary>
public class ActivarLicenciaPorEmailRequest
{
    /// <summary>Email asociado a la licencia comprada.</summary>
    public string Email { get; set; } = string.Empty;
}

/// <summary>
/// Estado completo de la licencia activa en esta máquina.
/// </summary>
public class LicenciaEstadoDto
{
    /// <summary>Indica si la licencia permite operar (estado active o grace).</summary>
    public bool Activa { get; set; }

    /// <summary>Plan contratado: Basica o Maxima.</summary>
    public string Plan { get; set; } = string.Empty;

    /// <summary>Estado actual: active, grace, paused, cancelled, pending.</summary>
    public string Estado { get; set; } = string.Empty;

    /// <summary>Fecha hasta la cual el cache local es válido (UTC).</summary>
    public DateTime? VerificadoHasta { get; set; }

    /// <summary>Fecha límite del período de gracia por cobro fallido (UTC).</summary>
    public DateTime? GraceHasta { get; set; }

    /// <summary>Fecha del próximo vencimiento de la licencia (UTC).</summary>
    public DateTime? NextBilling { get; set; }

    /// <summary>Días restantes hasta el próximo vencimiento. Negativo si ya venció.</summary>
    public int? DaysRemaining { get; set; }

    /// <summary>Máximo de sucursales permitidas por el plan.</summary>
    public int MaxSucursales { get; set; }

    /// <summary>Máximo de administradores permitidos por el plan.</summary>
    public int MaxAdmins { get; set; }

    /// <summary>Máximo de usuarios totales permitidos por el plan.</summary>
    public int MaxUsuarios { get; set; }

    /// <summary>Máximo de productos activos permitidos por el plan.</summary>
    public int MaxProductos { get; set; }

    /// <summary>Indica si el cache local de verificación sigue vigente.</summary>
    public bool CacheValido { get; set; }
}

/// <summary>
/// Resumen mínimo de licencia para el indicador del header.
/// </summary>
public class LicenciaResumenDto
{
    /// <summary>Indica si la licencia permite operar.</summary>
    public bool Activa { get; set; }

    /// <summary>Plan contratado.</summary>
    public string Plan { get; set; } = string.Empty;

    /// <summary>Estado actual de la licencia (permite detectar la prueba gratuita).</summary>
    public string Estado { get; set; } = string.Empty;

    /// <summary>Días restantes hasta el vencimiento.</summary>
    public int? DaysRemaining { get; set; }

    /// <summary>Fecha límite del período de gracia (UTC). Null si no aplica.</summary>
    public DateTime? GraceHasta { get; set; }
}
