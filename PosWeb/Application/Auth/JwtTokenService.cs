using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using PosWeb.Domain;

namespace PosWeb.Application.Auth;

public class JwtTokenService
{
    private readonly IConfiguration _configuration;
    private readonly string _secret;
    private readonly int _expirationHours;

    public JwtTokenService(IConfiguration configuration)
    {
        _configuration = configuration;
        _secret = configuration["Jwt:Secret"]
            ?? configuration["JWT_SECRET"]
            ?? "PosWeb_DevSecret_ChangeInProduction_MinLength32Chars!";
        _expirationHours = int.TryParse(configuration["Jwt:ExpirationHours"], out var hours) ? hours : 12;
    }

    public (string token, DateTime expires) GenerarToken(Usuario usuario, int sucursalId)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_secret));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var expires = DateTime.UtcNow.AddHours(_expirationHours);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, usuario.ID_USUARIO.ToString()),
            new Claim(ClaimTypes.Name, usuario.NOMBRE_USUARIO),
            new Claim(ClaimTypes.Role, usuario.ROL),
            new Claim("sucursalId", sucursalId.ToString())
        };

        var token = new JwtSecurityToken(
            claims: claims,
            expires: expires,
            signingCredentials: credentials
        );

        return (new JwtSecurityTokenHandler().WriteToken(token), expires);
    }
}
