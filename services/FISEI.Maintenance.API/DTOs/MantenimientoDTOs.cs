namespace FISEI.Maintenance.API.DTOs;

public class MantenimientoDto
{
    public int Id { get; set; }
    public int EquipoId { get; set; }
    public DateOnly FechaProgramada { get; set; }
    public DateOnly? FechaRealizada { get; set; }
    public string Estado { get; set; } = string.Empty;
    public string? Tipo { get; set; }
    public string? Responsable { get; set; }
    public string? Prioridad { get; set; }
    public string? Observaciones { get; set; }
    public string? Diagnostico { get; set; }
    public string? AccionesRealizadas { get; set; }
    public DateTime FechaCreacion { get; set; }
    
    public EquipoResumenDto Equipo { get; set; } = null!;
}

public class EquipoResumenDto
{
    public int Id { get; set; }
    public string NumeroSerie { get; set; } = string.Empty;
    public string Laboratorio { get; set; } = string.Empty;
}

public class CrearMantenimientoDto
{
    public int EquipoId { get; set; }
    public string Tipo { get; set; } = string.Empty;
    public string Responsable { get; set; } = string.Empty;
    public string Prioridad { get; set; } = string.Empty;
    public DateOnly? FechaProgramada { get; set; }
    public string? Observaciones { get; set; }
}

public class CompletarMantenimientoDto
{
    public DateOnly FechaRealizada { get; set; }
    public string Diagnostico { get; set; } = string.Empty;
    public string AccionesRealizadas { get; set; } = string.Empty;
    public string? Observaciones { get; set; }
}

public class ReprogramarMantenimientoDto
{
    public DateOnly NuevaFecha { get; set; }
    public string Motivo { get; set; } = string.Empty;
}
