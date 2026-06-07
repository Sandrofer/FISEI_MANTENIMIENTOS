namespace Inventory.API.DTOs;

public class ErrorImportacionDto
{
    public int Fila { get; set; }
    public string Campo { get; set; } = string.Empty;
    public string Mensaje { get; set; } = string.Empty;
}

public class ImportacionEquiposResponseDto
{
    public bool Success { get; set; }
    public Guid? LoteImportacionId { get; set; }
    public int TotalImportados { get; set; }
    public List<ErrorImportacionDto> Errores { get; set; } = new();
}
