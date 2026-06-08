using System;
using System.Security.Claims;
using System.Threading.Tasks;
using FISEI.Mantenimientos.API.DTOs;
using FISEI.Mantenimientos.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FISEI.Mantenimientos.API.Controllers
{
    [ApiController]
    [Route("api/mantenimientos/ordenes")]
    [Authorize]
    public class OrdenesController : ControllerBase
    {
        private readonly IMantenimientoService _mantenimientoService;

        public OrdenesController(IMantenimientoService mantenimientoService)
        {
            _mantenimientoService = mantenimientoService;
        }

        [HttpPost]
        public async Task<IActionResult> CrearOrden([FromBody] CrearOrdenRequestDto request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (!int.TryParse(userIdString, out int usuarioId) || usuarioId <= 0)
                {
                    return Unauthorized("Token inválido o falta ID de usuario");
                }

                var orden = await _mantenimientoService.CrearOrdenAsync(request, usuarioId);
                return Ok(orden);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Mensaje = "Error al crear la orden", Detalle = ex.Message });
            }
        }

        [HttpPatch("{ordenId}/detalle/{detalleId}/estado")]
        public async Task<IActionResult> ActualizarEstado(Guid ordenId, Guid detalleId, [FromBody] ActualizarEstadoRequestDto request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                var detalleActualizado = await _mantenimientoService.ActualizarEstadoAsync(ordenId, detalleId, request);
                return Ok(detalleActualizado);
            }
            catch (Exception ex)
            {
                return BadRequest(new { Mensaje = ex.Message });
            }
        }

        [HttpPost("{ordenId}/detalle/{detalleId}/resolver")]
        public async Task<IActionResult> ResolverDetalle(Guid ordenId, Guid detalleId, [FromBody] ResolverDetalleDto request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                var detalleActualizado = await _mantenimientoService.ResolverDetalleAsync(ordenId, detalleId, request);
                return Ok(detalleActualizado);
            }
            catch (Exception ex)
            {
                return BadRequest(new { Mensaje = ex.ToString() });
            }
        }

        [HttpPatch("{id}/cerrar")]
        public async Task<IActionResult> CerrarOrden(Guid id)
        {
            try
            {
                var casoCerrado = await _mantenimientoService.CerrarOrdenAsync(id);
                return Ok(casoCerrado);
            }
            catch (Exception ex)
            {
                return BadRequest(new { Mensaje = ex.Message });
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> ObtenerOrden(Guid id, [FromServices] FISEI.Mantenimientos.API.Models.MantenimientosDbContext dbContext)
        {
            var orden = await Microsoft.EntityFrameworkCore.EntityFrameworkQueryableExtensions.Include(
                dbContext.CasosMantenimientos,
                c => c.DetallesMantenimientos)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (orden == null) return NotFound();
            return Ok(orden);
        }

        [HttpGet]
        public async Task<IActionResult> ObtenerTodasLasOrdenes([FromServices] FISEI.Mantenimientos.API.Models.MantenimientosDbContext dbContext)
        {
            var ordenes = await Microsoft.EntityFrameworkCore.EntityFrameworkQueryableExtensions.Include(
                dbContext.CasosMantenimientos,
                c => c.DetallesMantenimientos)
                .OrderByDescending(c => c.FechaIngreso)
                .ToListAsync();

            return Ok(ordenes);
        }
    }
}
