using System;
using System.Threading.Tasks;
using FISEI.Mantenimientos.API.DTOs;
using FISEI.Mantenimientos.API.Models;

namespace FISEI.Mantenimientos.API.Services
{
    public interface IMantenimientoService
    {
        Task<CasosMantenimiento> CrearOrdenAsync(CrearOrdenRequestDto request, int usuarioId);
        Task<DetallesMantenimiento> ActualizarEstadoAsync(Guid ordenId, Guid detalleId, ActualizarEstadoRequestDto request);
        Task<CasosMantenimiento> CerrarOrdenAsync(Guid ordenId);
    }
}
