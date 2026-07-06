using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PosWeb.Application.Combos;
using PosWeb.Contracts;

namespace PosWeb.Controllers;

[ApiController]
[Route("api/combos")]
[Authorize]
public class CombosController : ControllerBase
{
    private readonly ComboService _comboService;

    public CombosController(ComboService comboService)
    {
        _comboService = comboService;
    }

    [HttpGet]
    public IActionResult Get()
        => Ok(_comboService.ObtenerTodos());

    [HttpGet("{id}")]
    public IActionResult GetById(int id)
    {
        try
        {
            return Ok(_comboService.ObtenerPorId(id));
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
    }

    [HttpGet("codigo/{codigo}")]
    public IActionResult GetByCodigo(string codigo)
    {
        try
        {
            return Ok(_comboService.ObtenerPorCodigo(codigo));
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new { error = $"Combo con código '{codigo}' no encontrado" });
        }
    }

    [HttpPost]
    public IActionResult Post([FromBody] ComboUpsertDto dto)
    {
        try
        {
            return Ok(_comboService.Crear(dto));
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
    public IActionResult Put(int id, [FromBody] ComboUpsertDto dto)
    {
        try
        {
            return Ok(_comboService.Modificar(id, dto));
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
            _comboService.Eliminar(id);
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
            _comboService.Reactivar(id);
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
            _comboService.EliminarDefinitivo(id);
            return NoContent();
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
}
