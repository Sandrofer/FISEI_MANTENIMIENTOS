
namespace FISEI.Maintenance.API.Models;

public class Mantenimiento
{
    public int Id { get; set; }
    public DateOnly FechaProgramada { get; set; }
    
    // Estados: Pendiente, EnProceso, Completado, Cancelado, Reprogramado
    public string Estado { get; set; } = "Pendiente";
    
    // Preventivo, Correctivo, Adaptativo
    public string? Tipo { get; set; }
    
    // Baja, Media, Alta, Urgente
    public string? Prioridad { get; set; }
    
    public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;
    public DateTime? FechaActualizacion { get; set; }

    public ICollection<DetalleMantenimiento> Detalles { get; set; } = new List<DetalleMantenimiento>();
}
