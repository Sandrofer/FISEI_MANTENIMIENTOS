namespace Inventory.API.DTOs;

public class FilaPreviewDto
{
    public int Fila { get; set; }
    public string CodigoInventario { get; set; } = string.Empty;
    public string NumeroSerie { get; set; } = string.Empty;
    public string NombreModelo { get; set; } = string.Empty;
    public string Categoria { get; set; } = string.Empty;
    public string Marca { get; set; } = string.Empty;
    public string Ubicacion { get; set; } = string.Empty;
    public string Estado { get; set; } = string.Empty;
}

public class ResumenValidacionDto
{
    public bool Success { get; set; }
    public string? Mensaje { get; set; }
    public int TotalFilas { get; set; }
    public int TotalFilasValidas { get; set; }
    public int TotalFilasConErrores { get; set; }
    
    public List<FilaPreviewDto> Previsualizacion { get; set; } = new();
    public List<ErrorImportacionDto> Errores { get; set; } = new();
    
    public List<string> CategoriasFaltantes { get; set; } = new();
    public List<string> MarcasFaltantes { get; set; } = new();
    public List<string> UbicacionesFaltantes { get; set; } = new();
}
