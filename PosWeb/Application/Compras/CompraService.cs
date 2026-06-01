using Microsoft.EntityFrameworkCore;
using PosWeb.Application.Exceptions;
using PosWeb.Contracts;
using PosWeb.Data;
using PosWeb.Domain;

namespace PosWeb.Application.Compras;

public class CompraService
{
    private readonly PosDbContext _context;

    public CompraService(PosDbContext context)
    {
        _context = context;
    }

    public CompraResponseDto CrearCompra(CompraRequestDto request)
    {
        if (request.Items.Count == 0)
        {
            throw new CompraSinItemsException();
        }

        // Find active caja for the sucursal
        Caja? cajaActiva = _context.Cajas
            .FirstOrDefault(c => c.ID_SUCURSAL == request.SucursalId && c.ESTADO == "Abierta");

        if (cajaActiva == null)
        {
            throw new CompraSinCajaActivaException();
        }

        var results = new List<CompraItemResultDto>();
        decimal totalGasto = 0;

        foreach (var item in request.Items)
        {
            int productoId = item.ProductoId;

            // INLINE CREATION: item with ProductoId == 0 creates a new product
            if (productoId == 0)
            {
                if (string.IsNullOrWhiteSpace(item.CodigoBarra))
                    throw new ArgumentException("El código de barras es obligatorio para crear un producto nuevo");

                if (string.IsNullOrWhiteSpace(item.Nombre))
                    throw new ArgumentException("El nombre es obligatorio para crear un producto nuevo");

                // Check duplicate barcode
                bool codigoExiste = _context.Productos
                    .Any(p => p.CODIGO_BARRA == item.CodigoBarra && p.ACTIVO);

                if (codigoExiste)
                {
                    throw new ProductoCodigoDuplicadoException(item.CodigoBarra);
                }

                var nuevoProducto = new Producto(
                    item.CodigoBarra,
                    item.Nombre,
                    item.Precio,
                    item.Costo ?? 0,
                    0,                          // stock starts at 0
                    item.Tamano
                );
                _context.Productos.Add(nuevoProducto);
                _context.SaveChanges(); // Generate ID
                productoId = nuevoProducto.ID_PRODUCTO;
            }
            else
            {
                // EXISTING PRODUCT: find and optionally update price / cost
                var producto = _context.Productos.Find(productoId);
                if (producto == null || !producto.ACTIVO)
                {
                    throw new ProductoNoEncontradoException(productoId);
                }

                if (item.Precio > 0 && item.Precio != producto.PRECIO)
                    producto.CambiarPrecio(item.Precio);

                if (item.Costo.HasValue && item.Costo.Value != producto.COSTO)
                    producto.CambiarCosto(item.Costo.Value);
            }

            // Re-read product (may have been created inline)
            Producto? productoFinal = _context.Productos.Find(productoId);
            if (productoFinal == null || !productoFinal.ACTIVO)
            {
                throw new ProductoNoEncontradoException(productoId);
            }

            // Find or create StockSucursal row
            StockSucursal? stock = _context.StockSucursales
                .FirstOrDefault(s => s.IdProducto == productoId && s.IdSucursal == request.SucursalId);

            if (stock == null)
            {
                stock = new StockSucursal(productoId, request.SucursalId, productoFinal.STOCK);
                _context.StockSucursales.Add(stock);
                _context.SaveChanges(); // Generate ID
            }

            stock.AumentarStock(item.Cantidad);
            productoFinal.AumentarStock(item.Cantidad);

            decimal subtotal = item.Cantidad * item.CostoUnitario;
            totalGasto += subtotal;

            results.Add(new CompraItemResultDto
            {
                ProductoId = productoId,
                ProductoNombre = productoFinal.NOMBRE,
                Cantidad = item.Cantidad,
                CostoUnitario = item.CostoUnitario,
                Subtotal = subtotal
            });
        }

        string detalleGasto = string.IsNullOrWhiteSpace(request.Proveedor)
            ? "Compra"
            : $"Compra - {request.Proveedor.Trim()}";
        var gasto = new Gasto(cajaActiva.ID_CAJA, totalGasto, detalleGasto);
        _context.Gastos.Add(gasto);

        _context.SaveChanges();

        return new CompraResponseDto
        {
            GastoId = gasto.ID_GASTO,
            Proveedor = request.Proveedor,
            TotalGasto = totalGasto,
            Fecha = gasto.FECHA,
            Items = results
        };
    }
}
