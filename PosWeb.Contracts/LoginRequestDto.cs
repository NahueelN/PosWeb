namespace PosWeb.Contracts;

public class LoginRequestDto
{
    public string Usuario { get; set; } = string.Empty;
    public string? Password { get; set; }
    public string? Pin { get; set; }
    public int SucursalId { get; set; }
}
