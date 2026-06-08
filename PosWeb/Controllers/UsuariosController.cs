using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PosWeb.Contracts;
using PosWeb.Data;
using PosWeb.Domain;

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
        var responsables = _context.Usuario
            .ToDictionary(u => u.ID_USUARIO, u => u.NOMBRE_USUARIO);

        var usuarios = _context.Usuario
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
}
