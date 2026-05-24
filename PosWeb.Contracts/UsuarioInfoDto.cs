namespace PosWeb.Contracts;

public class UsuarioInfoDto
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string Rol { get; set; } = string.Empty;
}
