using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PosWeb.Application.MercadoPago;
using System.Security.Claims;

namespace PosWeb.Controllers;

[ApiController]
[Route("api/mercadopago")]
public class MercadoPagoController : ControllerBase
{
    private readonly MercadoPagoService _mpService;

    public MercadoPagoController(MercadoPagoService mpService)
    {
        _mpService = mpService;
    }

    [HttpGet("auth-url")]
    [Authorize]
    public IActionResult AuthUrl()
    {
        if (!EsAdmin()) return Forbid();

        var url = _mpService.GenerarAuthUrl();
        return Ok(new { url });
    }

    [HttpGet("callback")]
    [AllowAnonymous]
    public async Task<IActionResult> Callback([FromQuery] string code, [FromQuery] string state)
    {
        var (success, error) = await _mpService.IntercambiarCodigo(code, state);
        if (!success)
            return BadRequest(new { error = error ?? "Error al vincular MercadoPago" });

        return Content(@"
<!DOCTYPE html>
<html><head><meta charset='utf-8'><title>PosWeb</title>
<style>body{font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#f8fafc}
.card{text-align:center;padding:32px;border-radius:16px;background:#fff;box-shadow:0 4px 24px rgba(0,0,0,.08)}
h2{color:#16a34a;margin:0 0 8px} p{color:#64748b;margin:0}</style></head>
<body><div class='card'><h2>MercadoPago vinculado</h2><p>Ya podés cerrar esta ventana y volver a PosWeb.</p></div></body></html>
", "text/html; charset=utf-8");
    }

    [HttpGet("estado")]
    [Authorize]
    public IActionResult Estado()
    {
        if (!EsAdminOrSuperAdmin()) return Forbid();

        var estado = _mpService.ObtenerEstado();
        if (estado == null)
            return Ok(new { vinculado = false });

        return Ok(estado);
    }

    [HttpPost("desvincular")]
    [Authorize]
    public IActionResult Desvincular()
    {
        if (!EsAdmin()) return Forbid();

        _mpService.Desvincular();
        return Ok(new { vinculado = false });
    }

    [HttpPost("verificar-pago")]
    [Authorize]
    public async Task<IActionResult> VerificarPago([FromBody] VerificarPagoRequest request)
    {
        if (request.Monto <= 0)
            return BadRequest(new { error = "Monto inválido" });

        var encontrado = await _mpService.VerificarTransferencia(request.Monto);
        return Ok(new { encontrado });
    }

    [HttpGet("qr")]
    [Authorize]
    public IActionResult Qr()
    {
        if (!EsAdminOrSuperAdmin()) return Forbid();

        var qrData = _mpService.ObtenerQrDataActivo();
        if (qrData == null)
            return NotFound(new { error = "QR no disponible. Asegurate de haber vinculado MP correctamente." });

        return Ok(new { qrData });
    }

    private bool EsAdmin()
    {
        var rol = User.FindFirst(ClaimTypes.Role)?.Value;
        return rol == "SuperAdmin" || rol == "Admin";
    }

    private bool EsAdminOrSuperAdmin()
    {
        var rol = User.FindFirst(ClaimTypes.Role)?.Value;
        return rol == "SuperAdmin" || rol == "Admin";
    }
}

public class VerificarPagoRequest
{
    public decimal Monto { get; set; }
}
