namespace FISEI.Maintenance.API.Models;

public class DetalleMantenimiento
{
    public int Id { get; set; }
    public int MantenimientoId { get; set; }
    public Mantenimiento Mantenimiento { get; set; } = null!;
    public int EquipoId { get; set; }
    public Equipo Equipo { get; set; } = null!;
    public string? Diagnostico { get; set; }
    public string? AccionesRealizadas { get; set; }
    public string? Observaciones { get; set; }
    public string? Responsable { get; set; }
    public DateOnly? FechaRealizada { get; set; }
    public string Estado { get; set; } = "Pendiente";
}