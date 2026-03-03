using PosWeb.Application.Exceptions;
using PosWeb.Contracts;
using PosWeb.Data;
using PosWeb.Domain;

namespace PosWeb.Application.Productos;

public class ProductoService
{
    private readonly PosDbContext _context;

    public ProductoService(PosDbContext context)
    {
        _context = context;
    }

    public List<ProductoDto> ObtenerActivos()
    {
        return _context.Productos
            .Where(p => p.ACTIVO)
            .OrderBy(p => p.NOMBRE)
            .Select(p => new ProductoDto
            {
                ID_PRODUCTO = p.ID_PRODUCTO,
                CODIGO_BARRA = p.CODIGO_BARRA,
                NOMBRE = p.NOMBRE,
                PRECIO = p.PRECIO,
                COSTO = p.COSTO,
                STOCK = p.STOCK,
                ACTIVO = p.ACTIVO
            })
            .ToList();
    }

    public ProductoDto Crear(ProductoDto dto)
    {
        bool codigoExiste = _context.Productos
            .Any(p => p.CODIGO_BARRA == dto.CODIGO_BARRA && p.ACTIVO);

        if (codigoExiste)
        {
            throw new ProductoCodigoDuplicadoException(dto.CODIGO_BARRA);
        }

        Producto producto = new Producto(
            dto.CODIGO_BARRA,
            dto.NOMBRE,
            dto.PRECIO,
            dto.COSTO,
            dto.STOCK
        );

        _context.Productos.Add(producto);
        _context.SaveChanges();

        return MapToDto(producto);
    }

    public ProductoDto ObtenerPorCodigoBarra(string codigoBarra)
    {
        if (string.IsNullOrWhiteSpace(codigoBarra))
        {
            throw new CodigoBarraRequeridoException();
        }

        Producto? producto = _context.Productos
            .FirstOrDefault(p => p.CODIGO_BARRA == codigoBarra && p.ACTIVO);

        if (producto == null)
        {
            throw new ProductoNoEncontradoException(codigoBarra);
        }

        return MapToDto(producto);
    }

    public void Eliminar(int id)
    {
        Producto? producto = _context.Productos.Find(id);

        if (producto == null)
        {
            throw new ProductoNoEncontradoException(id);
        }

        producto.Desactivar();
        _context.SaveChanges();
    }

    private static ProductoDto MapToDto(Producto producto)
    {
        return new ProductoDto
        {
            ID_PRODUCTO = producto.ID_PRODUCTO,
            CODIGO_BARRA = producto.CODIGO_BARRA,
            NOMBRE = producto.NOMBRE,
            PRECIO = producto.PRECIO,
            COSTO = producto.COSTO,
            STOCK = producto.STOCK,
            ACTIVO = producto.ACTIVO
        };
    }

    public ProductoDto Modificar(int id, ProductoDto dto)
    {
        Producto? producto = _context.Productos.Find(id);

        if (producto == null)
        {
            throw new ProductoNoEncontradoException(id);
        }

        bool codigoDuplicado = _context.Productos
            .Any(p => p.CODIGO_BARRA == dto.CODIGO_BARRA
                      && p.ID_PRODUCTO != id
                      && p.ACTIVO);

        if (codigoDuplicado)
        {
            throw new ProductoCodigoDuplicadoException(dto.CODIGO_BARRA);
        }

        producto.CambiarCodigoBarra(dto.CODIGO_BARRA);
        producto.CambiarNombre(dto.NOMBRE);
        producto.CambiarPrecio(dto.PRECIO);
        producto.CambiarCosto(dto.COSTO);
        producto.CambiarStock(dto.STOCK);

        _context.SaveChanges();

        return MapToDto(producto);
    }
}