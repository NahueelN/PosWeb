using System.ComponentModel.DataAnnotations;

namespace PosWeb.Domain;

/// <summary>
/// Mesa física de un salón (segmento restaurante). Guarda su posición en el mapa
/// (x/y en % del plano) para replicar la distribución real del local.
/// </summary>
public class Mesa
{
    [Key]
    public int ID_MESA { get; private set; }

    public int ID_SUCURSAL { get; private set; }

    public string NUMERO_MESA { get; private set; } = null!;

    public string? DESCRIPCION { get; private set; }

    public decimal POS_X { get; private set; }

    public decimal POS_Y { get; private set; }

    public bool ACTIVA { get; private set; }

    public Mesa(int sucursalId, string numeroMesa, decimal posX, decimal posY, string? descripcion = null)
    {
        ID_SUCURSAL = sucursalId;
        CambiarNumero(numeroMesa);
        CambiarDescripcion(descripcion);
        Mover(posX, posY);
        ACTIVA = true;
    }

    protected Mesa()
    {
    }

    public void CambiarNumero(string numero)
    {
        if (string.IsNullOrWhiteSpace(numero))
            throw new ArgumentException("El número de mesa es requerido");

        NUMERO_MESA = numero.Trim();
    }

    public void CambiarDescripcion(string? descripcion)
    {
        DESCRIPCION = string.IsNullOrWhiteSpace(descripcion) ? null : descripcion.Trim();
    }

    public void Mover(decimal posX, decimal posY)
    {
        POS_X = Math.Clamp(posX, 0, 100);
        POS_Y = Math.Clamp(posY, 0, 100);
    }

    public void Desactivar()
    {
        ACTIVA = false;
    }

    public void Activar()
    {
        ACTIVA = true;
    }

    public void CambiarSucursal(int sucursalId)
    {
        if (sucursalId <= 0)
            throw new ArgumentException("Sucursal inválida");

        ID_SUCURSAL = sucursalId;
    }
}