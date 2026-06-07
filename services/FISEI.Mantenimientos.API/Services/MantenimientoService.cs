using System;
using System.Linq;
using System.Threading.Tasks;
using FISEI.Mantenimientos.API.DTOs;
using FISEI.Mantenimientos.API.Models;
using Microsoft.EntityFrameworkCore;

namespace FISEI.Mantenimientos.API.Services
{
    public class MantenimientoService : IMantenimientoService
    {
        private readonly MantenimientosDbContext _dbContext;
        private readonly INotificacionesClient _notificacionesClient;

        public MantenimientoService(MantenimientosDbContext dbContext, INotificacionesClient notificacionesClient)
        {
            _dbContext = dbContext;
            _notificacionesClient = notificacionesClient;
        }

        public async Task<CasosMantenimiento> CrearOrdenAsync(CrearOrdenRequestDto request, int usuarioId)
        {
            using var transaction = await _dbContext.Database.BeginTransactionAsync();
            try
            {
                int anio = DateTime.Now.Year;
                string prefijo = $"MANT-{anio}-";
                
                var ultimoCaso = await _dbContext.CasosMantenimientos
                    .Where(c => c.CodigoCaso.StartsWith(prefijo))
                    .OrderByDescending(c => c.CodigoCaso)
                    .FirstOrDefaultAsync();

                int secuencial = 1;
                if (ultimoCaso != null)
                {
                    string numStr = ultimoCaso.CodigoCaso.Replace(prefijo, "");
                    if (int.TryParse(numStr, out int num))
                    {
                        secuencial = num + 1;
                    }
                }

                string codigoGenerado = $"{prefijo}{secuencial:D4}";

                var nuevoCaso = new CasosMantenimiento
                {
                    Id = Guid.NewGuid(),
                    CodigoCaso = codigoGenerado,
                    DescripcionGeneral = request.DescripcionGeneral,
                    FechaIngreso = request.FechaIngreso,
                    CreadoPorUsuarioId = usuarioId,
                    FechaRegistro = DateTime.Now,
                    TipoMantenimiento = request.TipoMantenimiento,
                    EstadoGeneral = "Abierto",
                    FechaCierre = null
                };

                _dbContext.CasosMantenimientos.Add(nuevoCaso);

                foreach (var eq in request.Equipos)
                {
                    var detalle = new DetallesMantenimiento
                    {
                        Id = Guid.NewGuid(),
                        CasoId = nuevoCaso.Id,
                        EquipoId = eq.EquipoId,
                        LaboratoristaAsignadoId = eq.LaboratoristaAsignadoId,
                        EstadoIndividual = "Pendiente"
                    };
                    _dbContext.DetallesMantenimientos.Add(detalle);
                }

                await _dbContext.SaveChangesAsync();
                await transaction.CommitAsync();

                // Load navigation property for return if needed
                nuevoCaso.DetallesMantenimientos = await _dbContext.DetallesMantenimientos
                    .Where(d => d.CasoId == nuevoCaso.Id).ToListAsync();

                foreach (var detalle in nuevoCaso.DetallesMantenimientos)
                {
                    await _notificacionesClient.EnviarAsignacionAsync(
                        detalle.LaboratoristaAsignadoId,
                        nuevoCaso.CodigoCaso,
                        detalle.EquipoId);
                }

                return nuevoCaso;
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        public async Task<CasosMantenimiento> CerrarOrdenAsync(Guid ordenId)
        {
            var casoMaestro = await _dbContext.CasosMantenimientos
                .Include(c => c.DetallesMantenimientos)
                .FirstOrDefaultAsync(c => c.Id == ordenId);

            if (casoMaestro == null)
            {
                throw new Exception("Orden no encontrada");
            }

            if (casoMaestro.EstadoGeneral == "Cerrado")
            {
                throw new Exception("La orden ya se encuentra cerrada");
            }

            casoMaestro.EstadoGeneral = "Cerrado";
            casoMaestro.FechaCierre = DateTime.UtcNow;

            await _dbContext.SaveChangesAsync();
            return casoMaestro;
        }

        public async Task<DetallesMantenimiento> ActualizarEstadoAsync(Guid ordenId, Guid detalleId, ActualizarEstadoRequestDto request)
        {
            var detalle = await _dbContext.DetallesMantenimientos
                .Include(d => d.Caso)
                .FirstOrDefaultAsync(d => d.Id == detalleId && d.CasoId == ordenId);

            if (detalle == null)
            {
                throw new Exception("Detalle no encontrado");
            }

            var estadosValidos = new[] { "Pendiente", "En Proceso", "Finalizado", "No Reparado (De Baja)" };
            int indiceActual = Array.IndexOf(estadosValidos, detalle.EstadoIndividual);
            int indiceNuevo = Array.IndexOf(estadosValidos, request.EstadoIndividual);

            if (indiceNuevo == -1)
            {
                throw new Exception("Estado solicitado no es válido");
            }

            if (indiceNuevo < indiceActual)
            {
                throw new Exception("No se permite retroceder el estado del mantenimiento");
            }

            var estadoAnterior = detalle.EstadoIndividual;
            detalle.EstadoIndividual = request.EstadoIndividual;

            if (detalle.EstadoIndividual == "En Proceso" && detalle.FechaInicio == null)
            {
                detalle.FechaInicio = DateTime.Now;
            }
            else if ((detalle.EstadoIndividual == "Finalizado" || detalle.EstadoIndividual == "No Reparado (De Baja)") && detalle.FechaFin == null)
            {
                detalle.FechaFin = DateTime.Now;
            }

            await _dbContext.SaveChangesAsync();

            if (estadoAnterior != "Finalizado" && detalle.EstadoIndividual == "Finalizado")
            {
                await _notificacionesClient.EnviarCompletadoAsync(
                    detalle.LaboratoristaAsignadoId,
                    detalle.Caso.CodigoCaso,
                    detalle.EquipoId);
            }

            return detalle;
        }
    }
}
