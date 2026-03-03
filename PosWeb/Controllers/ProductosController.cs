using Microsoft.AspNetCore.Mvc;
using PosWeb.Application.Productos;
using PosWeb.Contracts;

namespace PosWeb.Controllers;

[ApiController]
[Route("api/productos")]
public class ProductosController : ControllerBase
{
    private readonly ProductoService _productoService;

    public ProductosController(ProductoService productoService)
    {
        _productoService = productoService;
    }

    [HttpGet]
    public IActionResult Get()
    {
        return Ok(_productoService.ObtenerActivos());
    }

    [HttpGet("barra/{codigoBarra}")]
    public IActionResult GetPorCodigoBarra(string codigoBarra)
    {
        return Ok(_productoService.ObtenerPorCodigoBarra(codigoBarra));
    }

    [HttpPost]
    public IActionResult Post(ProductoDto dto)
    {
        return Ok(_productoService.Crear(dto));
    }

    [HttpDelete("{id}")]
    public IActionResult Delete(int id)
    {
        _productoService.Eliminar(id);
        return NoContent();
    }

    [HttpPut]
    public IActionResult Put(int id, ProductoDto dto)
    {
        return Ok(_productoService.Modificar(id, dto));
    }
}
