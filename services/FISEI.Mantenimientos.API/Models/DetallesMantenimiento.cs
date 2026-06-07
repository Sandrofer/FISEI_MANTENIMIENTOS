using System;
using System.Collections.Generic;

namespace FISEI.Mantenimientos.API.Models;

public partial class DetallesMantenimiento
{
    public Guid Id { get; set; }

    public Guid CasoId { get; set; }

    public Guid EquipoId { get; set; }

    public Guid LaboratoristaAsignadoId { get; set; }

    public string EstadoIndividual { get; set; } = null!;

    public int? DiagnosticoPredefinidoId { get; set; }

    public string? DescripcionDetalladaMantenimiento { get; set; }

    public DateTime? FechaInicio { get; set; }

    public DateTime? FechaFin { get; set; }

    public virtual CasosMantenimiento Caso { get; set; } = null!;

    public virtual DiagnosticosPredefinido? DiagnosticoPredefinido { get; set; }

    public virtual ICollection<MantenimientoRecurso> MantenimientoRecursos { get; set; } = new List<MantenimientoRecurso>();

    public virtual ICollection<AccionesPredefinida> AccionPredefinida { get; set; } = new List<AccionesPredefinida>();
}
