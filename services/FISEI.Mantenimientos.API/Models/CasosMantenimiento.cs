using System;
using System.Collections.Generic;

namespace FISEI.Mantenimientos.API.Models;

public partial class CasosMantenimiento
{
    public Guid Id { get; set; }

    public string CodigoCaso { get; set; } = null!;

    public string? DescripcionGeneral { get; set; }

    public DateTime FechaIngreso { get; set; }

    public int CreadoPorUsuarioId { get; set; }

    public DateTime? FechaRegistro { get; set; }

    public string TipoMantenimiento { get; set; } = null!;

    public string EstadoGeneral { get; set; } = null!;

    public DateTime? FechaCierre { get; set; }

    public virtual ICollection<DetallesMantenimiento> DetallesMantenimientos { get; set; } = new List<DetallesMantenimiento>();
}
