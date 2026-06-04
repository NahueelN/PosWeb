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
        var usuariosPorId = _context.Usuarios
            .ToDictionary(u => u.ID_USUARIO);

        var responsables = usuariosPorId
            .ToDictionary(u => u.Key, u => u.Value.NOMBRE_USUARIO);

        var usuarios = _context.Usuarios
            .OrderBy(u => u.NOMBRE_USUARIO)
            .AsEnumerable()
            .Select(u => new UsuarioDto
            {
                Id = u.ID_USUARIO,
                NombreUsuario = u.NOMBRE_USUARIO,
                Mail = u.MAIL,
                Rol = u.ROL,
                UsuarioResponsableId = u.ID_USUARIO_RESPONSABLE,
                UsuarioResponsableNombre = u.ID_USUARIO_RESPONSABLE.HasValue && responsables.TryGetValue(u.ID_USUARIO_RESPONSABLE.Value, out var nombreResponsable)
                    ? nombreResponsable
                    : null,
                EmpresaRepresenta = u.EMPRESA_REPRESENTA,
                Activo = u.ACTIVO,
                SuscripcionActiva = u.SUSCRIPCION_ACTIVA,
                AccesoHabilitado = TieneAccesoHabilitado(u, usuariosPorId),
                PinConfigurado = u.PIN_HASH != null && u.PIN_HASH != string.Empty
            })
            .ToList();

        return Ok(usuarios);
    }

    [HttpPut("{id:int}/suscripcion")]
    public IActionResult CambiarSuscripcion(int id, [FromBody] CambiarSuscripcionRequest request)
    {
        var usuario = _context.Usuarios.FirstOrDefault(u => u.ID_USUARIO == id);
        if (usuario == null)
        {
            return NotFound($"El usuario con ID {id} no existe");
        }

        if (usuario.ROL != Roles.Admin)
        {
            return BadRequest("La suscripción solo se gestiona sobre usuarios admin");
        }

        if (request.Activa)
        {
            usuario.ActivarSuscripcion();
        }
        else
        {
            usuario.SuspenderSuscripcion();
        }

        var dependientes = _context.Usuarios
            .Where(u => u.ID_USUARIO_RESPONSABLE == id)
            .ToList();

        foreach (var dependiente in dependientes)
        {
            if (request.Activa)
            {
                dependiente.ActivarSuscripcion();
            }
            else
            {
                dependiente.SuspenderSuscripcion();
            }
        }

        _context.SaveChanges();

        return Ok(new
        {
            id = usuario.ID_USUARIO,
            suscripcionActiva = usuario.SUSCRIPCION_ACTIVA,
            dependientesActualizados = dependientes.Count
        });
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

    private static bool TieneAccesoHabilitado(Usuario usuario, Dictionary<int, Usuario> usuariosPorId)
    {
        if (!usuario.ACTIVO || !usuario.SUSCRIPCION_ACTIVA)
        {
            return false;
        }

        if (!usuario.ID_USUARIO_RESPONSABLE.HasValue)
        {
            return true;
        }

        return usuariosPorId.TryGetValue(usuario.ID_USUARIO_RESPONSABLE.Value, out var responsable)
            && responsable.ACTIVO
            && responsable.SUSCRIPCION_ACTIVA;
    }
}

public record CambiarSuscripcionRequest(bool Activa);
