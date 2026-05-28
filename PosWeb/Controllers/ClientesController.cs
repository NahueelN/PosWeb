using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PosWeb.Application.Clientes;
using PosWeb.Contracts;
using PosWeb.Domain;

namespace PosWeb.Controllers;

[ApiController]
[Route("api/clientes")]
[Authorize(Roles = $"{Roles.SuperAdmin},{Roles.Admin}")]
public class ClientesController : ControllerBase
{
    private readonly ClienteService _clienteService;

    public ClientesController(ClienteService clienteService)
    {
        _clienteService = clienteService;
    }

    [HttpGet]
    public IActionResult Listar([FromQuery] string? q, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var result = _clienteService.Listar(q, page, pageSize);
        return Ok(result);
    }

    [HttpGet("{id}")]
    public IActionResult Obtener(int id)
    {
        var result = _clienteService.Obtener(id);
        if (result == null)
        {
            return NotFound(new { error = "Cliente no encontrado" });
        }
        return Ok(result);
    }

    [HttpPost]
    public IActionResult Crear([FromBody] ClienteDto dto)
    {
        var result = _clienteService.Crear(dto);
        return Ok(result);
    }

    [HttpPut("{id}")]
    public IActionResult Actualizar(int id, [FromBody] ClienteDto dto)
    {
        var result = _clienteService.Actualizar(id, dto);
        return Ok(result);
    }
}
