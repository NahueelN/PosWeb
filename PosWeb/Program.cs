using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Pomelo.EntityFrameworkCore.MySql.Infrastructure;
using PosWeb.Application.Auth;
using PosWeb.Application.Cajas;
using PosWeb.Application.CategoriasGasto;
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
using PosWeb.Application.Ofertas;
using PosWeb.Data;
using PosWeb.Middlewares;
using PosWeb.Domain;
using System.Security.Claims;
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
builder.Services.AddScoped<OfertaService>();
builder.Services.AddScoped<CategoriaGastoService>();

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

builder.Services.AddDbContext<PosDbContextLocal>(options =>
    options.UseSqlite(
        builder.Configuration.GetConnectionString("LocalConnection")
    )
);

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Ensure seed admin has a real BCrypt hash (migration placed a fake placeholder)
using (var scope = app.Services.CreateScope())
{
    var ctx = scope.ServiceProvider.GetRequiredService<PosDbContextLocal>();
    ctx.Database.Migrate();

    var admin = ctx.Usuario.FirstOrDefault(u => u.NOMBRE_USUARIO == "admin");
    if (admin != null && !BCrypt.Net.BCrypt.Verify("123", admin.PASSWORD_HASH))
    {
        admin.SetPasswordHash(BCrypt.Net.BCrypt.HashPassword("123"));
        ctx.SaveChanges();
    }

    if (admin != null && !ctx.Suscripcion.Any(s => s.ID_USUARIO_TITULAR == admin.ID_USUARIO))
    {
        var suscripcion = Suscripcion.CrearBasica(admin.ID_USUARIO);
        ctx.Suscripcion.Add(suscripcion);
        ctx.SaveChanges();

        var empresa = new Empresa("PosWeb", "00000000000", suscripcion.ID_SUSCRIPCION);
        ctx.Empresa.Add(empresa);
        ctx.SaveChanges();

        var sucursal = new Sucursal("CENTRAL", "Sucursal Central", empresa.ID_EMPRESA);
        ctx.Sucursal.Add(sucursal);
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
app.Use(async (context, next) =>
{
    if (context.User?.Identity?.IsAuthenticated == true)
    {
        var userIdValue = context.User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (int.TryParse(userIdValue, out var userId))
        {
            var db = context.RequestServices.GetRequiredService<PosDbContextLocal>();
            var usuario = db.Usuario.FirstOrDefault(u => u.ID_USUARIO == userId);

            if (usuario == null || !UsuarioTieneAccesoPorSuscripcion(usuario, db))
            {
                context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                context.Response.ContentType = "application/json";
                await context.Response.WriteAsJsonAsync(new
                {
                    error = "Acceso suspendido por suscripción vencida"
                });
                return;
            }
        }
    }

    await next();
});
app.UseAuthorization();

// Add CORS middleware
app.UseCors("FrontendOrigins");

app.UseMiddleware<ExceptionMiddleware>();

app.MapControllers();

app.Run();


static bool UsuarioTieneAccesoPorSuscripcion(Usuario usuario, PosDbContextLocal ctx)
{
    if (!usuario.ACTIVO)
    {
        return false;
    }

    var titular = usuario.ID_USUARIO_RESPONSABLE.HasValue
        ? ctx.Usuario.FirstOrDefault(u => u.ID_USUARIO == usuario.ID_USUARIO_RESPONSABLE.Value)
        : usuario;

    if (titular == null || !titular.ACTIVO)
    {
        return false;
    }

    var suscripcion = ctx.Suscripcion.FirstOrDefault(s => s.ID_USUARIO_TITULAR == titular.ID_USUARIO);
    if (suscripcion != null)
    {
        return suscripcion.EstaActiva();
    }

    return titular.SUSCRIPCION_ACTIVA;
}


