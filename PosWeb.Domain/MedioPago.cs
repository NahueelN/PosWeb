using PosWeb.Domain.Exceptions;
using System.ComponentModel.DataAnnotations;

namespace PosWeb.Domain;

public class MedioPago
{
    [Key]
    public int ID_MEDIO_PAGO { get; private set; }

    public string COD_MEDIO_PAGO { get; private set; } = null!;

    public string DESC_MEDIO_PAGO { get; private set; } = null!;

    public bool PAGA_VUELTO { get; private set; }

    public bool ACTIVO { get; private set; }

    public MedioPago(int id, string codMedioPago, string descMedioPago, bool pagaVuelto)
        : this(codMedioPago, descMedioPago, pagaVuelto)
    {
        ID_MEDIO_PAGO = id;
    }

    public MedioPago(string codMedioPago, string descMedioPago, bool pagaVuelto)
    {
        CambiarCodigo(codMedioPago);
        CambiarDescripcion(descMedioPago);
        PAGA_VUELTO = pagaVuelto;
        ACTIVO = true;
    }

    protected MedioPago()
    {
    }

    public void CambiarCodigo(string codigo)
    {
        if (string.IsNullOrWhiteSpace(codigo) || codigo.Trim().Length > 20)
        {
            throw new CodigoInvalidoException("MedioPago", codigo);
        }

        COD_MEDIO_PAGO = codigo.Trim();
    }

    public void CambiarDescripcion(string descripcion)
    {
        if (string.IsNullOrWhiteSpace(descripcion))
        {
            throw new ArgumentException("La descripción del medio de pago es requerida");
        }

        DESC_MEDIO_PAGO = descripcion;
    }

    public void Desactivar()
    {
        ACTIVO = false;
    }

    public void Activar()
    {
        ACTIVO = true;
    }
}
