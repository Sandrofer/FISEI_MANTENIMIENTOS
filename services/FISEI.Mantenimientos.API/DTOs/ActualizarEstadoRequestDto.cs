using System.ComponentModel.DataAnnotations;

namespace FISEI.Mantenimientos.API.DTOs
{
    public class ActualizarEstadoRequestDto
    {
        [Required]
        [RegularExpression("^(Pendiente|En Proceso|Finalizado|No Reparado \\(De Baja\\))$", ErrorMessage = "Estado no válido.")]
        public string EstadoIndividual { get; set; } = null!;
    }
}
