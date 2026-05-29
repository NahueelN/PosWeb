using PosWeb.Application.Exceptions;
using PosWeb.Contracts;
using PosWeb.Data;
using PosWeb.Domain;
using Microsoft.EntityFrameworkCore;

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
                Id = p.ID_PRODUCTO,
                CodigoBarra = p.CODIGO_BARRA,
                Nombre = p.NOMBRE,
                Precio = p.PRECIO,
                Costo = p.COSTO,
                Stock = p.STOCK,
                Tamano = p.TAMANO,
                Activo = p.ACTIVO
            })
            .ToList();
    }

    public ProductoDto Crear(ProductoUpsertDto dto)
    {
        bool codigoExiste = _context.Productos
            .Any(p => p.CODIGO_BARRA == dto.CodigoBarra && p.ACTIVO);

        if (codigoExiste)
        {
            throw new ProductoCodigoDuplicadoException(dto.CodigoBarra);
        }

        Producto producto = new Producto(
            dto.CodigoBarra,
            dto.Nombre,
            dto.Precio,
            dto.Costo,
            0,
            dto.Tamano
        );

        _context.Productos.Add(producto);
        _context.SaveChanges();

        return MapToDto(producto);
    }

    public ProductoDto ObtenerPorCodigoBarra(string codigoBarra)
    {
        return ObtenerPorCodigoBarra(codigoBarra, sucursalId: null);
    }

    public ProductoDto ObtenerPorCodigoBarra(string codigoBarra, int? sucursalId)
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

        var dto = MapToDto(producto);

        if (sucursalId.HasValue)
        {
            StockSucursal? stock = _context.StockSucursales
                .FirstOrDefault(s => s.IdProducto == producto.ID_PRODUCTO && s.IdSucursal == sucursalId.Value);
            dto.Stock = stock?.Stock ?? 0;
        }

        return dto;
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
            Tamano = producto.TAMANO,
            Activo = producto.ACTIVO
        };
    }

    public ProductoDto Modificar(int id, ProductoUpsertDto dto)
    {
        Producto? producto = _context.Productos.Find(id);
        
        if (producto == null)
        {
            throw new ProductoNoEncontradoException(id);
        }
        
        bool codigoDuplicado = _context.Productos
            .Any(p => p.CODIGO_BARRA == dto.CodigoBarra
                      && p.ID_PRODUCTO != id
                      && p.ACTIVO);

        if (codigoDuplicado)
        {
            throw new ProductoCodigoDuplicadoException(dto.CodigoBarra);
        }

        producto.CambiarCodigoBarra(dto.CodigoBarra);
        producto.CambiarNombre(dto.Nombre);
        producto.CambiarPrecio(dto.Precio);
        producto.CambiarCosto(dto.Costo);
        producto.CambiarTamano(dto.Tamano);
        
        _context.SaveChanges();
        
        return MapToDto(producto);
    }

    public List<ProductoDto> BuscarPorNombre(string term)
    {
        if (string.IsNullOrWhiteSpace(term))
        {
            return new List<ProductoDto>();
        }

        return _context.Productos
            .Where(p => p.ACTIVO && (EF.Functions.Like(p.NOMBRE, $"%{term}%") || EF.Functions.Like(p.CODIGO_BARRA, $"%{term}%")))
            .OrderBy(p => p.NOMBRE)
            .Select(p => new ProductoDto
            {
                Id = p.ID_PRODUCTO,
                CodigoBarra = p.CODIGO_BARRA,
                Nombre = p.NOMBRE,
                Precio = p.PRECIO,
                Costo = p.COSTO,
                Stock = p.STOCK,
                Tamano = p.TAMANO,
                Activo = p.ACTIVO
            })
            .ToList();
    }

    public List<ProductoDto> BuscarParaVenta(string term, int sucursalId)
    {
        if (string.IsNullOrWhiteSpace(term))
        {
            return new List<ProductoDto>();
        }

        string pattern = $"%{term}%";

        return _context.Productos
            .Where(p => p.ACTIVO && (EF.Functions.Like(p.NOMBRE, pattern) || EF.Functions.Like(p.CODIGO_BARRA, pattern)))
            .OrderBy(p => p.NOMBRE)
            .Select(p => new ProductoDto
            {
                Id = p.ID_PRODUCTO,
                CodigoBarra = p.CODIGO_BARRA,
                Nombre = p.NOMBRE,
                Precio = p.PRECIO,
                Costo = p.COSTO,
                    Stock = _context.StockSucursales
                        .Where(s => s.IdProducto == p.ID_PRODUCTO && s.IdSucursal == sucursalId)
                        .Select(s => s.Stock)
                        .FirstOrDefault(),
                    Tamano = p.TAMANO,
                    Activo = p.ACTIVO
            })
            .ToList();
    }
}
