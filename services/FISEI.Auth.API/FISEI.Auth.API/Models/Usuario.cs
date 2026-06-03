using System.ComponentModel.DataAnnotations.Schema;

namespace FISEI.Auth.API.Models;

[Table("usuarios")]
public class Usuario
{
    [Column("Id")]
    public int Id { get; set; }

    public string Nombre { get; set; } = string.Empty;
    public string Apellido { get; set; } = string.Empty;
    public string Correo { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string Rol { get; set; } = string.Empty;
    public bool Activo { get; set; } = true;
    public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;
}
