using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PosWeb.Contracts;
using PosWeb.Data;
using PosWeb.Domain;
using System.Security.Claims;

namespace PosWeb.Controllers;

[ApiController]
[Route("api/usuarios")]
[Authorize(Roles = $"{Roles.SuperAdmin},{Roles.Admin}")]
public class UsuariosController : ControllerBase
{
    private readonly PosDbContext _context;

    public UsuariosController(PosDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public IActionResult Listar()
    {
        var responsables = _context.Usuarios
            .ToDictionary(u => u.ID_USUARIO, u => u.NOMBRE_USUARIO);

        var usuarios = _context.Usuarios
            .OrderBy(u => u.NOMBRE_USUARIO)
            .AsEnumerable()
            .Select(u => new UsuarioDto
            {
                Id = u.ID_USUARIO,
                NombreUsuario = u.NOMBRE_USUARIO,
                Mail = u.MAIL,
                Rol = u.ROL,
                UsuarioResponsableId = u.ID_USUARIO_RESP,
                UsuarioResponsableNombre = u.ID_USUARIO_RESP.HasValue && responsables.TryGetValue(u.ID_USUARIO_RESP.Value, out var nombreResponsable)
                    ? nombreResponsable
                    : null,
                Activo = u.ACTIVO,
                PinConfigurado = u.PIN_HASH != null && u.PIN_HASH != string.Empty
            })
            .ToList();

        return Ok(usuarios);
    }

    [HttpDelete("{id:int}")]
    public IActionResult Desactivar(int id)
    {
        var usuario = _context.Usuarios.FirstOrDefault(u => u.ID_USUARIO == id);
        if (usuario == null)
        {
            return NotFound($"El usuario con ID {id} no existe");
        }

        if (usuario.ROL != Roles.UsuarioComun)
        {
            return BadRequest("Solo se pueden dar de baja usuarios comunes");
        }

        var userIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (int.TryParse(userIdValue, out var currentUserId) && currentUserId == usuario.ID_USUARIO)
        {
            return BadRequest("No podés darte de baja a vos mismo");
        }

        if (!usuario.ACTIVO)
        {
            return NoContent();
        }

        usuario.Desactivar();
        _context.SaveChanges();

        return NoContent();
    }
}
