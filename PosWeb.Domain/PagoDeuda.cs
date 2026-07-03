using System.ComponentModel.DataAnnotations;

namespace PosWeb.Domain;

public class PagoDeuda
{
    [Key]
    public int ID_PAGO_DEUDA { get; private set; }

    public int ID_DEUDA { get; private set; }

    public decimal MONTO { get; private set; }

    public DateTime FECHA { get; private set; }

    public int? ID_USUARIO { get; private set; }

    public Deuda Deuda { get; private set; } = null!;

    protected PagoDeuda() { }

    public PagoDeuda(int idDeuda, decimal monto, int? idUsuario = null)
    {
        ID_DEUDA = idDeuda;
        MONTO = monto;
        FECHA = DateTime.UtcNow;
        ID_USUARIO = idUsuario;
    }
}
