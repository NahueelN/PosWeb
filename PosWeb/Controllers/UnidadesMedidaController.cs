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
    public async Task<List<UnidadMedidaDto>> Listar([FromQuery] bool todas = false)
    {
        var query = _context.UnidadMedida.AsQueryable();
        if (!todas)
        {
            query = query.Where(u => u.ACTIVO);
        }

        return await query
            .OrderBy(u => u.DESC_UNIDAD_MEDIDA)
            .Select(u => new UnidadMedidaDto
            {
                Id = u.ID_UNIDAD_MEDIDA,
                Codigo = u.COD_UNIDAD_MEDIDA,
                Descripcion = u.DESC_UNIDAD_MEDIDA,
                Activo = u.ACTIVO
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

        if (!unidad.ACTIVO)
            return NoContent();

        bool enUso = await _context.Producto
            .AnyAsync(p => p.ID_UNIDAD_MEDIDA == id && p.ACTIVO);
        if (enUso)
        {
            return BadRequest(new { error = "No se puede desactivar la unidad: hay productos activos que la utilizan" });
        }

        unidad.Desactivar();
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("{id}/activar")]
    public async Task<IActionResult> Activar(int id)
    {
        var unidad = await _context.UnidadMedida.FindAsync(id);
        if (unidad == null)
            return NotFound(new { error = "Unidad de medida no encontrada" });

        unidad.Activar();
        await _context.SaveChangesAsync();
        return Ok(MapDto(unidad));
    }

    private static UnidadMedidaDto MapDto(UnidadMedida u) => new()
    {
        Id = u.ID_UNIDAD_MEDIDA,
        Codigo = u.COD_UNIDAD_MEDIDA,
        Descripcion = u.DESC_UNIDAD_MEDIDA,
        Activo = u.ACTIVO
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
