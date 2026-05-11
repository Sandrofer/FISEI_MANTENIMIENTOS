namespace Inventory.API.Models;

public class Mantenimiento
{
    public int Id { get; set; }
    public int EquipoId { get; set; }
    public DateOnly FechaProgramada { get; set; }
    public string Estado { get; set; } = "Pendiente";
    public string? Observaciones { get; set; }

    // Relación con Equipo
    public Equipo Equipo { get; set; } = null!;
}