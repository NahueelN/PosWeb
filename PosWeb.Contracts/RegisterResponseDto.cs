namespace PosWeb.Contracts;

public class RegisterResponseDto
{
    public int Id { get; set; }
    public string Usuario { get; set; } = string.Empty;
    public string Mail { get; set; } = string.Empty;
    public string Rol { get; set; } = string.Empty;
    public int? UsuarioResponsableId { get; set; }
    public int? EmpresaId { get; set; }
}
