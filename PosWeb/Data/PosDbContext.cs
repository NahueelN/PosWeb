using Microsoft.EntityFrameworkCore;
using PosWeb.Domain;

namespace PosWeb.Data;

public class PosDbContext : DbContext
{
    public PosDbContext(DbContextOptions<PosDbContext> options)
        : base(options)
    {
    }

    public DbSet<Producto> Productos { get; set; }
    public DbSet<Sucursal> Sucursales { get; set; }
    public DbSet<Venta> Ventas { get; set; }
    public DbSet<RenglonVenta> RenglonesVenta { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Índices de producto (ya los tenías)
        modelBuilder.Entity<Producto>()
            .HasIndex(p => p.CODIGO_BARRA);

        modelBuilder.Entity<Producto>()
            .HasIndex(p => p.NOMBRE);

        // Relación Venta -> Renglones
        modelBuilder.Entity<Venta>()
            .HasMany(v => v.RENGLONES)
            .WithOne()
            .HasForeignKey("VentaId");

        // Relación Sucursal -> Ventas
        modelBuilder.Entity<Venta>()
            .HasOne<Sucursal>()
            .WithMany()
            .HasForeignKey(v => v.ID_SUCURSAL);
    }
}
