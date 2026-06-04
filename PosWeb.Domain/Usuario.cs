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

    public string? MAIL { get; private set; }

    public string ROL { get; private set; } = null!;

    public bool ACTIVO { get; private set; }

    public bool SUSCRIPCION_ACTIVA { get; private set; }

    public int? ID_SUCURSAL_DEFAULT { get; private set; }

    public int? ID_USUARIO_RESP { get; private set; }

    public string? EMPRESA_REPRESENTA { get; private set; }

    public int? ID_USUARIO_RESPONSABLE { get; private set; }

    public Usuario(
        int id,
        string nombreUsuario,
        string passwordHash,
        string rol,
        string? mail = null,
        int? sucursalDefault = null,
        int? usuarioResponsableId = null,
        string? empresaRepresenta = null,
        bool suscripcionActiva = true)
        : this(nombreUsuario, passwordHash, rol, mail, sucursalDefault, usuarioResponsableId, empresaRepresenta, suscripcionActiva)
    {
        ID_USUARIO = id;
    }

    public Usuario(
        string nombreUsuario,
        string passwordHash,
        string rol,
        string? mail = null,
        int? sucursalDefault = null,
        int? usuarioResponsableId = null,
        string? empresaRepresenta = null,
        bool suscripcionActiva = true)
    {
        CambiarNombreUsuario(nombreUsuario);
        SetPasswordHash(passwordHash);
        CambiarRol(rol);
        SetMail(mail);
        ACTIVO = true;
        SUSCRIPCION_ACTIVA = suscripcionActiva;
        ID_SUCURSAL_DEFAULT = sucursalDefault;
        ID_USUARIO_RESP = usuarioResponsableId;
        ID_USUARIO_RESPONSABLE = usuarioResponsableId;
        EMPRESA_REPRESENTA = empresaRepresenta;
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

    public void SetMail(string? mail)
    {
        if (string.IsNullOrWhiteSpace(mail))
        {
            MAIL = null;
            return;
        }

        try
        {
            _ = new System.Net.Mail.MailAddress(mail);
        }
        catch
        {
            throw new ArgumentException("Mail inválido");
        }

        MAIL = mail.Trim();
    }

    public void CambiarRol(string rol)
    {
        var rolesValidos = Roles.Todos;
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

    public void ActivarSuscripcion()
    {
        SUSCRIPCION_ACTIVA = true;
    }

    public void SuspenderSuscripcion()
    {
        SUSCRIPCION_ACTIVA = false;
    }
}
