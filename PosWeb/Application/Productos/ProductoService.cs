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
            .OrderBy(p => p.DESC_PRODUCTO)
            .Select(p => new ProductoDto
            {
                Id = p.ID_PRODUCTO,
                CodigoBarras = p.CODIGO_BARRAS,
                Nombre = p.DESC_PRODUCTO,
                Precio = p.PRECIO,
                Costo = p.COSTO,
                Activo = p.ACTIVO
            })
            .ToList();
    }

    public ProductoDto Crear(ProductoUpsertDto dto)
    {
        bool codigoExiste = _context.Productos
            .Any(p => p.CODIGO_BARRAS == dto.CodigoBarras && p.ACTIVO);

        if (codigoExiste)
        {
            throw new ProductoCodigoDuplicadoException(dto.CodigoBarras);
        }

        Producto producto = new Producto(
            dto.CodigoBarras,
            dto.CodigoBarras,
            dto.Nombre,
            dto.Precio,
            dto.Costo
        );

        _context.Productos.Add(producto);
        _context.SaveChanges();

        return MapToDto(producto);
    }

    public ProductoDto ObtenerPorCodigoBarra(string codigoBarras)
    {
        return ObtenerPorCodigoBarra(codigoBarras, sucursalId: null);
    }

    public ProductoDto ObtenerPorCodigoBarra(string codigoBarras, int? sucursalId)
    {
        if (string.IsNullOrWhiteSpace(codigoBarras))
        {
            throw new CodigoBarraRequeridoException();
        }

        Producto? producto = _context.Productos
            .FirstOrDefault(p => p.CODIGO_BARRAS == codigoBarras && p.ACTIVO);

        if (producto == null)
        {
            throw new ProductoNoEncontradoException(codigoBarras);
        }

        var dto = MapToDto(producto);

        if (sucursalId.HasValue)
        {
            StockSucursal? stock = _context.StockSucursales
                .FirstOrDefault(s => s.ID_PRODUCTO == producto.ID_PRODUCTO && s.ID_SUCURSAL == sucursalId.Value);
            dto.Stock = (int)(stock?.STOCK ?? 0);
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
            CodigoBarras = producto.CODIGO_BARRAS,
            Nombre = producto.DESC_PRODUCTO,
            Precio = producto.PRECIO,
            Costo = producto.COSTO,
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
            .Any(p => p.CODIGO_BARRAS == dto.CodigoBarras
                      && p.ID_PRODUCTO != id
                      && p.ACTIVO);

        if (codigoDuplicado)
        {
            throw new ProductoCodigoDuplicadoException(dto.CodigoBarras);
        }

        producto.CambiarCodigoBarras(dto.CodigoBarras);
        producto.CambiarDescripcion(dto.Nombre);
        producto.CambiarPrecio(dto.Precio);
        producto.CambiarCosto(dto.Costo);
        
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
            .Where(p => p.ACTIVO && (EF.Functions.Like(p.DESC_PRODUCTO, $"%{term}%") || EF.Functions.Like(p.CODIGO_BARRAS, $"%{term}%")))
            .OrderBy(p => p.DESC_PRODUCTO)
            .Select(p => new ProductoDto
            {
                Id = p.ID_PRODUCTO,
                CodigoBarras = p.CODIGO_BARRAS,
                Nombre = p.DESC_PRODUCTO,
                Precio = p.PRECIO,
                Costo = p.COSTO,
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
            .Where(p => p.ACTIVO && (EF.Functions.Like(p.DESC_PRODUCTO, pattern) || EF.Functions.Like(p.CODIGO_BARRAS, pattern)))
            .OrderBy(p => p.DESC_PRODUCTO)
            .Select(p => new ProductoDto
            {
                Id = p.ID_PRODUCTO,
                CodigoBarras = p.CODIGO_BARRAS,
                Nombre = p.DESC_PRODUCTO,
                Precio = p.PRECIO,
                Costo = p.COSTO,
                    Stock = _context.StockSucursales
                        .Where(s => s.ID_PRODUCTO == p.ID_PRODUCTO && s.ID_SUCURSAL == sucursalId)
                        .Select(s => (int)s.STOCK)
                        .FirstOrDefault(),
                    Activo = p.ACTIVO
            })
            .ToList();
    }
}
