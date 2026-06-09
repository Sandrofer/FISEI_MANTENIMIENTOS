namespace FISEI.Maintenance.API.Models;

public class Equipo
{
    public int Id { get; set; }
    public string CodigoInventario { get; set; } = string.Empty;
    public string NumeroSerie { get; set; } = string.Empty;
    public string NombreModelo { get; set; } = string.Empty;
    public int CategoriaId { get; set; }
    public int MarcaId { get; set; }
    public int UbicacionId { get; set; }
    public string Estado { get; set; } = "Operativo";
    public DateTime FechaRegistro { get; set; }
    public string EspecificacionesTecnicas { get; set; } = "{}";

    public ICollection<Mantenimiento> Mantenimientos { get; set; } = new List<Mantenimiento>();
}