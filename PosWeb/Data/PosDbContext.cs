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

        // PRODUCTO
        modelBuilder.Entity<Producto>(entity =>
        {
            entity.ToTable("PRODUCTOS");

            entity.HasKey(p => p.ID_PRODUCTO);

            entity.Property(p => p.ID_PRODUCTO)
                .HasColumnName("ID_PRODUCTO");

            entity.Property(p => p.CODIGO_BARRA)
                .HasColumnName("CODIGO_BARRA")
                .IsRequired();

            entity.Property(p => p.NOMBRE)
                .HasColumnName("NOMBRE")
                .IsRequired();

            entity.Property(p => p.PRECIO)
                .HasColumnName("PRECIO");

            entity.Property(p => p.COSTO)
                .HasColumnName("COSTO");

            entity.Property(p => p.STOCK)
                .HasColumnName("STOCK");

            entity.Property(p => p.ACTIVO)
                .HasColumnName("ACTIVO");

            entity.HasIndex(p => p.CODIGO_BARRA);
            entity.HasIndex(p => p.NOMBRE);
        });

        // SUCURSAL
        modelBuilder.Entity<Sucursal>(entity =>
        {
            entity.ToTable("SUCURSALES");

            entity.HasKey(s => s.ID_SUCURSAL);

            entity.Property(s => s.ID_SUCURSAL)
                .HasColumnName("ID_SUCURSAL");

            entity.Property(s => s.NUMERO)
                .HasColumnName("NUMERO");

            entity.Property(s => s.CODIGO)
                .HasColumnName("CODIGO")
                .IsRequired();

            entity.Property(s => s.NOMBRE)
                .HasColumnName("NOMBRE")
                .IsRequired();

            entity.Property(s => s.ACTIVO)
                .HasColumnName("ACTIVO");
        });

        // VENTA
        modelBuilder.Entity<Venta>(entity =>
        {
            entity.ToTable("VENTAS");

            entity.HasKey(v => v.ID_VENTA);

            entity.Property(v => v.ID_VENTA)
                .HasColumnName("ID_VENTA");

            entity.Property(v => v.ID_SUCURSAL)
                .HasColumnName("ID_SUCURSAL");

            entity.Property(v => v.FECHA)
                .HasColumnName("FECHA");

            entity.Property(v => v.TOTAL)
                .HasColumnName("TOTAL");

            entity.HasOne<Sucursal>()
                .WithMany()
                .HasForeignKey(v => v.ID_SUCURSAL);
        });

        // RENGLON VENTA
        modelBuilder.Entity<RenglonVenta>(entity =>
        {
            entity.ToTable("RENGLONES_VENTA");

            entity.HasKey(r => r.ID_RENGLON_VENTA);

            entity.Property(r => r.ID_RENGLON_VENTA)
                .HasColumnName("ID_RENGLON_VENTA");

            entity.Property(r => r.ID_PRODUCTO)
                .HasColumnName("ID_PRODUCTO");

            entity.Property(r => r.CANTIDAD)
                .HasColumnName("CANTIDAD");

            entity.Property(r => r.PRECIO_UNITARIO)
                .HasColumnName("PRECIO_UNITARIO");

            entity.Property(r => r.SUBTOTAL)
                .HasColumnName("SUBTOTAL");

            entity.HasOne<Venta>()
                .WithMany(v => v.RENGLONES)
                .HasForeignKey("ID_VENTA");
        });
    }
}
