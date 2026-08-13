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

        // Índices únicos filtrados por ACTIVO (SQLite soporta índices parciales),
        // para que un registro inactivo no bloquee el reuso de su código.
        modelBuilder.Entity<Producto>().HasIndex(p => p.COD_PRODUCTO).HasFilter("ACTIVO = 1");
        modelBuilder.Entity<Sucursal>().HasIndex(s => s.COD_SUCURSAL).HasFilter("ACTIVO = 1");
        modelBuilder.Entity<Usuario>().HasIndex(u => u.NOMBRE_USUARIO).HasFilter("ACTIVO = 1");
        modelBuilder.Entity<Cliente>().HasIndex(c => c.COD_CLIENTE).HasFilter("ACTIVO = 1");
        modelBuilder.Entity<Combo>().HasIndex(c => c.COD_COMBO).HasFilter("ACTIVO = 1");
        modelBuilder.Entity<MedioPago>().HasIndex(m => m.COD_MEDIO_PAGO).HasFilter("ACTIVO = 1");
        modelBuilder.Entity<Proveedor>().HasIndex(p => p.COD_PROVEEDOR).HasFilter("ACTIVO = 1");

        PosDbContext.SeedLocalData(modelBuilder);
    }
}
