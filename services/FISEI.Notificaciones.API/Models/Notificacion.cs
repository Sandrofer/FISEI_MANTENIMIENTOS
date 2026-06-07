namespace FISEI.Notificaciones.API.Models;

public class Notificacion
{
    public Guid Id { get; set; }

    public int UsuarioId { get; set; }

    public string CodigoCaso { get; set; } = string.Empty;

    public Guid EquipoId { get; set; }

    public string Mensaje { get; set; } = string.Empty;

    public string Tipo { get; set; } = string.Empty;

    public bool Leido { get; set; }

    public DateTime? FechaCreacion { get; set; }

    public DateTime? FechaLectura { get; set; }
}
