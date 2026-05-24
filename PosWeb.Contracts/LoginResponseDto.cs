namespace PosWeb.Contracts;

public class LoginResponseDto
{
    public string Token { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public UsuarioInfoDto Usuario { get; set; } = null!;
}
