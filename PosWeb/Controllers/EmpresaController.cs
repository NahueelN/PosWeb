using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PosWeb.Data;
using PosWeb.Domain;
using System.Security.Claims;

namespace PosWeb.Controllers;

[ApiController]
[Route("api/empresa")]
[Authorize(Roles = $"{Roles.SuperAdmin},{Roles.Admin}")]
public class EmpresaController : ControllerBase
{
    private readonly PosDbContextLocal _ctx;

    public EmpresaController(PosDbContextLocal ctx) => _ctx = ctx;

    [HttpGet]
    public IActionResult Obtener()
    {
        var empresaId = ObtenerEmpresaId();
        if (empresaId == null) return NotFound();

        var empresa = _ctx.Empresa.Find(empresaId.Value);
        if (empresa == null) return NotFound();

        return Ok(new { id = empresa.ID_EMPRESA, nombre = empresa.NOMBRE, documento = empresa.DOCUMENTO, direccion = empresa.DIRECCION, telefono = empresa.TELEFONO, mostrarTelefonoTicket = empresa.MOSTRAR_TELEFONO_TICKET });
    }

    [HttpPut]
    public IActionResult Actualizar([FromBody] ActualizarEmpresaRequest req)
    {
        var empresaId = ObtenerEmpresaId();
        if (empresaId == null) return NotFound();

        var empresa = _ctx.Empresa.Find(empresaId.Value);
        if (empresa == null) return NotFound();

        if (req.Nombre != null) empresa.CambiarNombre(req.Nombre);
        if (req.Documento != null) empresa.CambiarDocumento(req.Documento);
        if (req.Direccion != null) empresa.CambiarDireccion(req.Direccion);
        if (req.Telefono != null) empresa.CambiarTelefono(req.Telefono);
        if (req.MostrarTelefonoTicket.HasValue) empresa.CambiarMostrarTelefonoTicket(req.MostrarTelefonoTicket.Value);
        _ctx.SaveChanges();

        return Ok(new { id = empresa.ID_EMPRESA, nombre = empresa.NOMBRE, documento = empresa.DOCUMENTO, direccion = empresa.DIRECCION, telefono = empresa.TELEFONO, mostrarTelefonoTicket = empresa.MOSTRAR_TELEFONO_TICKET });
    }

    private int? ObtenerEmpresaId()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (int.TryParse(userId, out var id))
        {
            var user = _ctx.Usuario.Find(id);
            if (user?.ID_EMPRESA.HasValue == true)
                return user.ID_EMPRESA;
        }
        // Fallback: primera empresa del sistema (usuarios legacy sin asignar)
        return _ctx.Empresa.FirstOrDefault()?.ID_EMPRESA;
    }

    public class ActualizarEmpresaRequest
    {
        public string? Nombre { get; set; }
        public string? Documento { get; set; }
        public string? Direccion { get; set; }
        public string? Telefono { get; set; }
        public bool? MostrarTelefonoTicket { get; set; }
    }
}
