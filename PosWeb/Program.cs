using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Pomelo.EntityFrameworkCore.MySql.Infrastructure;
using PosWeb.Application.Auth;
using PosWeb.Application.Cajas;
using PosWeb.Application.Clientes;
using PosWeb.Application.Compras;
using PosWeb.Application.Deudas;
using PosWeb.Application.Estadisticas;
using PosWeb.Application.Gastos;
using PosWeb.Application.Pedidos;
using PosWeb.Application.Proveedores;
using PosWeb.Application.MediosPago;
using PosWeb.Application.OpenFoodFacts;
using PosWeb.Application.Productos;
using PosWeb.Application.StockSucursales;
using PosWeb.Application.Sucursales;
using PosWeb.Application.Ventas;
using PosWeb.Application.Combos;
using PosWeb.Data;
using PosWeb.Middlewares;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
    });

// JWT Authentication
var jwtSecret = builder.Configuration["Jwt:Secret"]
    ?? builder.Configuration["JWT_SECRET"]
    ?? "PosWeb_DevSecret_ChangeInProduction_MinLength32Chars!";

var jwtKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret));

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = jwtKey,
        ValidateIssuer = false,
        ValidateAudience = false,
        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero
    };
    options.Events = new JwtBearerEvents
    {
        OnChallenge = context =>
        {
            context.HandleResponse();
            context.Response.StatusCode = 401;
            context.Response.ContentType = "application/json";
            return context.Response.WriteAsJsonAsync(new { error = "No autorizado" });
        },
        OnForbidden = context =>
        {
            context.Response.StatusCode = 403;
            context.Response.ContentType = "application/json";
            return context.Response.WriteAsJsonAsync(new { error = "Acceso denegado" });
        }
    };
});

builder.Services.AddAuthorization();

// Scoped services
builder.Services.AddScoped<VentaService>();
builder.Services.AddScoped<ProductoService>();
builder.Services.AddScoped<SucursalService>();
builder.Services.AddScoped<StockSucursalService>();
builder.Services.AddScoped<JwtTokenService>();
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<CajaService>();
builder.Services.AddScoped<ClienteService>();
builder.Services.AddScoped<MedioPagoService>();
builder.Services.AddScoped<CompraService>();
builder.Services.AddScoped<ProveedorService>();
builder.Services.AddScoped<DeudaService>();
builder.Services.AddScoped<GastoService>();
builder.Services.AddScoped<EstadisticasService>();
builder.Services.AddScoped<PedidoService>();
builder.Services.AddScoped<ComboService>();

// Open Food Facts � optional barcode lookup
builder.Services.AddHttpClient<OpenFoodFactsService>(client =>
{
    client.BaseAddress = new Uri("https://world.openfoodfacts.org/");
    client.DefaultRequestHeaders.UserAgent.ParseAdd("PosWeb/1.0");
    client.Timeout = TimeSpan.FromSeconds(10);
});

// HTTP context for user tracking
builder.Services.AddHttpContextAccessor();

// Configure CORS for frontend origins
builder.Services.AddCors(options =>
{
    options.AddPolicy("FrontendOrigins", policy =>
    {
        policy.WithOrigins(
                "http://localhost:5173",          // Vite dev server (localhost)
                "http://192.168.1.39:5173")       // Vite dev server (network)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

builder.Services.AddDbContext<PosDbContext>(options =>
    options.UseMySql(
        builder.Configuration.GetConnectionString("DefaultConnection"),
        ServerVersion.AutoDetect(builder.Configuration.GetConnectionString("DefaultConnection"))
    )
);

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Ensure seed admin has a real BCrypt hash (migration placed a fake placeholder)
using (var scope = app.Services.CreateScope())
{
    var ctx = scope.ServiceProvider.GetRequiredService<PosDbContext>();
    ctx.Database.Migrate();

    var admin = ctx.Usuario.FirstOrDefault(u => u.NOMBRE_USUARIO == "admin");
    if (admin != null && !BCrypt.Net.BCrypt.Verify("123", admin.PASSWORD_HASH))
    {
        admin.SetPasswordHash(BCrypt.Net.BCrypt.HashPassword("123"));
        ctx.SaveChanges();
    }
}

// Log application startup
var logger = app.Services.GetRequiredService<ILogger<Program>>();
logger.LogInformation("PosWeb backend application starting up...");

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseAuthentication();
app.UseAuthorization();

// Add CORS middleware
app.UseCors("FrontendOrigins");

app.UseMiddleware<ExceptionMiddleware>();

app.MapControllers();

app.Run();

