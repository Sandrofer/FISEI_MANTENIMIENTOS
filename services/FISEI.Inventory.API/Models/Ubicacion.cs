namespace Inventory.API.Models;

public class Ubicacion
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;

    public ICollection<Equipo> Equipos { get; set; } = new List<Equipo>();
}
