using PosWeb.Domain.Exceptions;
using System.ComponentModel.DataAnnotations;

namespace PosWeb.Domain;

public class Producto
{
    [Key]
    public int ID_PRODUCTO { get; private set; }

    public string COD_PRODUCTO { get; private set; } = null!;

    public string CODIGO_BARRAS { get; private set; } = null!;

    public string DESC_PRODUCTO { get; private set; } = null!;

    public decimal PRECIO { get; private set; }

    public decimal COSTO { get; private set; }

    public int? ID_CATEGORIA { get; private set; }

    public string? DESC_ADICIONAL { get; private set; }

    public decimal? CONTENIDO { get; private set; }

    public int? ID_UNIDAD_MEDIDA { get; private set; }

    public string? MARCA { get; private set; }

    public decimal? MARGEN_GANANCIA { get; private set; }

    public bool SEGUIR_STOCK { get; private set; } = true;

    public bool ES_PESABLE { get; private set; }

    public bool ES_BULTO { get; private set; }

    public int? ID_PRODUCTO_BULTO { get; private set; }

    public DateTime FECHA_ALTA { get; private set; }

    public DateTime FECHA_ULTIMA_MOD { get; private set; }

    public DateTime? FECHA_BAJA { get; private set; }

    public bool ACTIVO { get; private set; }

    public Producto(
        string codProducto,
        string codigoBarras,
        string descProducto,
        decimal precio,
        decimal costo,
        int? idCategoria = null,
        string? descAdicional = null,
        decimal? contenido = null,
        int? idUnidadMedida = null,
        string? marca = null,
        decimal? margenGanancia = null,
        bool esPesable = false,
        bool esBulto = false,
        int? idProductoBulto = null)
    {
        ES_PESABLE = esPesable;
        ES_BULTO = esBulto;
        ID_PRODUCTO_BULTO = idProductoBulto;
        CambiarCodigoProducto(codProducto);
        CambiarCodigoBarras(codigoBarras);
        CambiarDescripcion(descProducto);
        CambiarPrecio(precio, esBulto);
        CambiarCosto(costo, esBulto);
        ID_CATEGORIA = idCategoria;
        DESC_ADICIONAL = descAdicional;
        CONTENIDO = contenido;
        ID_UNIDAD_MEDIDA = idUnidadMedida;
        MARCA = string.IsNullOrWhiteSpace(marca) ? null : marca.Trim();
        MARGEN_GANANCIA = margenGanancia;
        FECHA_ALTA = DateTime.UtcNow;
        FECHA_ULTIMA_MOD = DateTime.UtcNow;
        ACTIVO = true;
    }

    protected Producto()
    {
    }

    public void CambiarCodigoProducto(string codProducto)
    {
        if (string.IsNullOrWhiteSpace(codProducto) || codProducto.Trim().Length > 50)
        {
            throw new CodigoInvalidoException("Producto", codProducto);
        }

        COD_PRODUCTO = codProducto.Trim();
        FECHA_ULTIMA_MOD = DateTime.UtcNow;
    }

    public void CambiarCodigoBarras(string codigoBarras)
    {
        if (string.IsNullOrWhiteSpace(codigoBarras))
        {
            if (ES_PESABLE || ES_BULTO)
            {
                codigoBarras = string.Empty;
            }
        }

        CODIGO_BARRAS = (codigoBarras ?? string.Empty).Trim();
        FECHA_ULTIMA_MOD = DateTime.UtcNow;
    }

    public void CambiarDescripcion(string descProducto)
    {
        if (string.IsNullOrWhiteSpace(descProducto))
        {
            throw new NombreInvalidoException(descProducto);
        }

        DESC_PRODUCTO = descProducto;
        FECHA_ULTIMA_MOD = DateTime.UtcNow;
    }

    public void CambiarPrecio(decimal precio, bool esBulto = false)
    {
        if (!esBulto && precio <= 0)
        {
            throw new PrecioInvalidoException(precio);
        }

        if (esBulto)
        {
            precio = 0;
        }

        PRECIO = precio;
        FECHA_ULTIMA_MOD = DateTime.UtcNow;
    }

    public void CambiarCosto(decimal costo, bool esBulto = false)
    {
        if (!esBulto && costo < 0)
        {
            throw new CostoInvalidoException(costo);
        }

        if (esBulto)
        {
            costo = 0;
        }

        COSTO = costo;
        FECHA_ULTIMA_MOD = DateTime.UtcNow;
    }

    public void CambiarCategoria(int? idCategoria)
    {
        ID_CATEGORIA = idCategoria;
        FECHA_ULTIMA_MOD = DateTime.UtcNow;
    }

    public void CambiarDescAdicional(string? descAdicional)
    {
        DESC_ADICIONAL = string.IsNullOrWhiteSpace(descAdicional) ? null : descAdicional.Trim();
        FECHA_ULTIMA_MOD = DateTime.UtcNow;
    }

    public void CambiarContenido(decimal? contenido)
    {
        CONTENIDO = contenido;
        FECHA_ULTIMA_MOD = DateTime.UtcNow;
    }

    public void CambiarUnidadMedida(int? idUnidadMedida)
    {
        ID_UNIDAD_MEDIDA = idUnidadMedida;
        FECHA_ULTIMA_MOD = DateTime.UtcNow;
    }

    public void CambiarMarca(string? marca)
    {
        MARCA = string.IsNullOrWhiteSpace(marca) ? null : marca.Trim();
        FECHA_ULTIMA_MOD = DateTime.UtcNow;
    }

    public void CambiarMargen(decimal? margen)
    {
        MARGEN_GANANCIA = margen;
        FECHA_ULTIMA_MOD = DateTime.UtcNow;
    }

    public void CambiarSeguirStock(bool seguir)
    {
        SEGUIR_STOCK = seguir;
        FECHA_ULTIMA_MOD = DateTime.UtcNow;
    }

    public void CambiarEsPesable(bool esPesable)
    {
        ES_PESABLE = esPesable;
        FECHA_ULTIMA_MOD = DateTime.UtcNow;
    }

    public void CambiarEsBulto(bool esBulto, int? idProductoBulto = null)
    {
        ES_BULTO = esBulto;
        ID_PRODUCTO_BULTO = esBulto ? idProductoBulto : null;
        FECHA_ULTIMA_MOD = DateTime.UtcNow;
    }

    public void CambiarProductoBulto(int? idProductoBulto)
    {
        ID_PRODUCTO_BULTO = idProductoBulto;
        FECHA_ULTIMA_MOD = DateTime.UtcNow;
    }

    public void Activar()
    {
        ACTIVO = true;
        FECHA_ULTIMA_MOD = DateTime.UtcNow;
    }

    public void Desactivar()
    {
        ACTIVO = false;
        FECHA_BAJA = DateTime.UtcNow;
        FECHA_ULTIMA_MOD = DateTime.UtcNow;
    }
}
