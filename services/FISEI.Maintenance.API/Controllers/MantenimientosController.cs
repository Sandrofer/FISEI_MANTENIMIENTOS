using FISEI.Maintenance.API.DTOs;
using FISEI.Maintenance.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FISEI.Maintenance.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class MantenimientosController : ControllerBase
{
    private readonly MaintenanceService _service;

    public MantenimientosController(MaintenanceService service)
    {
        _service = service;
    }

    [HttpGet]
    [Authorize(Roles = "Administrador,Laboratorista,Técnico,Tecnico")]
    public async Task<IActionResult> GetMantenimientos([FromQuery] string? estado, [FromQuery] string? laboratorio)
    {
        var result = await _service.ObtenerMantenimientosAsync(estado: estado, laboratorio: laboratorio);
        return Ok(result);
    }

    [HttpGet("equipo/{equipoId}")]
    [Authorize(Roles = "Administrador,Laboratorista,Técnico,Tecnico")]
    public async Task<IActionResult> GetPorEquipo(int equipoId)
    {
        var result = await _service.ObtenerMantenimientosAsync(equipoId: equipoId);
        return Ok(result);
    }

    [HttpGet("{id}")]
    [Authorize(Roles = "Administrador,Laboratorista,Técnico,Tecnico")]
    public async Task<IActionResult> GetPorId(int id)
    {
        var result = await _service.ObtenerMantenimientoPorIdAsync(id);
        if (result == null) return NotFound(new { mensaje = "Mantenimiento no encontrado" });
        return Ok(result);
    }

    [HttpPost]
    [Authorize(Roles = "Administrador,Laboratorista")]
    public async Task<IActionResult> Crear(CrearMantenimientoDto dto)
    {
        try
        {
            var result = await _service.CrearMantenimientoAsync(dto);
            return CreatedAtAction(nameof(GetPorId), new { id = result.Id }, result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { mensaje = ex.InnerException != null ? ex.InnerException.Message : ex.Message, stackTrace = ex.StackTrace });
        }
    }

    [HttpPut("{id}/reprogramar")]
    [Authorize(Roles = "Administrador,Laboratorista,Técnico,Tecnico")]
    public async Task<IActionResult> Reprogramar(int id, ReprogramarMantenimientoDto dto)
    {
        var success = await _service.ReprogramarMantenimientoAsync(id, dto);
        if (!success) return NotFound(new { mensaje = "Mantenimiento no encontrado" });
        return NoContent();
    }

    [HttpPut("{id}/iniciar")]
    [Authorize(Roles = "Administrador,Laboratorista,Técnico,Tecnico")]
    public async Task<IActionResult> Iniciar(int id)
    {
        var success = await _service.IniciarMantenimientoAsync(id);
        if (!success) return NotFound(new { mensaje = "Mantenimiento no encontrado" });
        return NoContent();
    }

    [HttpPut("{id}/completar")]
    [Authorize(Roles = "Administrador,Laboratorista,Técnico,Tecnico")]
    public async Task<IActionResult> Completar(int id, CompletarMantenimientoDto dto)
    {
        var success = await _service.CompletarMantenimientoAsync(id, dto);
        if (!success) return NotFound(new { mensaje = "Mantenimiento no encontrado" });
        return NoContent();
    }

    [HttpPut("{id}/cancelar")]
    [Authorize(Roles = "Administrador,Laboratorista")]
    public async Task<IActionResult> Cancelar(int id)
    {
        var success = await _service.CancelarMantenimientoAsync(id);
        if (!success) return NotFound(new { mensaje = "Mantenimiento no encontrado" });
        return NoContent();
    }
    // GET: api/mantenimiento/catfallas
[HttpGet("catfallas")]
public async Task<IActionResult> ObtenerCategoriasFalla()
{
    var categorias = await _service.ObtenerCategoriasFallaAsync();
    return Ok(categorias);
}

// GET: api/mantenimiento/actividades
[HttpGet("actividades")]
public async Task<IActionResult> ObtenerActividades()
{
    var actividades = await _service.ObtenerActividadesAsync();
    return Ok(actividades);
}

// PUT: api/mantenimiento/{id}/diagnostico
[HttpPut("{id:int}/diagnostico")]
public async Task<IActionResult> RegistrarDiagnostico(int id, [FromBody] DiagnosticoDto dto)
{
    var resultado = await _service.RegistrarDiagnosticoAsync(id, dto);
    if (!resultado)
        return NotFound(new { mensaje = "Mantenimiento no encontrado o ya fue diagnosticado" });
    return Ok(new { mensaje = "Diagnóstico registrado correctamente" });
}

}
