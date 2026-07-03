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
        var query = _context.Producto
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
                CodigoProducto = p.COD_PRODUCTO,
                MargenGanancia = p.MARGEN_GANANCIA,
                SeguirStock = p.SEGUIR_STOCK
            });

        if (sucursalId.HasValue)
        {
            var stockDict = _context.StockSucursal
                .Where(s => s.ID_SUCURSAL == sucursalId.Value)
                .ToDictionary(s => s.ID_PRODUCTO, s => (int)s.STOCK);

            var result = query.ToList();
            foreach (var p in result)
            {
                p.Stock = stockDict.TryGetValue(p.Id, out var s) ? s : 0;
            }
            return result;
        }

        return query.ToList();
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

        // Auto-fill margen from categoria if not explicitly provided
        decimal? margen = dto.MargenGanancia;
        if (!margen.HasValue && dto.CategoriaId.HasValue)
        {
            margen = _context.Categoria
                .Where(c => c.ID_CATEGORIA == dto.CategoriaId.Value)
                .Select(c => c.MARGEN_GANANCIA)
                .FirstOrDefault();
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
            dto.Marca,
            margen
        );

        _context.Producto.Add(producto);
        _context.SaveChanges();

        return MapToDto(producto);
    }

    /// <summary>
    /// Devuelve el próximo código interno disponible (PROD + numérico secuencial, o "PROD1" si no hay).
    /// </summary>
    public string ObtenerSiguienteCodigo()
    {
        var todos = _context.Producto
            .Where(p => p.ACTIVO && p.COD_PRODUCTO.StartsWith("PROD"))
            .Select(p => p.COD_PRODUCTO)
            .ToList();

        var numericos = todos
            .Select(c => c.Length > 4 && int.TryParse(c.Substring(4), out var n) ? n : (int?)null)
            .Where(n => n.HasValue)
            .Select(n => n.Value);

        int max = numericos.Any() ? numericos.Max() : 0;
        return $"PROD{max + 1}";
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
            CodigoProducto = producto.COD_PRODUCTO,
            MargenGanancia = producto.MARGEN_GANANCIA,
            SeguirStock = producto.SEGUIR_STOCK
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
        producto.CambiarMargen(dto.MargenGanancia);
        if (dto.SeguirStock.HasValue) producto.CambiarSeguirStock(dto.SeguirStock.Value);
        
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

    public List<GrupoMarcasDto> ObtenerMarcasSimilares()
    {
        var marcas = _context.Producto
            .Where(p => p.ACTIVO && p.MARCA != null && p.MARCA != "")
            .Select(p => p.MARCA!)
            .Distinct()
            .OrderBy(m => m)
            .ToList();

        if (marcas.Count == 0) return new List<GrupoMarcasDto>();

        var parent = new Dictionary<string, string>();
        foreach (var m in marcas) parent[m] = m;

        string Find(string x)
        {
            if (parent[x] != x) parent[x] = Find(parent[x]);
            return parent[x];
        }

        void Union(string a, string b)
        {
            var ra = Find(a);
            var rb = Find(b);
            if (ra != rb) parent[rb] = ra;
        }

        for (int i = 0; i < marcas.Count; i++)
        {
            for (int j = i + 1; j < marcas.Count; j++)
            {
                if (LevenshteinDistancia(marcas[i], marcas[j]) <= 1)
                {
                    Union(marcas[i], marcas[j]);
                }
            }
        }

        var grupos = parent
            .GroupBy(kv => Find(kv.Key))
            .Select(g => new GrupoMarcasDto
            {
                Marcas = g.Select(kv => kv.Key).OrderBy(m => m).ToList()
            })
            .Where(g => g.Marcas.Count > 1)
            .OrderBy(g => g.Marcas.First())
            .ToList();

        return grupos;
    }

    private static int LevenshteinDistancia(string a, string b)
    {
        if (a.Length == 0) return b.Length;
        if (b.Length == 0) return a.Length;

        var dist = new int[a.Length + 1, b.Length + 1];
        for (int i = 0; i <= a.Length; i++) dist[i, 0] = i;
        for (int j = 0; j <= b.Length; j++) dist[0, j] = j;

        for (int i = 1; i <= a.Length; i++)
        {
            for (int j = 1; j <= b.Length; j++)
            {
                int costo = a[i - 1] == b[j - 1] ? 0 : 1;
                dist[i, j] = Math.Min(
                    Math.Min(dist[i - 1, j] + 1, dist[i, j - 1] + 1),
                    dist[i - 1, j - 1] + costo);
            }
        }

        return dist[a.Length, b.Length];
    }

    public List<string> ObtenerMarcas()
    {
        return _context.Producto
            .Where(p => p.ACTIVO && p.MARCA != null && p.MARCA != "")
            .Select(p => p.MARCA!)
            .Distinct()
            .OrderBy(m => m)
            .ToList();
    }

    public ProductoDto SeguirStockIndividual(int id, bool seguir)
    {
        Producto? producto = _context.Producto.Find(id);

        if (producto == null)
        {
            throw new ProductoNoEncontradoException(id);
        }

        producto.CambiarSeguirStock(seguir);
        _context.SaveChanges();

        return MapToDto(producto);
    }

    public int SeguirStockGlobal(bool seguir)
    {
        var productos = _context.Producto
            .Where(p => p.ACTIVO)
            .ToList();

        foreach (var p in productos)
        {
            p.CambiarSeguirStock(seguir);
        }

        _context.SaveChanges();
        return productos.Count;
    }

    public int AjustarPreciosPorMarca(string marca, decimal porcentaje)
    {
        if (string.IsNullOrWhiteSpace(marca))
            throw new ArgumentException("La marca es requerida");

        if (porcentaje <= 0)
            throw new ArgumentException("El porcentaje debe ser mayor a 0");

        // Find similar brands (Levenshtein ≤ 1)
        var todasLasMarcas = _context.Producto
            .Where(p => p.ACTIVO && p.MARCA != null && p.MARCA != "")
            .Select(p => p.MARCA!)
            .Distinct()
            .ToList();

        var marcasAfectadas = todasLasMarcas
            .Where(m => LevenshteinDistancia(marca, m) <= 1)
            .ToList();

        var productos = _context.Producto
            .Where(p => p.ACTIVO && marcasAfectadas.Contains(p.MARCA))
            .ToList();

        decimal factor = 1 + (porcentaje / 100);

        foreach (var p in productos)
        {
            p.CambiarCosto(Math.Round(p.COSTO * factor, 2));
            p.CambiarPrecio(Math.Round(p.PRECIO * factor, 2));
        }

        _context.SaveChanges();
        return productos.Count;
    }
}
