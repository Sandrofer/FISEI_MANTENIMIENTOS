
using Inventory.API.Data;
using Inventory.API.Services;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Base de datos
builder.Services.AddDbContext<InventoryDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("InventoryConnection")));

//builder.Services.AddDbContext<MaintenanceDbContext>(options =>
//  options.UseSqlServer(builder.Configuration.GetConnectionString("InventoryConnection")));

// Servicios
builder.Services.AddScoped<InventarioService>();
builder.Services.AddScoped<ExcelImportService>();

builder.Services.AddHttpClient("MantenimientosClient", client =>
{
    // Use the port defined in launchSettings.json for HTTP
    client.BaseAddress = new Uri("http://localhost:5085");
});

// CORS para el frontend
builder.Services.AddCors(options =>
{
    options.AddPolicy("FrontendPolicy", policy =>
    {
        policy.WithOrigins("http://localhost:5173")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

builder.Services.AddControllers();
builder.Services.AddOpenApi();

var app = builder.Build();

app.UseCors("FrontendPolicy");
app.UseAuthorization();
app.MapControllers();
app.MapOpenApi();

app.Run();
