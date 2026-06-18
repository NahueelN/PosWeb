using System.ComponentModel.DataAnnotations;

namespace PosWeb.Domain;

public class ComboItem
{
    [Key]
    public int ID_COMBO_ITEM { get; private set; }

    public int ID_COMBO { get; private set; }

    public int ID_PRODUCTO { get; private set; }

    public decimal CANTIDAD { get; private set; }

    public ComboItem(int idCombo, int idProducto, decimal cantidad)
    {
        if (idProducto <= 0)
            throw new ArgumentException("ID de producto inválido", nameof(idProducto));
        if (cantidad <= 0)
            throw new ArgumentException("La cantidad debe ser mayor a 0", nameof(cantidad));

        ID_COMBO = idCombo;
        ID_PRODUCTO = idProducto;
        CANTIDAD = cantidad;
    }

    protected ComboItem() { }
}
