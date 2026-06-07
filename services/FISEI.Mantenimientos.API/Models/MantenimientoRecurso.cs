using System;
using System.Collections.Generic;

namespace FISEI.Mantenimientos.API.Models;

public partial class MantenimientoRecurso
{
    public Guid Id { get; set; }

    public Guid DetalleMantenimientoId { get; set; }

    public string TipoRecursoPrincipal { get; set; } = null!;

    public int? RecursoSubcategoriaId { get; set; }

    public int? RepuestoAlmacenId { get; set; }

    public int CantidadUtilizada { get; set; }

    public virtual DetallesMantenimiento DetalleMantenimiento { get; set; } = null!;
}
