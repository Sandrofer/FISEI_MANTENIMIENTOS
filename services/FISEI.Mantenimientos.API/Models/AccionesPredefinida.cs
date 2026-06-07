using System;
using System.Collections.Generic;

namespace FISEI.Mantenimientos.API.Models;

public partial class AccionesPredefinida
{
    public int Id { get; set; }

    public string Nombre { get; set; } = null!;

    public string CategoriaEquipo { get; set; } = null!;

    public virtual ICollection<DetallesMantenimiento> DetalleMantenimientos { get; set; } = new List<DetallesMantenimiento>();
}
