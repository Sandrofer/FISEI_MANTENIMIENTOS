namespace FISEI.Maintenance.API.Models;

public class Mantenimiento
{
    public int Id { get; set; }
    public int EquipoId { get; set; }
    public Equipo Equipo { get; set; } = null!;
    public DateOnly FechaProgramada { get; set; }
    public DateOnly? FechaRealizada { get; set; }
    public string Estado { get; set; } = "Pendiente";
    public string? Tipo { get; set; }
    public string? Prioridad { get; set; }
    public string? Responsable { get; set; }
    public string? Observaciones { get; set; }
    public string? Diagnostico { get; set; }
    public string? AccionesRealizadas { get; set; }
    public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;
    public DateTime? FechaActualizacion { get; set; }

    public ICollection<DetalleMantenimiento> Detalles { get; set; } = new List<DetalleMantenimiento>();
    public ICollection<MantenimientoActividad> MantenimientoActividades { get; set; } = new List<MantenimientoActividad>();
}