namespace PosWeb.Contracts;

public class ConfirmarEmailRequestDto
{
    public string Email { get; set; } = string.Empty;
    public string Codigo { get; set; } = string.Empty;
}