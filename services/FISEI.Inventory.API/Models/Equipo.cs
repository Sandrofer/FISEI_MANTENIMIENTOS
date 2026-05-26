namespace Inventory.API.Models;

public class Equipo
{
    public int Id { get; set; }
    public string NumeroSerie { get; set; } = string.Empty;
    public string Marca { get; set; } = string.Empty;
    public string Modelo { get; set; } = string.Empty;
    public string Procesador { get; set; } = string.Empty;
    public string Laboratorio { get; set; } = string.Empty;
    public DateOnly FechaCompra { get; set; }
    public string Estado { get; set; } = "Activo";
    public DateTime FechaRegistro { get; set; } = DateTime.Now;
    public bool Eliminado { get; set; } = false; // ✅ NUEVO CAMPO

    public ICollection<Mantenimiento> Mantenimientos { get; set; } = new List<Mantenimiento>();
}
