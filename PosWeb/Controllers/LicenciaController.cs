using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PosWeb.Application.Licensing;
using PosWeb.Contracts;

namespace PosWeb.Controllers;

/// <summary>
/// Gestión de licencias y suscripciones de PosWeb.
/// Administra la activación, verificación y consulta del estado de licencias
/// vinculadas a la cuenta de MercadoPago del comercio.
/// </summary>
[ApiController]
[Route("api/licencia")]
public class LicenciaController : ControllerBase
{
    private readonly LicenciaService _licenciaService;

    public LicenciaController(LicenciaService licenciaService)
    {
        _licenciaService = licenciaService;
    }

    /// <summary>
    /// Activa una licencia en esta máquina usando la clave de licencia.
    /// Endpoint público (no requiere autenticación) para el primer inicio.
    /// </summary>
    /// <param name="request">Clave de licencia obtenida tras la compra o asignación manual.</param>
    /// <returns>Estado de la licencia incluyendo plan, límites y vencimiento.</returns>
    /// <response code="200">Licencia activada correctamente.</response>
    /// <response code="400">Clave inválida, licencia pendiente de pago o error de conexión.</response>
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
            NextBilling = licencia.NextBilling,
            DaysRemaining = licencia.NextBilling.HasValue
                ? (int)(licencia.NextBilling.Value - DateTime.UtcNow).TotalDays
                : null,
            MaxSucursales = limites.maxSucursales,
            MaxAdmins = limites.maxAdmins,
            MaxUsuarios = limites.maxUsuarios,
            CacheValido = licencia.CacheValido,
        });
    }

    /// <summary>
    /// Consulta el estado completo de la licencia actual.
    /// Requiere autenticación (Admin o SuperAdmin).
    /// Fuerza una verificación remota contra el Worker si el cache expiró.
    /// </summary>
    /// <returns>Estado detallado de la licencia: plan, límites, vencimiento, gracia y cache.</returns>
    /// <response code="200">Información de licencia (puede devolver activa=false si no hay licencia).</response>
    /// <response code="401">No autenticado.</response>
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
            NextBilling = local.NextBilling,
            DaysRemaining = local.NextBilling.HasValue
                ? (int)(local.NextBilling.Value - DateTime.UtcNow).TotalDays
                : null,
            MaxSucursales = limites.maxSucursales,
            MaxAdmins = limites.maxAdmins,
            MaxUsuarios = limites.maxUsuarios,
            CacheValido = local.CacheValido,
        });
    }

    /// <summary>
    /// Resumen rápido de la licencia para el indicador del header.
    /// Requiere autenticación (Admin o SuperAdmin).
    /// Solo retorna si está activa, el plan y los días restantes.
    /// </summary>
    /// <returns>Resumen mínimo: activa, plan, daysRemaining.</returns>
    /// <response code="200">Resumen de licencia.</response>
    [Authorize(Roles = "Admin,SuperAdmin")]
    [HttpGet("resumen")]
    public async Task<IActionResult> Resumen()
    {
        var local = await _licenciaService.ObtenerEstadoLocal();

        return Ok(new LicenciaResumenDto
        {
            Activa = local?.Activa ?? false,
            Plan = local?.Plan ?? "",
            DaysRemaining = local?.NextBilling.HasValue == true
                ? (int)(local.NextBilling.Value - DateTime.UtcNow).TotalDays
                : null,
        });
    }

    /// <summary>
    /// Forza una verificación remota de la licencia contra el Worker de Cloudflare.
    /// Útil para diagnosticar problemas de conectividad o forzar la sincronización.
    /// Requiere autenticación (Admin o SuperAdmin).
    /// </summary>
    /// <returns>Resultado de la verificación con motivo en caso de falla.</returns>
    /// <response code="200">Resultado de la verificación remota.</response>
    [Authorize(Roles = "Admin,SuperAdmin")]
    [HttpPost("verificar")]
    public async Task<IActionResult> Verificar()
    {
        var (permitido, motivo) = await _licenciaService.VerificarAcceso();
        return Ok(new { permitido, motivo });
    }
}
