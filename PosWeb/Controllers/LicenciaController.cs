using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PosWeb.Application.Licensing;
using PosWeb.Contracts;
using PosWeb.Domain;

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
    /// Activa la licencia asociada al email con el que se contrató el plan.
    /// Endpoint público (no requiere autenticación): usado desde el login y desde
    /// el botón "Buscar licencia" para validar pagos recientes sin reiniciar.
    /// </summary>
    /// <param name="request">Email con el que se compró la licencia.</param>
    /// <returns>Estado de la licencia incluyendo plan, límites y vencimiento.</returns>
    /// <response code="200">Licencia activada correctamente.</response>
    /// <response code="400">Sin licencia para ese email o error de conexión.</response>
    [AllowAnonymous]
    [HttpPost("activar-por-email")]
    public async Task<IActionResult> ActivarPorEmail([FromBody] ActivarLicenciaPorEmailRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Email))
            return BadRequest(new { error = "Email es requerido" });

        var (exito, mensaje, licencia) = await _licenciaService.BuscarYActivarPorEmail(request.Email.Trim());

        if (!exito || licencia == null)
            return BadRequest(new { error = mensaje ?? "No se pudo activar la licencia" });

        return Ok(MapEstado(licencia));
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

        var licenciaEstado = MapEstado(local);
        licenciaEstado.Activa = local.Activa && permitido;

        return Ok(licenciaEstado);
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
            Estado = local?.Estado ?? "",
            DaysRemaining = local?.NextBilling.HasValue == true
                ? (int)(local.NextBilling.Value - DateTime.UtcNow).TotalDays
                : null,
            GraceHasta = local?.GraceHastaEfectivo,
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

    private LicenciaEstadoDto MapEstado(LicenciaConfig licencia)
    {
        var limites = _licenciaService.ObtenerLimitesPlan();

        return new LicenciaEstadoDto
        {
            Activa = licencia.Activa,
            Plan = licencia.Plan,
            Estado = licencia.Estado,
            VerificadoHasta = licencia.VerifiedUntil,
            GraceHasta = licencia.GraceHastaEfectivo,
            NextBilling = licencia.NextBilling,
            DaysRemaining = licencia.NextBilling.HasValue
                ? (int)(licencia.NextBilling.Value - DateTime.UtcNow).TotalDays
                : null,
            MaxSucursales = limites.maxSucursales,
            MaxAdmins = limites.maxAdmins,
            MaxUsuarios = limites.maxUsuarios,
            MaxProductos = limites.maxProductos,
            CacheValido = licencia.CacheValido,
        };
    }
}
