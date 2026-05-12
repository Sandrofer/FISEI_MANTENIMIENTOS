namespace Inventory.API.DTOs;

public class MantenimientoDto
{
    public int Id { get; set; }
    public DateOnly FechaProgramada { get; set; }
    public string Estado { get; set; } = string.Empty;
    public string? Observaciones { get; set; }
}
