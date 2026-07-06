using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PosWeb.Application.Ofertas;
using PosWeb.Contracts;

namespace PosWeb.Controllers;

[ApiController]
[Route("api/ofertas")]
[Authorize]
public class OfertasController : ControllerBase
{
    private readonly OfertaService _ofertaService;

    public OfertasController(OfertaService ofertaService)
    {
        _ofertaService = ofertaService;
    }

    [HttpGet]
    public IActionResult Get()
        => Ok(_ofertaService.ObtenerTodos());

    [HttpGet("{id}")]
    public IActionResult GetById(int id)
    {
        try
        {
            return Ok(_ofertaService.ObtenerPorId(id));
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
    }

    [HttpPost]
    public IActionResult Post([FromBody] OfertaUpsertDto dto)
    {
        try
        {
            return Ok(_ofertaService.Crear(dto));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
    }

    [HttpPut("{id}")]
    public IActionResult Put(int id, [FromBody] OfertaUpsertDto dto)
    {
        try
        {
            return Ok(_ofertaService.Modificar(id, dto));
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpDelete("{id}")]
    public IActionResult Delete(int id)
    {
        try
        {
            _ofertaService.Eliminar(id);
            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
    }

    [HttpPost("{id}/reactivar")]
    public IActionResult Reactivar(int id)
    {
        try
        {
            _ofertaService.Reactivar(id);
            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
    }

    [HttpDelete("{id}/definitivo")]
    public IActionResult DeleteDefinitivo(int id)
    {
        try
        {
            _ofertaService.EliminarDefinitivo(id);
            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
    }
}
