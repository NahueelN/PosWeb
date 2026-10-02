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

            // Fire-and-forget: si el envío falla, el usuario puede reenviar el código desde el login.
            if (!result.EmailConfirmado)
                _ = Task.Run(() => _authService.EnviarCodigoConfirmacionAlRegistrar(result.Id));

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

    [HttpPost("forgot-password")]
    [Microsoft.AspNetCore.Authorization.AllowAnonymous]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequestDto request)
    {
        await _authService.SolicitarRecuperacion(request.Email);

        // Mensaje genérico deliberado (anti-enumeración): no revela si el email existe.
        return Ok(new { message = "Si el email está registrado, recibirás un código para restablecer tu contraseña." });
    }

    [HttpPost("reset-password")]
    [Microsoft.AspNetCore.Authorization.AllowAnonymous]
    public IActionResult ResetPassword([FromBody] ResetPasswordRequestDto request)
    {
        _authService.ResetearPassword(request.Email, request.Codigo, request.NuevaPassword);
        return Ok(new { message = "Contraseña actualizada. Ya podés iniciar sesión." });
    }

    [HttpPost("reenviar-codigo")]
    [Microsoft.AspNetCore.Authorization.AllowAnonymous]
    public async Task<IActionResult> ReenviarCodigo([FromBody] ForgotPasswordRequestDto request)
    {
        await _authService.SolicitarConfirmacionEmail(request.Email);

        // Mensaje genérico deliberado (anti-enumeración): no revela si el email existe ni si ya confirmó.
        return Ok(new { message = "Si el email está registrado y pendiente de confirmación, recibirás un código." });
    }

    [HttpPost("confirmar-cuenta")]
    [Microsoft.AspNetCore.Authorization.AllowAnonymous]
    public IActionResult ConfirmarCuenta([FromBody] ConfirmarEmailRequestDto request)
    {
        _authService.ConfirmarEmail(request.Email, request.Codigo);
        return Ok(new { message = "Email confirmado. Ya podés iniciar sesión." });
    }
}
