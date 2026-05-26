namespace FISEI.Maintenance.API.Models;

public class CatActividad
{
    public int Id { get; set; }
    public string Descripcion { get; set; } = string.Empty;
    public ICollection<MantenimientoActividad> MantenimientoActividades { get; set; } = new List<MantenimientoActividad>();
}
