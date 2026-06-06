using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PosWeb.Contracts;
using PosWeb.Data;

namespace PosWeb.Controllers;

[ApiController]
[Route("api/unidades-medida")]
[Authorize]
public class UnidadesMedidaController : ControllerBase
{
    private readonly PosDbContext _context;

    public UnidadesMedidaController(PosDbContext context)
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
                Descripcion = u.DESC_UNIDAD_MEDIDA
            })
            .ToListAsync();
    }
}
