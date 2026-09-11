using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PosWeb.Application.Respaldos;
using PosWeb.Domain;

namespace PosWeb.Controllers;

[ApiController]
[Route("api/respaldo")]
[Authorize(Roles = $"{Roles.SuperAdmin},{Roles.Admin}")]
public class RespaldoController : ControllerBase
{
    private readonly RespaldoService _respaldoService;

    public RespaldoController(RespaldoService respaldoService) => _respaldoService = respaldoService;

    [HttpPost("exportar")]
    public async Task<IActionResult> Exportar(CancellationToken cancellationToken)
    {
        try
        {
            var backup = await _respaldoService.ExportarAsync(cancellationToken);
            var fileName = $"posweb-{DateTime.Now:yyyyMMdd-HHmm}.posweb-backup";
            return File(backup, "application/octet-stream", fileName);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("importar")]
    [RequestSizeLimit(210_000_000)]
    public async Task<IActionResult> Importar(IFormFile archivo, CancellationToken cancellationToken)
    {
        if (archivo == null || archivo.Length == 0)
            return BadRequest(new { error = "Seleccioná un archivo de respaldo." });
        try
        {
            await using var stream = archivo.OpenReadStream();
            var empresa = await _respaldoService.RestaurarAsync(stream, archivo.Length, cancellationToken);
            return Ok(new { empresaNombre = empresa.Nombre });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("validar")]
    [RequestSizeLimit(210_000_000)]
    public async Task<IActionResult> Validar(IFormFile archivo, CancellationToken cancellationToken)
    {
        if (archivo == null || archivo.Length == 0)
            return BadRequest(new { error = "Seleccioná un archivo de respaldo." });

        try
        {
            await using var stream = archivo.OpenReadStream();
            var empresa = await _respaldoService.InspeccionarAsync(stream, archivo.Length, cancellationToken);
            return Ok(empresa);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("exportar-a-archivo")]
    public async Task<IActionResult> ExportarAArchivo([FromBody] ExportarAArchivoRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Ruta) || !Path.IsPathFullyQualified(request.Ruta) ||
            !string.Equals(Path.GetExtension(request.Ruta), ".posweb-backup", StringComparison.OrdinalIgnoreCase))
            return BadRequest(new { error = "La ubicación del respaldo no es válida." });

        try
        {
            var backup = await _respaldoService.ExportarAsync(cancellationToken);
            await System.IO.File.WriteAllBytesAsync(request.Ruta, backup, cancellationToken);
            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (IOException)
        {
            return BadRequest(new { error = "No se pudo guardar el respaldo en la ubicación seleccionada." });
        }
    }

    public class ExportarAArchivoRequest
    {
        public string Ruta { get; set; } = string.Empty;
    }
}
