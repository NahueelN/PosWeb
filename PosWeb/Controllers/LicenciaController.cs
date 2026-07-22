using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PosWeb.Application.Licensing;
using PosWeb.Contracts;

namespace PosWeb.Controllers;

[ApiController]
[Route("api/licencia")]
public class LicenciaController : ControllerBase
{
    private readonly LicenciaService _licenciaService;

    public LicenciaController(LicenciaService licenciaService)
    {
        _licenciaService = licenciaService;
    }

    [AllowAnonymous]
    [HttpPost("activar")]
    public async Task<IActionResult> Activar([FromBody] ActivarLicenciaRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.LicenseKey))
            return BadRequest(new { error = "LicenseKey es requerida" });

        var (exito, mensaje, licencia) = await _licenciaService.Activar(request.LicenseKey);

        if (!exito)
            return BadRequest(new { error = mensaje });

        var limites = PosWeb.Domain.PlanLimits.Get(licencia!.Plan);

        return Ok(new LicenciaEstadoDto
        {
            Activa = licencia.Activa,
            Plan = licencia.Plan,
            Estado = licencia.Estado,
            VerificadoHasta = licencia.VerifiedUntil,
            GraceHasta = licencia.GraceUntil,
            MaxSucursales = limites.maxSucursales,
            MaxAdmins = limites.maxAdmins,
            MaxUsuarios = limites.maxUsuarios,
            CacheValido = licencia.CacheValido,
        });
    }

    [Authorize(Roles = "Admin,SuperAdmin")]
    [HttpGet("estado")]
    public async Task<IActionResult> Estado()
    {
        var (permitido, _) = await _licenciaService.VerificarAcceso();
        var local = await _licenciaService.ObtenerEstadoLocal();

        if (local == null)
            return Ok(new { activa = false, mensaje = "No hay licencia configurada" });

        var limites = _licenciaService.ObtenerLimitesPlan();

        return Ok(new LicenciaEstadoDto
        {
            Activa = local.Activa && permitido,
            Plan = local.Plan,
            Estado = local.Estado,
            VerificadoHasta = local.VerifiedUntil,
            GraceHasta = local.GraceUntil,
            MaxSucursales = limites.maxSucursales,
            MaxAdmins = limites.maxAdmins,
            MaxUsuarios = limites.maxUsuarios,
            CacheValido = local.CacheValido,
        });
    }

    [Authorize(Roles = "Admin,SuperAdmin")]
    [HttpPost("verificar")]
    public async Task<IActionResult> Verificar()
    {
        var (permitido, motivo) = await _licenciaService.VerificarAcceso();
        return Ok(new { permitido, motivo });
    }
}
