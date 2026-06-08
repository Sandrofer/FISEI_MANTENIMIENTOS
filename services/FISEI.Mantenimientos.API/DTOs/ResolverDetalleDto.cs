using System.Collections.Generic;

namespace FISEI.Mantenimientos.API.DTOs;

public class RecursoUtilizadoDto
{
    public string TipoRecursoPrincipal { get; set; } = string.Empty;
    public int? RecursoSubcategoriaId { get; set; }
    public int CantidadUtilizada { get; set; }
}

public class ResolverDetalleDto
{
    public int DiagnosticoPredefinidoId { get; set; }
    public string DescripcionDetallada { get; set; } = string.Empty;
    public List<int> AccionesIds { get; set; } = new List<int>();
    public List<RecursoUtilizadoDto> Recursos { get; set; } = new List<RecursoUtilizadoDto>();
}
