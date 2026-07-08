using Microsoft.EntityFrameworkCore;
using PosWeb.Domain;

namespace PosWeb.Data;

public class PosDbContextLocal : DbContext
{
    public PosDbContextLocal(DbContextOptions<PosDbContextLocal> options)
        : base(options)
    {
    }

    public DbSet<Caja> Caja { get; set; }
    public DbSet<Producto> Producto { get; set; }
    public DbSet<Sucursal> Sucursal { get; set; }
    public DbSet<StockSucursal> StockSucursal { get; set; }
    public DbSet<Usuario> Usuario { get; set; }
    public DbSet<Cliente> Cliente { get; set; }
    public DbSet<Venta> Venta { get; set; }
    public DbSet<RenglonVenta> RenglonVenta { get; set; }
    public DbSet<MedioPago> MedioPago { get; set; }
    public DbSet<Pago> Pago { get; set; }
    public DbSet<Gasto> Gasto { get; set; }
    public DbSet<Suscripcion> Suscripcion { get; set; }
    public DbSet<Empresa> Empresa { get; set; }
    public DbSet<Categoria> Categoria { get; set; }
    public DbSet<UnidadMedida> UnidadMedida { get; set; }
    public DbSet<Proveedor> Proveedor { get; set; }
    public DbSet<Compra> Compra { get; set; }
    public DbSet<RenglonCompra> RenglonCompra { get; set; }
    public DbSet<Deuda> Deuda { get; set; }
    public DbSet<Pedido> Pedido { get; set; }
    public DbSet<RenglonPedido> RenglonPedido { get; set; }
    public DbSet<Combo> Combo { get; set; }
    public DbSet<ComboItem> ComboItem { get; set; }
    public DbSet<Oferta> Oferta { get; set; }
    public DbSet<PagoDeuda> PagoDeuda { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        PosDbContext.ConfigureEntities(modelBuilder);

        PosDbContext.SeedLocalData(modelBuilder);
    }
}
