using Microsoft.AspNetCore.Mvc;
using PosWeb.Application.Auth;
using PosWeb.Contracts;
using PosWeb.Domain;
using System.Security.Claims;

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
    public async Task<IActionResult> Login([FromBody] LoginRequestDto request)
    {
        if (request.SucursalId <= 0)
        {
            return BadRequest(new { error = "Sucursal requerida" });
        }

        var result = await _authService.Login(request);
        return Ok(result);
    }

    [HttpPost("pin")]
    public async Task<IActionResult> PinLogin([FromBody] LoginRequestDto request)
    {
        if (request.SucursalId <= 0)
        {
            return BadRequest(new { error = "Sucursal requerida" });
        }

        var result = await _authService.PinLogin(request);
        return Ok(result);
    }

    [HttpPost("register")]
    [Microsoft.AspNetCore.Authorization.AllowAnonymous]
    public async Task<IActionResult> Register([FromBody] RegisterRequestDto request)
    {
        var userIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier);
        int? currentUserId = int.TryParse(userIdValue, out var parsedUserId) ? parsedUserId : null;

        try
        {
            var result = await _authService.Register(request, currentUserId);
            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { error = ex.Message });
        }
    }

    [HttpGet("me")]
    public IActionResult GetCurrentUser()
    {
        var userIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(userIdValue, out var userId))
            return Unauthorized(new { error = "No autenticado" });

        var usuario = _authService.GetCurrentUser(userId);
        if (usuario == null)
            return NotFound(new { error = "Usuario no encontrado" });

        return Ok(usuario);
    }
}
