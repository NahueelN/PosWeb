using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PosWeb.Application.MediosPago;

namespace PosWeb.Controllers;

[ApiController]
[Route("api/medios-pago")]
[Authorize]
public class MediosPagoController : ControllerBase
{
    private readonly MedioPagoService _medioPagoService;

    public MediosPagoController(MedioPagoService medioPagoService)
    {
        _medioPagoService = medioPagoService;
    }

    [HttpGet]
    public IActionResult Listar()
    {
        var result = _medioPagoService.ListarActivos();
        return Ok(result);
    }
}
