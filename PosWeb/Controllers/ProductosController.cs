using Microsoft.AspNetCore.Mvc;
using PosWeb.Application.Exceptions;
using PosWeb.Application.OpenFoodFacts;
using PosWeb.Application.Productos;
using PosWeb.Contracts;

namespace PosWeb.Controllers;

[ApiController]
[Route("api/productos")]
public class ProductosController : ControllerBase
{
    private readonly ProductoService _productoService;
    private readonly OpenFoodFactsService _openFoodFactsService;

    public ProductosController(ProductoService productoService, OpenFoodFactsService openFoodFactsService)
    {
        _productoService = productoService;
        _openFoodFactsService = openFoodFactsService;
    }

    [HttpGet]
    public IActionResult Get([FromQuery] int? sucursalId = null, [FromQuery] bool? esPesable = null)
    {
        return Ok(_productoService.ObtenerActivos(sucursalId, esPesable));
    }

    [HttpGet("{id}/detalle")]
    public IActionResult Detalle(int id, [FromQuery] int? sucursalId = null)
    {
        var detalle = _productoService.ObtenerDetalle(id, sucursalId);
        if (detalle == null) return NotFound();
        return Ok(detalle);
    }

    [HttpGet("barra/{codigoBarra}")]
    public IActionResult GetPorCodigoBarra(string codigoBarra, [FromQuery] int? sucursalId = null)
    {
        if (sucursalId.HasValue)
            return Ok(_productoService.ObtenerPorCodigoBarra(codigoBarra, sucursalId.Value));
        return Ok(_productoService.ObtenerPorCodigoBarra(codigoBarra));
    }

    [HttpGet("buscar")]
    public IActionResult Buscar([FromQuery] string q, [FromQuery] int? sucursalId = null)
    {
        if (string.IsNullOrWhiteSpace(q))
        {
            return Ok(new List<ProductoDto>());
        }

        if (sucursalId.HasValue)
        {
            return Ok(_productoService.BuscarParaVenta(q.Trim(), sucursalId.Value));
        }

        return Ok(_productoService.BuscarPorNombre(q.Trim()));
    }

    [HttpGet("buscar-venta")]
    public IActionResult BuscarParaVenta([FromQuery] string q, [FromQuery] int sucursalId)
    {
        if (string.IsNullOrWhiteSpace(q))
        {
            return Ok(new List<ProductoDto>());
        }

        if (sucursalId <= 0)
        {
            return BadRequest("sucursalId es requerido");
        }

        return Ok(_productoService.BuscarParaVenta(q.Trim(), sucursalId));
    }

    /// <summary>
    /// Busca un producto por código de barras: primero en la DB local, luego en Open Food Facts.
    /// </summary>
    [HttpGet("openfoodfacts/{codigo}")]
    public async Task<IActionResult> LookupOpenFoodFacts(string codigo)
    {
        // 1. Buscar en DB local
        try
        {
            var local = _productoService.ObtenerPorCodigoBarra(codigo);
            return Ok(new ProductoLookupResponseDto
            {
                Local = true,
                Producto = local,
                Encontrado = true
            });
        }
        catch (ProductoNoEncontradoException)
        {
            // No existe localmente, continuar
        }

        // 2. Consultar Open Food Facts
        var datos = await _openFoodFactsService.ConsultarAsync(codigo);

        if (datos != null)
        {
            return Ok(new ProductoLookupResponseDto
            {
                Local = false,
                Encontrado = true,
                Datos = datos
            });
        }

        // 3. No encontrado en ningún lado
        return Ok(new ProductoLookupResponseDto
        {
            Local = false,
            Encontrado = false
        });
    }

    [HttpGet("proximo-codigo")]
    public IActionResult GetProximoCodigo()
    {
        var codigo = _productoService.ObtenerSiguienteCodigo();
        return Ok(new { codigo });
    }

    [HttpPost]
    public IActionResult Post([FromBody] ProductoUpsertDto dto)
    {
        return Ok(_productoService.Crear(dto));
    }

    [HttpDelete("{id}")]
    public IActionResult Delete(int id)
    {
        _productoService.Eliminar(id);
        return NoContent();
    }

    [HttpPut("{id}")]
    public IActionResult Put(int id, [FromBody] ProductoUpsertDto dto)
    {
        return Ok(_productoService.Modificar(id, dto));
    }

    [HttpGet("marcas-similares")]
    public IActionResult GetMarcasSimilares()
    {
        return Ok(_productoService.ObtenerMarcasSimilares());
    }

    [HttpGet("marcas")]
    public IActionResult GetMarcas()
    {
        return Ok(_productoService.ObtenerMarcas());
    }

    [HttpPut("seguir-stock")]
    public IActionResult SeguirStockGlobal([FromBody] SeguirStockRequest request)
    {
        var afectados = _productoService.SeguirStockGlobal(request.SeguirStock);
        return Ok(new { afectados });
    }

    [HttpPut("{id}/seguir-stock")]
    public IActionResult SeguirStockIndividual(int id, [FromBody] SeguirStockRequest request)
    {
        return Ok(_productoService.SeguirStockIndividual(id, request.SeguirStock));
    }

    [HttpPut("ajuste-marca")]
    public IActionResult AjustarPorMarca([FromBody] AjusteMarcaRequest request)
    {
        try
        {
            var afectados = _productoService.AjustarPreciosPorMarca(request.Marca, request.Porcentaje);
            return Ok(new { afectados });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }
}

public class SeguirStockRequest
{
    public bool SeguirStock { get; set; }
}

public class AjusteMarcaRequest
{
    public string Marca { get; set; } = string.Empty;
    public decimal Porcentaje { get; set; }
}
