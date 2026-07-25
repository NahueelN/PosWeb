using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PosWeb.Contracts;
using PosWeb.Data;
using PosWeb.Domain;

namespace PosWeb.Controllers;

[ApiController]
[Route("api/unidades-medida")]
[Authorize]
public class UnidadesMedidaController : ControllerBase
{
    private readonly PosDbContextLocal _context;

    public UnidadesMedidaController(PosDbContextLocal context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<List<UnidadMedidaDto>> Listar()
    {
        return await _context.UnidadMedida
            .OrderBy(u => u.DESC_UNIDAD_MEDIDA)
            .Select(u => new UnidadMedidaDto
            {
                Id = u.ID_UNIDAD_MEDIDA,
                Codigo = u.COD_UNIDAD_MEDIDA,
                Descripcion = u.DESC_UNIDAD_MEDIDA
            })
            .ToListAsync();
    }

    [HttpPost]
    public async Task<IActionResult> Crear([FromBody] CrearUnidadMedidaRequest request)
    {
        try
        {
            var unidad = new UnidadMedida(
                request.Codigo ?? Guid.NewGuid().ToString("N")[..8].ToUpper(),
                request.Descripcion
            );
            _context.UnidadMedida.Add(unidad);
            await _context.SaveChangesAsync();
            return Created($"/api/unidades-medida/{unidad.ID_UNIDAD_MEDIDA}", MapDto(unidad));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Actualizar(int id, [FromBody] ActualizarUnidadMedidaRequest request)
    {
        var unidad = await _context.UnidadMedida.FindAsync(id);
        if (unidad == null)
            return NotFound(new { error = "Unidad de medida no encontrada" });

        try
        {
            if (!string.IsNullOrWhiteSpace(request.Codigo))
            {
                unidad.CambiarCodigo(request.Codigo);
            }
            unidad.CambiarDescripcion(request.Descripcion);
            await _context.SaveChangesAsync();
            return Ok(MapDto(unidad));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Eliminar(int id)
    {
        var unidad = await _context.UnidadMedida.FindAsync(id);
        if (unidad == null)
            return NotFound(new { error = "Unidad de medida no encontrada" });

        _context.UnidadMedida.Remove(unidad);
        await _context.SaveChangesAsync();
        return NoContent();
    }

    private static UnidadMedidaDto MapDto(UnidadMedida u) => new()
    {
        Id = u.ID_UNIDAD_MEDIDA,
        Codigo = u.COD_UNIDAD_MEDIDA,
        Descripcion = u.DESC_UNIDAD_MEDIDA
    };
}

public class CrearUnidadMedidaRequest
{
    public string? Codigo { get; set; }
    public string Descripcion { get; set; } = null!;
}

public class ActualizarUnidadMedidaRequest
{
    public string? Codigo { get; set; }
    public string Descripcion { get; set; } = null!;
}
