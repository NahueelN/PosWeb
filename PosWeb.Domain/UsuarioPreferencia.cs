using System.ComponentModel.DataAnnotations;

namespace PosWeb.Domain;

public class UsuarioPreferencia
{
    [Key]
    public int ID_USUARIO_PREFERENCIA { get; private set; }

    public int ID_USUARIO { get; private set; }

    public string CLAVE { get; private set; } = null!;

    public string VALOR { get; private set; } = null!;

    protected UsuarioPreferencia() { }

    public UsuarioPreferencia(int idUsuario, string clave, string valor)
    {
        ID_USUARIO = idUsuario;
        CLAVE = clave;
        VALOR = valor;
    }

    public void CambiarValor(string valor)
    {
        VALOR = valor;
    }
}
