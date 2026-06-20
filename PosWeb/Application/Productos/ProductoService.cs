using PosWeb.Application.Exceptions;
using PosWeb.Contracts;
using PosWeb.Data;
using PosWeb.Domain;
using PosWeb.Domain.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace PosWeb.Application.Productos;

public class ProductoService
{
    private readonly PosDbContext _context;

    public ProductoService(PosDbContext context)
    {
        _context = context;
    }

    public List<ProductoDto> ObtenerActivos(int? sucursalId = null)
    {
        if (sucursalId.HasValue)
        {
            return _context.Producto
                .Where(p => p.ACTIVO)
                .OrderBy(p => p.DESC_PRODUCTO)
                .Select(p => new ProductoDto
                {
                    Id = p.ID_PRODUCTO,
                    CodigoBarra = p.CODIGO_BARRAS,
                    Nombre = p.DESC_PRODUCTO,
                    Precio = p.PRECIO,
                    Costo = p.COSTO,
                    Stock = _context.StockSucursal
                        .Where(s => s.ID_PRODUCTO == p.ID_PRODUCTO && s.ID_SUCURSAL == sucursalId.Value)
                        .Select(s => (int)s.STOCK)
                        .FirstOrDefault(),
                    Activo = p.ACTIVO,
                    Marca = p.MARCA,
                    Contenido = p.CONTENIDO,
                    CategoriaId = p.ID_CATEGORIA,
                    UnidadMedidaId = p.ID_UNIDAD_MEDIDA,
                    DescAdicional = p.DESC_ADICIONAL,
                    CodigoProducto = p.COD_PRODUCTO
                })
                .ToList();
        }

        return _context.Producto
            .Where(p => p.ACTIVO)
            .OrderBy(p => p.DESC_PRODUCTO)
            .Select(p => new ProductoDto
            {
                Id = p.ID_PRODUCTO,
                CodigoBarra = p.CODIGO_BARRAS,
                Nombre = p.DESC_PRODUCTO,
                Precio = p.PRECIO,
                Costo = p.COSTO,
                Activo = p.ACTIVO,
                Marca = p.MARCA,
                Contenido = p.CONTENIDO,
                CategoriaId = p.ID_CATEGORIA,
                UnidadMedidaId = p.ID_UNIDAD_MEDIDA,
                DescAdicional = p.DESC_ADICIONAL,
                CodigoProducto = p.COD_PRODUCTO
            })
            .ToList();
    }

    public ProductoDetailDto? ObtenerDetalle(int id, int? sucursalId = null)
    {
        var query = _context.Producto
            .Where(p => p.ID_PRODUCTO == id && p.ACTIVO);

        var result = query.Select(p => new ProductoDetailDto
        {
            Id = p.ID_PRODUCTO,
            CodigoBarra = p.CODIGO_BARRAS,
            CodProducto = p.COD_PRODUCTO,
            Nombre = p.DESC_PRODUCTO,
            Precio = p.PRECIO,
            Costo = p.COSTO,
            Stock = sucursalId.HasValue
                ? _context.StockSucursal
                    .Where(s => s.ID_PRODUCTO == p.ID_PRODUCTO && s.ID_SUCURSAL == sucursalId.Value)
                    .Select(s => (int)s.STOCK)
                    .FirstOrDefault()
                : 0,
            DescAdicional = p.DESC_ADICIONAL,
            Contenido = p.CONTENIDO,
            Tamano = null,
            FechaAlta = p.FECHA_ALTA,
            FechaUltimaMod = p.FECHA_ULTIMA_MOD,
            FechaBaja = p.FECHA_BAJA,
            Activo = p.ACTIVO
        }).FirstOrDefault();

        if (result == null) return null;

        // Resolve categoria
        var prod = query.First();
        if (prod.ID_CATEGORIA.HasValue)
        {
            var cat = _context.Categoria.Find(prod.ID_CATEGORIA.Value);
            result.Categoria = cat?.DESC_CATEGORIA;
        }
        if (prod.ID_UNIDAD_MEDIDA.HasValue)
        {
            var um = _context.UnidadMedida.Find(prod.ID_UNIDAD_MEDIDA.Value);
            result.UnidadMedida = um?.DESC_UNIDAD_MEDIDA;
        }

        return result;
    }

    public ProductoDto Crear(ProductoUpsertDto dto)
    {
        bool codigoExiste = _context.Producto
            .Any(p => p.CODIGO_BARRAS == dto.CodigoBarra && p.ACTIVO);

        if (codigoExiste)
        {
            throw new ProductoCodigoDuplicadoException(dto.CodigoBarra);
        }

        string codProducto = !string.IsNullOrWhiteSpace(dto.CodigoProducto)
            ? dto.CodigoProducto.Trim()
            : ObtenerSiguienteCodigo();

        // Validar que el código interno no exista ya
        bool codigoProductoExiste = _context.Producto
            .Any(p => p.COD_PRODUCTO == codProducto && p.ACTIVO);

        if (codigoProductoExiste)
        {
            throw new CodigoProductoDuplicadoException(codProducto);
        }

        Producto producto = new Producto(
            codProducto,
            dto.CodigoBarra,
            dto.Nombre,
            dto.Precio,
            dto.Costo,
            dto.CategoriaId,
            dto.DescAdicional,
            dto.Contenido,
            dto.UnidadMedidaId,
            dto.Marca
        );

        _context.Producto.Add(producto);
        _context.SaveChanges();

        return MapToDto(producto);
    }

    /// <summary>
    /// Devuelve el próximo código interno disponible (max numérico + 1, o "1" si no hay).
    /// </summary>
    public string ObtenerSiguienteCodigo()
    {
        // Busca todos los COD_PRODUCTO que sean numéricos, toma el max y suma 1
        var todos = _context.Producto
            .Where(p => p.ACTIVO)
            .Select(p => p.COD_PRODUCTO)
            .ToList();

        var numericos = todos
            .Select(c => int.TryParse(c, out var n) ? n : (int?)null)
            .Where(n => n.HasValue)
            .Select(n => n.Value);

        int max = numericos.Any() ? numericos.Max() : 0;
        return (max + 1).ToString();
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

        Producto? producto = _context.Producto
            .FirstOrDefault(p => p.CODIGO_BARRAS == codigoBarras && p.ACTIVO);

        if (producto == null)
        {
            throw new ProductoNoEncontradoException(codigoBarras);
        }

        var dto = MapToDto(producto);

        if (sucursalId.HasValue)
        {
            StockSucursal? stock = _context.StockSucursal
                .FirstOrDefault(s => s.ID_PRODUCTO == producto.ID_PRODUCTO && s.ID_SUCURSAL == sucursalId.Value);
            dto.Stock = (int)(stock?.STOCK ?? 0);
        }

        return dto;
    }

    public void Eliminar(int id)
    {
        Producto? producto = _context.Producto.Find(id);

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
            CodigoBarra = producto.CODIGO_BARRAS,
            Nombre = producto.DESC_PRODUCTO,
            Precio = producto.PRECIO,
            Costo = producto.COSTO,
            Activo = producto.ACTIVO,
            Marca = producto.MARCA,
            Contenido = producto.CONTENIDO,
            CategoriaId = producto.ID_CATEGORIA,
            UnidadMedidaId = producto.ID_UNIDAD_MEDIDA,
            DescAdicional = producto.DESC_ADICIONAL,
            CodigoProducto = producto.COD_PRODUCTO
        };
    }

    public ProductoDto Modificar(int id, ProductoUpsertDto dto)
    {
        Producto? producto = _context.Producto.Find(id);
        
        if (producto == null)
        {
            throw new ProductoNoEncontradoException(id);
        }
        
        bool codigoDuplicado = _context.Producto
            .Any(p => p.CODIGO_BARRAS == dto.CodigoBarra
                      && p.ID_PRODUCTO != id
                      && p.ACTIVO);

        if (codigoDuplicado)
        {
            throw new ProductoCodigoDuplicadoException(dto.CodigoBarra);
        }

        producto.CambiarCodigoBarras(dto.CodigoBarra);
        producto.CambiarDescripcion(dto.Nombre);
        producto.CambiarPrecio(dto.Precio);
        producto.CambiarCosto(dto.Costo);
        producto.CambiarMarca(dto.Marca);
        producto.CambiarCategoria(dto.CategoriaId);
        producto.CambiarContenido(dto.Contenido);
        producto.CambiarUnidadMedida(dto.UnidadMedidaId);
        producto.CambiarDescAdicional(dto.DescAdicional);
        
        _context.SaveChanges();
        
        return MapToDto(producto);
    }

    public List<ProductoDto> BuscarPorNombre(string term)
    {
        if (string.IsNullOrWhiteSpace(term))
        {
            return new List<ProductoDto>();
        }

        return _context.Producto
            .Where(p => p.ACTIVO && (EF.Functions.Like(p.DESC_PRODUCTO, $"%{term}%") || EF.Functions.Like(p.CODIGO_BARRAS, $"%{term}%")))
            .OrderBy(p => p.DESC_PRODUCTO)
            .Select(p => new ProductoDto
            {
                Id = p.ID_PRODUCTO,
                CodigoBarra = p.CODIGO_BARRAS,
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

        return _context.Producto
            .Where(p => p.ACTIVO && (EF.Functions.Like(p.DESC_PRODUCTO, pattern) || EF.Functions.Like(p.CODIGO_BARRAS, pattern)))
            .OrderBy(p => p.DESC_PRODUCTO)
            .Select(p => new ProductoDto
            {
                Id = p.ID_PRODUCTO,
                CodigoBarra = p.CODIGO_BARRAS,
                Nombre = p.DESC_PRODUCTO,
                Precio = p.PRECIO,
                Costo = p.COSTO,
                    Stock = _context.StockSucursal
                        .Where(s => s.ID_PRODUCTO == p.ID_PRODUCTO && s.ID_SUCURSAL == sucursalId)
                        .Select(s => (int)s.STOCK)
                        .FirstOrDefault(),
                    Activo = p.ACTIVO
            })
            .ToList();
    }
}
