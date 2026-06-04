using System.ComponentModel.DataAnnotations;

namespace PosWeb.Domain;

public class Empresa
{
    [Key]
    public int ID_EMPRESA { get; private set; }

    public string NOMBRE { get; private set; } = null!;

    public string DOCUMENTO { get; private set; } = null!;

    public int ID_SUSCRIPCION { get; private set; }

    protected Empresa() { }

    public Empresa(string nombre, string documento, int idSuscripcion)
    {
        if (string.IsNullOrWhiteSpace(nombre))
            throw new ArgumentException("El nombre de la empresa es requerido", nameof(nombre));
        if (string.IsNullOrWhiteSpace(documento))
            throw new ArgumentException("El documento de la empresa es requerido", nameof(documento));
        if (idSuscripcion <= 0)
            throw new ArgumentException("Suscripción inválida", nameof(idSuscripcion));

        NOMBRE = nombre.Trim();
        DOCUMENTO = documento.Trim();
        ID_SUSCRIPCION = idSuscripcion;
    }

    public void CambiarNombre(string nombre)
    {
        if (string.IsNullOrWhiteSpace(nombre))
            throw new ArgumentException("El nombre de la empresa es requerido");
        NOMBRE = nombre.Trim();
    }

    public void CambiarDocumento(string documento)
    {
        if (string.IsNullOrWhiteSpace(documento))
            throw new ArgumentException("El documento de la empresa es requerido");
        DOCUMENTO = documento.Trim();
    }

    public void CambiarSuscripcion(int idSuscripcion)
    {
        if (idSuscripcion <= 0)
            throw new ArgumentException("Suscripción inválida");
        ID_SUSCRIPCION = idSuscripcion;
    }
}
