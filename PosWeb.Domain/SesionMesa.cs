using System.ComponentModel.DataAnnotations;

namespace PosWeb.Domain;

public static class EstadosSesionMesa
{
    public const string Abierta = "Abierta";
    public const string Cobrada = "Cobrada";
    public const string Cancelada = "Cancelada";
}

/// <summary>
/// Sesión de una mesa: la cuenta abierta que acumula items (comanda) hasta cobrarse.
/// Al cobrar genera una única venta (la de mostrador, sin descuento de stock en mesas).
/// </summary>
public class SesionMesa
{
    [Key]
    public int ID_SESION_MESA { get; private set; }

    public int ID_MESA { get; private set; }

    public int ID_SUCURSAL { get; private set; }

    public int ID_USUARIO { get; private set; }

    public DateTime FECHA_APERTURA { get; private set; }

    public DateTime? FECHA_CIERRE { get; private set; }

    public string ESTADO { get; private set; } = EstadosSesionMesa.Abierta;

    public int? ID_VENTA { get; private set; }

    public bool EstadoAbierta => ESTADO == EstadosSesionMesa.Abierta;

    private readonly List<ItemComanda> _ITEMS = new();

    public IReadOnlyCollection<ItemComanda> ITEMS => _ITEMS;

    public SesionMesa(int idMesa, int sucursalId, int usuarioId)
    {
        ID_MESA = idMesa;
        ID_SUCURSAL = sucursalId;
        ID_USUARIO = usuarioId;
        FECHA_APERTURA = DateTime.Now;
        ESTADO = EstadosSesionMesa.Abierta;
    }

    protected SesionMesa()
    {
    }

    public void AgregarItem(ItemComanda item)
    {
        _ITEMS.Add(item);
    }

    public void MarcarCobrada(int ventaId)
    {
        if (ESTADO != EstadosSesionMesa.Abierta)
            throw new InvalidOperationException("La sesión no está abierta");

        ESTADO = EstadosSesionMesa.Cobrada;
        FECHA_CIERRE = DateTime.Now;
        ID_VENTA = ventaId;
    }

    public void Cancelar()
    {
        if (ESTADO != EstadosSesionMesa.Abierta)
            throw new InvalidOperationException("La sesión no está abierta");

        ESTADO = EstadosSesionMesa.Cancelada;
        FECHA_CIERRE = DateTime.Now;
    }

    /// <summary>Total de la cuenta según los items cobrables (pendiente/en cocina/servido).</summary>
    public decimal Total => _ITEMS.Where(i => i.Contable).Sum(i => i.SUBTOTAL);
}