using System.ComponentModel.DataAnnotations;

namespace PosWeb.Domain;

/// <summary>
/// Token de un solo uso para verificación por email: recuperación de contraseña
/// (PROPOSITO = "reset") o confirmación de cuenta (PROPOSITO = "confirmacion").
/// Vive solo en la base local (como el resto de la identidad de PosWeb): el mailer
/// solo envía el código al mailbox; la validación es local.
/// </summary>
public class PasswordResetToken
{
    public const string PropositoReset = "reset";
    public const string PropositoConfirmacion = "confirmacion";

    [Key]
    public int ID_TOKEN { get; private set; }

    public int ID_USUARIO { get; private set; }

    /// <summary>Para qué se generó: "reset" (contraseña) o "confirmacion" (email).</summary>
    public string PROPOSITO { get; private set; } = PropositoReset;

    /// <summary>Hash del código (BCrypt, como PASSWORD_HASH). Nunca el código en claro.</summary>
    public string TOKEN_HASH { get; private set; } = null!;

    public DateTime EXPIRA_UTC { get; private set; }

    public bool USADO { get; private set; }

    public int INTENTOS { get; private set; }

    public DateTime CREATED_UTC { get; private set; }

    public const int MaxIntentos = 5;

    protected PasswordResetToken() { }

    public PasswordResetToken(int idUsuario, string tokenHash, DateTime expiraUtc, string proposito = PropositoReset)
    {
        ID_USUARIO = idUsuario;
        PROPOSITO = proposito;
        TOKEN_HASH = tokenHash;
        EXPIRA_UTC = expiraUtc;
        USADO = false;
        INTENTOS = 0;
        CREATED_UTC = DateTime.UtcNow;
    }

    public bool EsValido()
    {
        return !USADO && EXPIRA_UTC > DateTime.UtcNow && INTENTOS < MaxIntentos;
    }

    public void RegistrarIntento()
    {
        INTENTOS++;
    }

    public void MarcarUsado()
    {
        USADO = true;
    }
}