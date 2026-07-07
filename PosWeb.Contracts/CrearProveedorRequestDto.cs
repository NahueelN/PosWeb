namespace PosWeb.Contracts;

public class CrearProveedorRequestDto
{
    public string Nombre { get; set; } = null!;
    public string? TipoDocumento { get; set; }
    public string? NroDocumento { get; set; }
    public string? Telefono { get; set; }
    public string? Domicilio { get; set; }
    public string? Mail { get; set; }
    public string? IvaCondicion { get; set; }
}
