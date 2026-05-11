namespace Inventory.API.DTOs;

public class CrearEquipoDto
{
    public string NumeroSerie { get; set; } = string.Empty;
    public string Marca { get; set; } = string.Empty;
    public string Modelo { get; set; } = string.Empty;
    public string Procesador { get; set; } = string.Empty;
    public string Laboratorio { get; set; } = string.Empty;
    public DateOnly FechaCompra { get; set; }
}

public class EquipoResponseDto
{
    public int Id { get; set; }
    public string NumeroSerie { get; set; } = string.Empty;
    public string Marca { get; set; } = string.Empty;
    public string Modelo { get; set; } = string.Empty;
    public string Procesador { get; set; } = string.Empty;
    public string Laboratorio { get; set; } = string.Empty;
    public DateOnly FechaCompra { get; set; }
    public string Estado { get; set; } = string.Empty;
    public DateTime FechaRegistro { get; set; }
    public List<MantenimientoResponseDto> Mantenimientos { get; set; } = new();
}

public class MantenimientoResponseDto
{
    public int Id { get; set; }
    public DateOnly FechaProgramada { get; set; }
    public string Estado { get; set; } = string.Empty;
    public string? Observaciones { get; set; }
}