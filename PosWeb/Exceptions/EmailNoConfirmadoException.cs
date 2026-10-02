namespace PosWeb.Application.Exceptions;

/// <summary>
/// El usuario existe y la contraseña es correcta, pero el email aún no fue confirmado.
/// El frontend debe redirigir al flujo de confirmación (código de 6 dígitos).
/// </summary>
public class EmailNoConfirmadoException : AuthException
{
    public EmailNoConfirmadoException()
        : base("Confirmá tu email para poder iniciar sesión. Te enviamos un código.")
    {
    }
}