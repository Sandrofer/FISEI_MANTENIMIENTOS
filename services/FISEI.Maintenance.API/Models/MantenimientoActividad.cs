namespace FISEI.Maintenance.API.Models;

public class MantenimientoActividad
{
    public int MantenimientoId { get; set; }
    public Mantenimiento Mantenimiento { get; set; } = null!;
    public int ActividadId { get; set; }
    public CatActividad Actividad { get; set; } = null!;
}