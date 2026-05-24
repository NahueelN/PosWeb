using Microsoft.EntityFrameworkCore;
using PosWeb.Application.Exceptions;
using PosWeb.Contracts;
using PosWeb.Data;
using PosWeb.Domain;

namespace PosWeb.Application.StockSucursales;

public class StockSucursalService
{
    private readonly PosDbContext _context;

    public StockSucursalService(PosDbContext context)
    {
        _context = context;
    }

    public List<StockSucursalDto> ListarPorSucursal(int sucursalId)
    {
        EnsureSucursalExists(sucursalId);

        return BuildSucursalStockQuery(sucursalId)
            .OrderBy(s => s.ProductoNombre)
            .ToList();
    }

    public StockSucursalDto? Obtener(int productoId, int sucursalId)
    {
        EnsureSucursalExists(sucursalId);

        return BuildSucursalStockQuery(sucursalId)
            .Where(s => s.ProductoId == productoId)
            .FirstOrDefault();
    }

    public void AjustarStock(int productoId, int sucursalId, int nuevoStock)
    {
        EnsureSucursalExists(sucursalId);
        EnsureProductoActivo(productoId);

        StockSucursal? stock = _context.StockSucursales
            .FirstOrDefault(s => s.IdProducto == productoId && s.IdSucursal == sucursalId);

        if (stock == null)
        {
            StockSucursal newStock = new StockSucursal(productoId, sucursalId, nuevoStock);
            _context.StockSucursales.Add(newStock);
        }
        else
        {
            stock.AjustarStock(nuevoStock);
        }

        _context.SaveChanges();
    }

    public List<StockSucursalDto> ListarBajoStock(int sucursalId, int limite)
    {
        EnsureSucursalExists(sucursalId);

        return BuildSucursalStockQuery(sucursalId)
            .Where(s => s.Stock <= limite)
            .OrderBy(s => s.ProductoNombre)
            .ToList();
    }

    private IQueryable<StockSucursalDto> BuildSucursalStockQuery(int sucursalId)
    {
        IQueryable<StockSucursal> branchStock = _context.StockSucursales
            .Where(s => s.IdSucursal == sucursalId);

        return _context.Productos
            .Where(p => p.ACTIVO)
            .GroupJoin(
                branchStock,
                producto => producto.ID_PRODUCTO,
                stock => stock.IdProducto,
                (producto, stockRows) => new { producto, stock = stockRows.FirstOrDefault() }
            )
            .Select(x => new StockSucursalDto
            {
                ProductoId = x.producto.ID_PRODUCTO,
                ProductoNombre = x.producto.NOMBRE,
                CodigoBarra = x.producto.CODIGO_BARRA,
                SucursalId = sucursalId,
                Stock = x.stock != null ? x.stock.Stock : 0,
                Inicializado = x.stock != null
            });
    }

    private void EnsureSucursalExists(int sucursalId)
    {
        bool sucursalExiste = _context.Sucursales
            .Any(s => s.ID_SUCURSAL == sucursalId && s.ACTIVO);

        if (!sucursalExiste)
        {
            throw new SucursalNoExisteException(sucursalId);
        }
    }

    private void EnsureProductoActivo(int productoId)
    {
        Producto? producto = _context.Productos
            .FirstOrDefault(p => p.ID_PRODUCTO == productoId);

        if (producto == null)
        {
            throw new ProductoNoEncontradoException(productoId);
        }

        if (!producto.ACTIVO)
        {
            throw new ProductoInactivoException(productoId);
        }
    }
}
