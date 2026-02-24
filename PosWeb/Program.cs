using Microsoft.EntityFrameworkCore;
using PosWeb.Application.Productos;
using PosWeb.Application.Sucursales;
using PosWeb.Application.Ventas;
using PosWeb.Data;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers();
builder.Services.AddScoped<VentaService>();
builder.Services.AddScoped<ProductoService>();
builder.Services.AddScoped<SucursalService>();

builder.Services.AddDbContext<PosDbContext>(options =>
    options.UseSqlite(
        builder.Configuration.GetConnectionString("DefaultConnection")
    )
);

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.Run();