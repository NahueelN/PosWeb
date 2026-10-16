namespace PosWeb.Contracts;

public class ChangePasswordRequestDto
{
    public string Actual { get; set; } = string.Empty;
    public string Nueva { get; set; } = string.Empty;
}
