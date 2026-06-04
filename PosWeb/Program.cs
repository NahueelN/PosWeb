using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.Data.Sqlite;
using Microsoft.IdentityModel.Tokens;
using PosWeb.Application.Auth;
using PosWeb.Application.Cajas;
using PosWeb.Application.Clientes;
using PosWeb.Application.Compras;
using PosWeb.Application.Gastos;
using PosWeb.Application.MediosPago;
using PosWeb.Application.Productos;
using PosWeb.Application.StockSucursales;
using PosWeb.Application.Sucursales;
using PosWeb.Application.Ventas;
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
builder.Services.AddScoped<GastoService>();

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
    options.UseSqlite(
        builder.Configuration.GetConnectionString("DefaultConnection")
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
    EnsureUsuariosColumns(ctx);

    var admin = ctx.Usuarios.FirstOrDefault(u => u.NOMBRE_USUARIO == "admin");
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

static void EnsureUsuariosColumns(PosDbContext ctx)
{
    var connection = (SqliteConnection)ctx.Database.GetDbConnection();
    var shouldClose = connection.State != System.Data.ConnectionState.Open;
    if (shouldClose)
    {
        connection.Open();
    }

    try
    {
        var existingColumns = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        using (var pragma = connection.CreateCommand())
        {
            pragma.CommandText = "PRAGMA table_info('USUARIOS');";
            using var reader = pragma.ExecuteReader();
            while (reader.Read())
            {
                var columnName = reader["name"]?.ToString();
                if (!string.IsNullOrWhiteSpace(columnName))
                {
                    existingColumns.Add(columnName);
                }
            }
        }

        if (!existingColumns.Contains("MAIL"))
        {
            using var alter = connection.CreateCommand();
            alter.CommandText = "ALTER TABLE USUARIOS ADD COLUMN MAIL TEXT NULL;";
            alter.ExecuteNonQuery();
        }

        if (!existingColumns.Contains("ID_USUARIO_RESP"))
        {
            using var alter = connection.CreateCommand();
            alter.CommandText = "ALTER TABLE USUARIOS ADD COLUMN ID_USUARIO_RESP INTEGER NULL;";
            alter.ExecuteNonQuery();
        }
    }
    finally
    {
        if (shouldClose)
        {
            connection.Close();
        }
    }
}
