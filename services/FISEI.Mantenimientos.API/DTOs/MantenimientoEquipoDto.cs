using System;

namespace FISEI.Mantenimientos.API.DTOs
{
    public class MantenimientoEquipoDto
    {
        public Guid Id { get; set; }
        public string? CodigoCaso { get; set; }
        public DateTime FechaProgramada { get; set; }
        public DateTime? FechaInicio { get; set; }
        public DateTime? FechaCierre { get; set; }
        public string Estado { get; set; } = string.Empty;
        public string? Tipo { get; set; }
        public string? Responsable { get; set; }
        public string? Diagnostico { get; set; }
        public string? AccionesRealizadas { get; set; }
        public string? Observaciones { get; set; }
    }
}
