namespace PosWeb.Contracts;

public class ActivarLicenciaRequest
{
    public string LicenseKey { get; set; } = string.Empty;
}

public class LicenciaEstadoDto
{
    public bool Activa { get; set; }
    public string Plan { get; set; } = string.Empty;
    public string Estado { get; set; } = string.Empty;
    public DateTime? VerificadoHasta { get; set; }
    public DateTime? GraceHasta { get; set; }
    public int MaxSucursales { get; set; }
    public int MaxAdmins { get; set; }
    public int MaxUsuarios { get; set; }
    public bool CacheValido { get; set; }
}
