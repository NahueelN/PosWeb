namespace PosWeb.Contracts;

public class SucursalDto
{
    public int Id { get; set; }
    public int Numero { get; set; }
    public string Codigo { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;
    public bool Activo { get; set; }
}