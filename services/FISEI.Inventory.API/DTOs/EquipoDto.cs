namespace Inventory.API.DTOs;

public class CrearEquipoDto
{
    public string CodigoInventario { get; set; } = string.Empty;
    public string NumeroSerie { get; set; } = string.Empty;
    public string NombreModelo { get; set; } = string.Empty;
    public int CategoriaId { get; set; }
    public int MarcaId { get; set; }
    public int UbicacionId { get; set; }
    public string Estado { get; set; } = "Operativo";
    public int ResponsableId { get; set; }
    public string EspecificacionesTecnicas { get; set; } = "{}";
}

public class EquipoResponseDto
{
    public Guid Id { get; set; }
    public string CodigoInventario { get; set; } = string.Empty;
    public string NumeroSerie { get; set; } = string.Empty;
    public string NombreModelo { get; set; } = string.Empty;
    public int CategoriaId { get; set; }
    public string Categoria { get; set; } = string.Empty;
    public int MarcaId { get; set; }
    public string Marca { get; set; } = string.Empty;
    public int UbicacionId { get; set; }
    public string Ubicacion { get; set; } = string.Empty;
    public string Estado { get; set; } = string.Empty;
    public int ResponsableId { get; set; }
    public string EspecificacionesTecnicas { get; set; } = "{}";
    public DateTime FechaRegistro { get; set; }
    public Guid? LoteImportacionId { get; set; }
}

public class MantenimientoResponseDto
{
    public int Id { get; set; }
    public DateOnly FechaProgramada { get; set; }
    public string Estado { get; set; } = string.Empty;
    public string? Observaciones { get; set; }
}
