namespace Inventory.API.Models;

public class LoteImportacion
{
    public Guid Id { get; set; }
    public Guid UsuarioId { get; set; }
    public string NombreArchivo { get; set; } = string.Empty;
    public int TotalRegistros { get; set; }
    public DateTime FechaImportacion { get; set; } = DateTime.UtcNow;

    public ICollection<Equipo> Equipos { get; set; } = new List<Equipo>();
}
