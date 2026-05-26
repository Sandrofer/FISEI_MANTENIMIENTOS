namespace Inventory.API.DTOs;

public class MantenimientoDto
{
    public int Id { get; set; }
    public DateOnly FechaProgramada { get; set; }
    public DateOnly? FechaRealizada { get; set; }
    public string Estado { get; set; } = string.Empty;
    public string? Tipo { get; set; }
    public string? Responsable { get; set; }
    public string? Prioridad { get; set; }
    public string? Observaciones { get; set; }
    public string? Diagnostico { get; set; }
    public string? AccionesRealizadas { get; set; }
}
