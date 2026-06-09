using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using FISEI.Mantenimientos.API.DTOs;
using FISEI.Mantenimientos.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FISEI.Mantenimientos.API.Controllers
{
    [ApiController]
    [Route("api/mantenimientos/estadisticas")]
    [Authorize]
    public class EstadisticasController : ControllerBase
    {
        private readonly MantenimientosDbContext _db;

        public EstadisticasController(MantenimientosDbContext db)
        {
            _db = db;
        }

        /// <summary>
        /// GET /api/mantenimientos/estadisticas?fechaInicio=YYYY-MM-DD&amp;fechaFin=YYYY-MM-DD
        /// Retorna estadísticas de mantenimientos en el rango indicado.
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> ObtenerEstadisticas(
            [FromQuery] DateTime fechaInicio,
            [FromQuery] DateTime fechaFin)
        {
            // ── Validación de parámetros ──────────────────────────────────────
            if (fechaInicio > fechaFin)
            {
                return BadRequest(new
                {
                    Mensaje = "El parámetro 'fechaInicio' no puede ser posterior a 'fechaFin'.",
                    Detalle = $"fechaInicio={fechaInicio:yyyy-MM-dd}, fechaFin={fechaFin:yyyy-MM-dd}"
                });
            }

            // Incluir todo el día de fechaFin
            var finDia = fechaFin.Date.AddDays(1).AddTicks(-1);

            // ── 1. Casos en el rango (base común) ────────────────────────────
            var casosEnRango = await _db.CasosMantenimientos
                .Where(c => c.FechaIngreso >= fechaInicio.Date && c.FechaIngreso <= finDia)
                .ToListAsync();

            var response = new EstadisticasResponseDto();

            if (!casosEnRango.Any())
            {
                // Sin datos: devolver estructuras vacías y tarjetas en 0
                return Ok(response);
            }

            var casosIds = casosEnRango.Select(c => c.Id).ToHashSet();

            // ── Grafico 1: Mantenimientos por mes agrupados por tipo ──────────
            response.Grafico1 = casosEnRango
                .GroupBy(c => new { c.FechaIngreso.Year, c.FechaIngreso.Month })
                .OrderBy(g => g.Key.Year)
                .ThenBy(g => g.Key.Month)
                .Select(g =>
                {
                    var items = g.ToList();
                    var fechaRef = new DateTime(g.Key.Year, g.Key.Month, 1);
                    return new MantenimientosPorMesDto
                    {
                        Mes        = fechaRef.ToString("MMM-yyyy"),
                        Anio       = g.Key.Year,
                        NumeroMes  = g.Key.Month,
                        Preventivo = items.Count(c => c.TipoMantenimiento == "Preventivo"),
                        Correctivo = items.Count(c => c.TipoMantenimiento == "Correctivo"),
                        Adaptativo = items.Count(c => c.TipoMantenimiento == "Adaptativo"),
                    };
                })
                .ToList();

            // ── Grafico 2: Causas de falla (diagnósticos) ─────────────────────
            // Obtener detalles de los casos en rango que tengan diagnóstico asignado
            var detallesConDiagnostico = await _db.DetallesMantenimientos
                .Include(d => d.DiagnosticoPredefinido)
                .Where(d => casosIds.Contains(d.CasoId)
                         && d.DiagnosticoPredefinidoId != null
                         && d.DiagnosticoPredefinido != null)
                .ToListAsync();

            if (detallesConDiagnostico.Any())
            {
                var totalDiagnosticos = detallesConDiagnostico.Count;

                response.Grafico2 = detallesConDiagnostico
                    .GroupBy(d => d.DiagnosticoPredefinido!.Descripcion)
                    .Select(g => new
                    {
                        Causa    = g.Key,
                        Cantidad = g.Count()
                    })
                    .OrderByDescending(x => x.Cantidad)
                    .Select(x => new CausaFallaDto
                    {
                        Causa      = x.Causa,
                        Cantidad   = x.Cantidad,
                        Porcentaje = Math.Round((x.Cantidad * 100.0) / totalDiagnosticos, 2)
                    })
                    .ToList();
            }

            // ── Grafico 3: Top 5 equipos con mayor número de mantenimientos ───
            var detallesTodos = await _db.DetallesMantenimientos
                .Where(d => casosIds.Contains(d.CasoId))
                .ToListAsync();

            response.Grafico3 = detallesTodos
                .GroupBy(d => d.EquipoId.ToString())
                .Select(g => new TopEquipoDto
                {
                    EquipoId            = g.Key,
                    TotalMantenimientos = g.Count()
                })
                .OrderByDescending(x => x.TotalMantenimientos)
                .Take(5)
                .ToList();

            // ── Tarjetas de resumen ───────────────────────────────────────────
            var totalMantenimientos  = casosEnRango.Count;
            var totalCompletados     = casosEnRango.Count(c => c.EstadoGeneral == "Cerrado");
            var totalPendientes      = totalMantenimientos - totalCompletados;

            // Promedio de duración: solo mantenimientos cerrados con fecha_cierre no nula
            var cerradosConFecha = casosEnRango
                .Where(c => c.EstadoGeneral == "Cerrado" && c.FechaCierre.HasValue)
                .ToList();

            double promedioDuracion = 0;
            if (cerradosConFecha.Any())
            {
                promedioDuracion = Math.Round(
                    cerradosConFecha.Average(c =>
                        (c.FechaCierre!.Value - c.FechaIngreso).TotalDays),
                    2);
            }

            response.Tarjetas = new TarjetasResumenDto
            {
                TotalMantenimientos = totalMantenimientos,
                TotalCompletados    = totalCompletados,
                TotalPendientes     = totalPendientes,
                PromedioDuracion    = promedioDuracion
            };

            return Ok(response);
        }
    }
}
