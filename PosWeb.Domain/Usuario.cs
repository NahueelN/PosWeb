using PosWeb.Domain.Exceptions;
using System.ComponentModel.DataAnnotations;

namespace PosWeb.Domain;

public class Usuario
{
    [Key]
    public int ID_USUARIO { get; private set; }

    public string NOMBRE_USUARIO { get; private set; } = null!;

    public string PASSWORD_HASH { get; private set; } = null!;

    public string? PIN_HASH { get; private set; }

    public string ROL { get; private set; } = null!;

    public bool ACTIVO { get; private set; }

    public int? ID_SUCURSAL_DEFAULT { get; private set; }

    public Usuario(int id, string nombreUsuario, string passwordHash, string rol, int? sucursalDefault = null)
        : this(nombreUsuario, passwordHash, rol, sucursalDefault)
    {
        ID_USUARIO = id;
    }

    public Usuario(string nombreUsuario, string passwordHash, string rol, int? sucursalDefault = null)
    {
        CambiarNombreUsuario(nombreUsuario);
        SetPasswordHash(passwordHash);
        CambiarRol(rol);
        ACTIVO = true;
        ID_SUCURSAL_DEFAULT = sucursalDefault;
    }

    protected Usuario()
    {
    }

    public void CambiarNombreUsuario(string nombreUsuario)
    {
        if (string.IsNullOrWhiteSpace(nombreUsuario) || nombreUsuario.Length < 3 || nombreUsuario.Length > 50)
        {
            throw new ArgumentException("El nombre de usuario debe tener entre 3 y 50 caracteres");
        }

        NOMBRE_USUARIO = nombreUsuario;
    }

    public void SetPasswordHash(string passwordHash)
    {
        if (string.IsNullOrWhiteSpace(passwordHash))
        {
            throw new ArgumentException("El hash de password no puede estar vacío");
        }

        PASSWORD_HASH = passwordHash;
    }

    public void SetPin(string pin)
    {
        if (string.IsNullOrWhiteSpace(pin) || pin.Length != 4 || !pin.All(char.IsDigit))
        {
            throw new ArgumentException("El PIN debe ser exactamente 4 dígitos numéricos");
        }

        PIN_HASH = BCrypt.Net.BCrypt.HashPassword(pin);
    }

    public void ClearPin()
    {
        PIN_HASH = null;
    }

    public bool TienePin()
    {
        return !string.IsNullOrWhiteSpace(PIN_HASH);
    }

    public void CambiarRol(string rol)
    {
        var rolesValidos = new[] { "Admin", "Supervisor", "Vendedor" };
        if (!rolesValidos.Contains(rol))
        {
            throw new ArgumentException($"Rol inválido. Debe ser uno de: {string.Join(", ", rolesValidos)}");
        }

        ROL = rol;
    }

    public void Activar()
    {
        ACTIVO = true;
    }

    public void Desactivar()
    {
        ACTIVO = false;
    }
}
