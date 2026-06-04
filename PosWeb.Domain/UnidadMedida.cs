using PosWeb.Domain.Exceptions;
using System.ComponentModel.DataAnnotations;

namespace PosWeb.Domain;

public class UnidadMedida
{
    [Key]
    public int ID_UNIDAD_MEDIDA { get; private set; }

    public string COD_UNIDAD_MEDIDA { get; private set; } = null!;

    public string DESC_UNIDAD_MEDIDA { get; private set; } = null!;

    public UnidadMedida(string codUnidadMedida, string descUnidadMedida)
    {
        CambiarCodigo(codUnidadMedida);
        CambiarDescripcion(descUnidadMedida);
    }

    protected UnidadMedida()
    {
    }

    public void CambiarCodigo(string codigo)
    {
        if (string.IsNullOrWhiteSpace(codigo) || codigo.Trim().Length > 20)
        {
            throw new CodigoInvalidoException("UnidadMedida", codigo);
        }

        COD_UNIDAD_MEDIDA = codigo.Trim();
    }

    public void CambiarDescripcion(string descripcion)
    {
        if (string.IsNullOrWhiteSpace(descripcion) || descripcion.Trim().Length > 100)
        {
            throw new ArgumentException("La descripción de la unidad de medida es requerida y debe tener hasta 100 caracteres");
        }

        DESC_UNIDAD_MEDIDA = descripcion.Trim();
    }
}
