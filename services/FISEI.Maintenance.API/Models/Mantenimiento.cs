namespace FISEI.Maintenance.API.Models;

public class Mantenimiento
{
    public int Id { get; set; }
    public int EquipoId { get; set; }
    public DateOnly FechaProgramada { get; set; }
    public DateOnly? FechaRealizada { get; set; }
    
    // Estados: Pendiente, EnProceso, Completado, Cancelado, Reprogramado
    // Por defecto al crear desde Maintenance.API será "Abierto" según la US, 
    // pero mantendremos consistencia. Usaremos "Pendiente" o "Abierto" dependiendo del contexto.
    public string Estado { get; set; } = "Pendiente";
    
    // Preventivo, Correctivo, Adaptativo
    public string? Tipo { get; set; }
    
    // Nombre o identificador del técnico responsable (Laboratorista)
    public string? Responsable { get; set; }
    
    // Baja, Media, Alta, Urgente
    public string? Prioridad { get; set; }
    
    public string? Observaciones { get; set; }
    public string? Diagnostico { get; set; }
    public string? AccionesRealizadas { get; set; }
    
    public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;
    public DateTime? FechaActualizacion { get; set; }

    // Relación con Equipo
    public Equipo Equipo { get; set; } = null!;
    public ICollection<MantenimientoActividad> MantenimientoActividades { get; set; } = new List<MantenimientoActividad>();
}
