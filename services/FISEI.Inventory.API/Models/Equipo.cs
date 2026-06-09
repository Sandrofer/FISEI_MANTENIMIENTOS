namespace Inventory.API.Models;

public class Equipo
{
    public Guid Id { get; set; }
    public string CodigoInventario { get; set; } = string.Empty;
    public string NumeroSerie { get; set; } = string.Empty;
    public string NombreModelo { get; set; } = string.Empty;
    public int CategoriaId { get; set; }
    public int MarcaId { get; set; }
    public int UbicacionId { get; set; }
    public string Estado { get; set; } = "Operativo";
    public int ResponsableId { get; set; }
    public string EspecificacionesTecnicas { get; set; } = "{}";
    public DateTime FechaRegistro { get; set; } = DateTime.UtcNow;
    public Guid? LoteImportacionId { get; set; }

    public Categoria Categoria { get; set; } = null!;
    public Marca Marca { get; set; } = null!;
    public Ubicacion Ubicacion { get; set; } = null!;
    public LoteImportacion? LoteImportacion { get; set; }
}