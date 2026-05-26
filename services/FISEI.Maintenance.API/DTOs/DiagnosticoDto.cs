namespace FISEI.Maintenance.API.DTOs;

public class DiagnosticoDto
{
    public string Diagnostico { get; set; } = string.Empty;
    public string? Observaciones { get; set; }
    public string? EstadoFinal { get; set; }
    public List<int>? ActividadIds { get; set; }
}