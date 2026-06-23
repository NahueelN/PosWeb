using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PosWeb.Application.CategoriasGasto;
using PosWeb.Contracts;

namespace PosWeb.Controllers;

[ApiController]
[Route("api/categorias-gasto")]
[Authorize]
public class CategoriasGastoController : ControllerBase
{
    private readonly CategoriaGastoService _service;

    public CategoriasGastoController(CategoriaGastoService service)
    {
        _service = service;
    }

    [HttpGet]
    public IActionResult Listar()
    {
        return Ok(new { items = _service.Listar() });
    }

    [HttpPost]
    public IActionResult Crear([FromBody] CrearCategoriaGastoRequest request)
    {
        try
        {
            var result = _service.Crear(request.Descripcion);
            return Created($"/api/categorias-gasto/{result.Id}", result);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message });
        }
    }
}
