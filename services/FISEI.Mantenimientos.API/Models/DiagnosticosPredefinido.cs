using System;
using System.Collections.Generic;

namespace FISEI.Mantenimientos.API.Models;

public partial class DiagnosticosPredefinido
{
    public int Id { get; set; }

    public string Codigo { get; set; } = null!;

    public string Descripcion { get; set; } = null!;

    public string CategoriaEquipo { get; set; } = null!;

    public virtual ICollection<DetallesMantenimiento> DetallesMantenimientos { get; set; } = new List<DetallesMantenimiento>();
}
