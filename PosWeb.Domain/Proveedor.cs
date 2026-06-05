using PosWeb.Domain.Exceptions;
using System.ComponentModel.DataAnnotations;

namespace PosWeb.Domain;

public class Proveedor
{
    [Key]
    public int ID_PROVEEDOR { get; private set; }

    public string COD_PROVEEDOR { get; private set; } = null!;

    public string NOMBRE { get; private set; } = null!;

    public string? TIPO_DOCUMENTO { get; private set; }

    public string? NRO_DOCUMENTO { get; private set; }

    public string? TELEFONO { get; private set; }

    public string? DOMICILIO { get; private set; }

    public string? MAIL { get; private set; }

    public bool ACTIVO { get; private set; }

    public Proveedor(
        string codProveedor,
        string nombre,
        string? tipoDocumento = null,
        string? nroDocumento = null,
        string? telefono = null,
        string? domicilio = null,
        string? mail = null)
    {
        CambiarCodigo(codProveedor);
        CambiarNombre(nombre);
        TIPO_DOCUMENTO = tipoDocumento;
        NRO_DOCUMENTO = nroDocumento;
        TELEFONO = telefono;
        DOMICILIO = domicilio;
        SetMail(mail);
        ACTIVO = true;
    }

    protected Proveedor()
    {
    }

    public void CambiarCodigo(string codigo)
    {
        if (string.IsNullOrWhiteSpace(codigo) || codigo.Trim().Length > 50)
        {
            throw new CodigoInvalidoException("Proveedor", codigo);
        }

        COD_PROVEEDOR = codigo.Trim();
    }

    public void CambiarNombre(string nombre)
    {
        if (string.IsNullOrWhiteSpace(nombre) || nombre.Trim().Length > 200)
        {
            throw new ArgumentException("El nombre es requerido y debe tener hasta 200 caracteres");
        }

        NOMBRE = nombre.Trim();
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

    public void Activar()
    {
        ACTIVO = true;
    }

    public void Desactivar()
    {
        ACTIVO = false;
    }
}
