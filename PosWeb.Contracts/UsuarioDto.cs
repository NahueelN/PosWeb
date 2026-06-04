namespace PosWeb.Contracts;

public class UsuarioDto
{
    public int Id { get; set; }
    public string NombreUsuario { get; set; } = string.Empty;
    public string? Mail { get; set; }
    public string Rol { get; set; } = string.Empty;
    public int? UsuarioResponsableId { get; set; }
    public string? UsuarioResponsableNombre { get; set; }
    public string? EmpresaRepresenta { get; set; }
    public bool Activo { get; set; }
    public bool SuscripcionActiva { get; set; }
    public bool AccesoHabilitado { get; set; }
    public bool PinConfigurado { get; set; }
}
