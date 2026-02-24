using PosWeb.Domain.Exceptions;

namespace PosWeb.Domain;

public class Producto
{
    public int ID_PRODUCTO { get; private set; }

    public string CODIGO_BARRA { get; private set; } = null!;

    public string NOMBRE { get; private set; } = null!;

    public decimal PRECIO { get; private set; }

    public decimal COSTO { get; private set; }

    public int STOCK { get; private set; }

    public bool Activo { get; private set; }

    public Producto(
        string codigoBarra,
        string nombre,
        decimal precio,
        decimal costo,
        int stock)
    {
        CambiarCodigoBarra(codigoBarra);
        CambiarNombre(nombre);
        CambiarPrecio(precio);
        CambiarCosto(costo);
        CambiarStock(stock);

        Activo = true;
    }

    protected Producto()
    {
    }

    public void CambiarCodigoBarra(string codigoBarra)
    {
        if (string.IsNullOrWhiteSpace(codigoBarra))
        {
            throw new CodigoBarraInvalidoException(codigoBarra);
        }

        CODIGO_BARRA = codigoBarra;
    }

    public void CambiarNombre(string nombre)
    {
        if (string.IsNullOrWhiteSpace(nombre))
        {
            throw new NombreInvalidoException(nombre);
        }

        NOMBRE = nombre;
    }

    public void CambiarPrecio(decimal precio)
    {
        if (precio <= 0)
        {
            throw new PrecioInvalidoException(precio);
        }

        PRECIO = precio;
    }

    public void CambiarCosto(decimal costo)
    {
        if (costo < 0)
        {
            throw new CostoInvalidoException(costo);
        }

        COSTO = costo;
    }

    public void CambiarStock(int stock)
    {
        if (stock < 0)
        {
            throw new StockInvalidoException(stock);
        }

        STOCK = stock;
    }

    public void DescontarStock(int cantidad)
    {
        if (cantidad <= 0)
        {
            throw new CantidadInvalidaException(cantidad);
        }

        if (STOCK < cantidad)
        {
            throw new StockInsuficienteException(
                NOMBRE,
                STOCK,
                cantidad
            );
        }

        STOCK -= cantidad;
    }

    public void AumentarStock(int cantidad)
    {
        if (cantidad <= 0)
        {
            throw new CantidadInvalidaException(cantidad);
        }

        STOCK += cantidad;
    }

    public void Activar()
    {
        Activo = true;
    }

    public void Desactivar()
    {
        Activo = false;
    }
}
