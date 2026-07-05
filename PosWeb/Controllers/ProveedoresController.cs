using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PosWeb.Application.Exceptions;
using PosWeb.Application.Proveedores;
using PosWeb.Contracts;

namespace PosWeb.Controllers;

[ApiController]
[Route("api/proveedores")]
[Authorize]
public class ProveedoresController : ControllerBase
{
    private readonly ProveedorService _proveedorService;

    public ProveedoresController(ProveedorService proveedorService)
    {
        _proveedorService = proveedorService;
    }

    [HttpGet]
    public ActionResult<List<ProveedorDto>> Listar([FromQuery] string? search)
    {
        try
        {
            var result = _proveedorService.Listar(search);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message });
        }
    }

    [HttpPost]
    public ActionResult<ProveedorDto> Crear([FromBody] CrearProveedorRequestDto request)
    {
        try
        {
            var result = _proveedorService.Crear(request);
            return Created($"/api/proveedores/{result.Id}", result);
        }
        catch (ProveedorCodigoDuplicadoException ex)
        {
            return Conflict(new { error = ex.Message });
        }
        catch (ProveedorDocumentoDuplicadoException ex)
        {
            return Conflict(new { error = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet("{id:int}")]
    public ActionResult<ProveedorDto> ObtenerPorId(int id)
    {
        try
        {
            var result = _proveedorService.ObtenerPorId(id);
            return Ok(result);
        }
        catch (ProveedorNoEncontradoException ex)
        {
            return NotFound(new { error = ex.Message });
        }
    }

    [HttpPut("{id:int}")]
    public ActionResult<ProveedorDto> Actualizar(int id, [FromBody] CrearProveedorRequestDto request)
    {
        try
        {
            var result = _proveedorService.Actualizar(id, request);
            return Ok(result);
        }
        catch (ProveedorNoEncontradoException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (ProveedorDocumentoDuplicadoException ex)
        {
            return Conflict(new { error = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpDelete("{id:int}")]
    public ActionResult Desactivar(int id)
    {
        try
        {
            _proveedorService.Desactivar(id);
            return NoContent();
        }
        catch (ProveedorNoEncontradoException ex)
        {
            return NotFound(new { error = ex.Message });
        }
    }
}
