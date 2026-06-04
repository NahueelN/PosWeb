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

        var suscripcionesPorTitular = _context.Suscripciones
            .ToDictionary(s => s.ID_USUARIO_TITULAR, s => s);

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
                SuscripcionActiva = TieneSuscripcionActiva(u, usuariosPorId, suscripcionesPorTitular),
                AccesoHabilitado = TieneAccesoHabilitado(u, usuariosPorId, suscripcionesPorTitular),
                SuscripcionNivel = ObtenerSuscripcion(u, usuariosPorId, suscripcionesPorTitular)?.NIVEL,
                SuscripcionEstado = ObtenerSuscripcion(u, usuariosPorId, suscripcionesPorTitular)?.ESTADO,
                CostoMensual = ObtenerSuscripcion(u, usuariosPorId, suscripcionesPorTitular)?.COSTO_MENSUAL,
                MaxSucursales = ObtenerSuscripcion(u, usuariosPorId, suscripcionesPorTitular)?.MAX_SUCURSALES,
                MaxAdmins = ObtenerSuscripcion(u, usuariosPorId, suscripcionesPorTitular)?.MAX_ADMINS,
                MaxUsuarios = ObtenerSuscripcion(u, usuariosPorId, suscripcionesPorTitular)?.MAX_USUARIOS,
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

        var suscripcion = _context.Suscripciones.FirstOrDefault(s => s.ID_USUARIO_TITULAR == usuario.ID_USUARIO);
        if (suscripcion == null)
        {
            suscripcion = Suscripcion.CrearBasica(usuario.ID_USUARIO);
            _context.Suscripciones.Add(suscripcion);
        }

        if (request.Activa)
        {
            suscripcion.Activar();
            usuario.ActivarSuscripcion();
        }
        else
        {
            suscripcion.Suspender();
            usuario.SuspenderSuscripcion();
        }

        _context.SaveChanges();

        return Ok(new
        {
            id = usuario.ID_USUARIO,
            suscripcionActiva = suscripcion.EstaActiva(),
            nivel = suscripcion.NIVEL
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

    private static bool TieneAccesoHabilitado(
        Usuario usuario,
        Dictionary<int, Usuario> usuariosPorId,
        Dictionary<int, Suscripcion> suscripcionesPorTitular)
    {
        if (!usuario.ACTIVO)
        {
            return false;
        }

        return TieneSuscripcionActiva(usuario, usuariosPorId, suscripcionesPorTitular);
    }

    private static bool TieneSuscripcionActiva(
        Usuario usuario,
        Dictionary<int, Usuario> usuariosPorId,
        Dictionary<int, Suscripcion> suscripcionesPorTitular)
    {
        var titular = ObtenerTitular(usuario, usuariosPorId);

        if (titular == null)
        {
            return usuario.SUSCRIPCION_ACTIVA;
        }

        if (suscripcionesPorTitular.TryGetValue(titular.ID_USUARIO, out var suscripcion))
        {
            return suscripcion.EstaActiva();
        }

        return titular.SUSCRIPCION_ACTIVA;
    }

    private static Suscripcion? ObtenerSuscripcion(
        Usuario usuario,
        Dictionary<int, Usuario> usuariosPorId,
        Dictionary<int, Suscripcion> suscripcionesPorTitular)
    {
        var titular = ObtenerTitular(usuario, usuariosPorId);
        if (titular == null)
        {
            return null;
        }

        suscripcionesPorTitular.TryGetValue(titular.ID_USUARIO, out var suscripcion);
        return suscripcion;
    }

    private static Usuario? ObtenerTitular(
        Usuario usuario,
        Dictionary<int, Usuario> usuariosPorId)
    {
        return usuario.ID_USUARIO_RESPONSABLE.HasValue
            ? usuariosPorId.GetValueOrDefault(usuario.ID_USUARIO_RESPONSABLE.Value)
            : usuario;
    }
}

public record CambiarSuscripcionRequest(bool Activa);
