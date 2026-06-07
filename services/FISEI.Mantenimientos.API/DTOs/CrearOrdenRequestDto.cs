using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace FISEI.Mantenimientos.API.DTOs
{
    public class CrearOrdenRequestDto
    {
        public string? DescripcionGeneral { get; set; }

        [Required]
        public DateTime FechaIngreso { get; set; }

        [Required]
        [RegularExpression("^(Preventivo|Correctivo|Adaptativo)$", ErrorMessage = "El tipo de mantenimiento no es válido.")]
        public string TipoMantenimiento { get; set; } = "Preventivo";

        [Required]
        [MinLength(1, ErrorMessage = "Debe haber al menos un equipo en la orden.")]
        public List<DetalleEquipoRequestDto> Equipos { get; set; } = new();
    }

    public class DetalleEquipoRequestDto
    {
        [Required]
        public Guid EquipoId { get; set; }

        [Required]
        public Guid LaboratoristaAsignadoId { get; set; }
    }
}
