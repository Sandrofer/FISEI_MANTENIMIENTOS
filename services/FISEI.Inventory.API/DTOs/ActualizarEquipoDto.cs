namespace Inventory.API.DTOs;

public class ActualizarEquipoDto
{
    public string CodigoInventario { get; set; } = string.Empty;
    public string NumeroSerie { get; set; } = string.Empty;
    public string NombreModelo { get; set; } = string.Empty;
    public int CategoriaId { get; set; }
    public int MarcaId { get; set; }
    public int UbicacionId { get; set; }
    public string Estado { get; set; } = string.Empty;
    public Guid? ResponsableId { get; set; }
    public string EspecificacionesTecnicas { get; set; } = "{}";
}
