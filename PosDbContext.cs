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
}