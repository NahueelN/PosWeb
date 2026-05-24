using PosWeb.Domain.Exceptions;
using System.ComponentModel.DataAnnotations;

namespace PosWeb.Domain;

public class Cliente
{
    [Key]
    public int ID_CLIENTE { get; private set; }

    public string NOMBRE { get; private set; } = null!;

    public string TIPO_DOCUMENTO { get; private set; } = null!;

    public string NUMERO_DOCUMENTO { get; private set; } = null!;

    public string IVA_CONDICION { get; private set; } = null!;

    public string? TELEFONO { get; private set; }

    public string? DOMICILIO { get; private set; }

    public bool ACTIVO { get; private set; }

    private static readonly string[] TiposDocumentoValidos = { "DNI", "CUIT", "CUIL", "ConsumidorFinal" };
    private static readonly string[] IvaCondicionesValidas = { "ResponsableInscripto", "Monotributo", "Exento", "ConsumidorFinal" };

    public Cliente(string nombre, string tipoDocumento, string numeroDocumento, string ivaCondicion,
                   string? telefono = null, string? domicilio = null)
    {
        CambiarNombre(nombre);
        CambiarTipoDocumento(tipoDocumento, numeroDocumento);
        CambiarIvaCondicion(ivaCondicion);
        TELEFONO = telefono;
        DOMICILIO = domicilio;
        ACTIVO = true;
    }

    protected Cliente()
    {
    }

    public void CambiarNombre(string nombre)
    {
        if (string.IsNullOrWhiteSpace(nombre) || nombre.Length > 200)
        {
            throw new ArgumentException("El nombre es requerido y debe tener hasta 200 caracteres");
        }

        NOMBRE = nombre;
    }

    public void CambiarTipoDocumento(string tipoDocumento, string numeroDocumento)
    {
        if (!TiposDocumentoValidos.Contains(tipoDocumento))
        {
            throw new DocumentoInvalidoException(tipoDocumento, "Tipo de documento inválido");
        }

        if (tipoDocumento == "ConsumidorFinal")
        {
            NUMERO_DOCUMENTO = string.IsNullOrWhiteSpace(numeroDocumento) ? "0" : numeroDocumento;
        }
        else
        {
            if (string.IsNullOrWhiteSpace(numeroDocumento))
            {
                throw new DocumentoInvalidoException(tipoDocumento, "Número de documento requerido");
            }

            if (tipoDocumento == "CUIT" && numeroDocumento.Length != 11)
            {
                throw new DocumentoInvalidoException(tipoDocumento, "CUIT debe tener 11 dígitos");
            }

            if (tipoDocumento == "CUIL" && numeroDocumento.Length != 11)
            {
                throw new DocumentoInvalidoException(tipoDocumento, "CUIL debe tener 11 dígitos");
            }

            if (tipoDocumento == "DNI" && (numeroDocumento.Length < 7 || numeroDocumento.Length > 8))
            {
                throw new DocumentoInvalidoException(tipoDocumento, "DNI debe tener entre 7 y 8 dígitos");
            }

            if (!numeroDocumento.All(char.IsDigit))
            {
                throw new DocumentoInvalidoException(tipoDocumento, "El número de documento debe ser numérico");
            }

            NUMERO_DOCUMENTO = numeroDocumento;
        }

        TIPO_DOCUMENTO = tipoDocumento;
    }

    public void CambiarIvaCondicion(string ivaCondicion)
    {
        if (!IvaCondicionesValidas.Contains(ivaCondicion))
        {
            throw new IvaCondicionInvalidaException(ivaCondicion);
        }

        IVA_CONDICION = ivaCondicion;
    }

    public void CambiarTelefono(string? telefono)
    {
        TELEFONO = telefono;
    }

    public void CambiarDomicilio(string? domicilio)
    {
        DOMICILIO = domicilio;
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
