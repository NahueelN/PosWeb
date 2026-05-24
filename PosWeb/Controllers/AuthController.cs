using Microsoft.AspNetCore.Mvc;
using PosWeb.Application.Auth;
using PosWeb.Contracts;

namespace PosWeb.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly AuthService _authService;

    public AuthController(AuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("login")]
    public IActionResult Login([FromBody] LoginRequestDto request)
    {
        if (request.SucursalId <= 0)
        {
            return BadRequest(new { error = "Sucursal requerida" });
        }

        var result = _authService.Login(request);
        return Ok(result);
    }

    [HttpPost("pin")]
    public IActionResult PinLogin([FromBody] LoginRequestDto request)
    {
        if (request.SucursalId <= 0)
        {
            return BadRequest(new { error = "Sucursal requerida" });
        }

        var result = _authService.PinLogin(request);
        return Ok(result);
    }
}
