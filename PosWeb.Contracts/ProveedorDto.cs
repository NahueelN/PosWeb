namespace PosWeb.Contracts;

public class ProveedorDto
{
    public int Id { get; set; }
    public string Codigo { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;
    public string? TipoDocumento { get; set; }
    public string? NroDocumento { get; set; }
    public string? Telefono { get; set; }
    public string? Domicilio { get; set; }
    public string? Mail { get; set; }
    public bool Activo { get; set; }
}
