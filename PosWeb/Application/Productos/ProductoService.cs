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
            .Where(p => p.Activo)
            .OrderBy(p => p.NOMBRE)
            .Select(p => new ProductoDto
            {
                Id = p.ID_PRODUCTO,
                CodigoBarra = p.CODIGO_BARRA,
                Nombre = p.NOMBRE,
                Precio = p.PRECIO,
                Costo = p.COSTO,
                Stock = p.STOCK,
                Activo = p.Activo
            })
            .ToList();
    }

    public ProductoDto Crear(ProductoDto dto)
    {
        bool codigoExiste = _context.Productos
            .Any(p => p.CODIGO_BARRA == dto.CodigoBarra && p.Activo);

        if (codigoExiste)
        {
            throw new ProductoCodigoDuplicadoException(dto.CodigoBarra);
        }

        Producto producto = new Producto(
            dto.CodigoBarra,
            dto.Nombre,
            dto.Precio,
            dto.Costo,
            dto.Stock
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
            .FirstOrDefault(p => p.CODIGO_BARRA == codigoBarra && p.Activo);

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
            Id = producto.ID_PRODUCTO,
            CodigoBarra = producto.CODIGO_BARRA,
            Nombre = producto.NOMBRE,
            Precio = producto.PRECIO,
            Costo = producto.COSTO,
            Stock = producto.STOCK,
            Activo = producto.Activo
        };
    }
}