using System.ComponentModel.DataAnnotations;

namespace PosWeb.Domain;

public class MedioPago
{
    [Key]
    public int ID_MEDIO_PAGO { get; private set; }

    public string NOMBRE { get; private set; } = null!;

    public bool PAGA_VUELTO { get; private set; }

    public bool ACTIVO { get; private set; }

    public MedioPago(int id, string nombre, bool pagaVuelto)
        : this(nombre, pagaVuelto)
    {
        ID_MEDIO_PAGO = id;
    }

    public MedioPago(string nombre, bool pagaVuelto)
    {
        if (string.IsNullOrWhiteSpace(nombre))
        {
            throw new ArgumentException("El nombre del medio de pago es requerido");
        }

        NOMBRE = nombre;
        PAGA_VUELTO = pagaVuelto;
        ACTIVO = true;
    }

    protected MedioPago()
    {
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
