using Inventory.API.DTOs;
using Inventory.API.Services;
using Microsoft.AspNetCore.Mvc;

namespace Inventory.API.Controllers;

[ApiController]
[Route("api/inventario")]
public class InventarioController : ControllerBase
{
    private readonly InventarioService _service;

    public InventarioController(InventarioService service)
    {
        _service = service;
    }

    [HttpPost("individual")]
    public async Task<IActionResult> RegistrarEquipo([FromBody] CrearEquipoDto dto)
    {
        try
        {
            var resultado = await _service.RegistrarEquipoAsync(dto);
            return Ok(resultado);
        }
        catch (InvalidOperationException ex) when (ex.Message.Contains("número de serie"))
        {
            return Conflict(new { mensaje = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { mensaje = "Error al registrar el equipo", detalle = ex.Message });
        }
    }

    [HttpGet("equipos")]
    public async Task<ActionResult<List<EquipoResponseDto>>> ObtenerEquipos(
        [FromQuery] string? estado,
        [FromQuery] string? procesador,
        [FromQuery] DateOnly? fechaDesde,
        [FromQuery] DateOnly? fechaHasta)
    {
        var equipos = await _service.ObtenerEquiposAsync(estado, procesador, fechaDesde, fechaHasta);
        return Ok(equipos);
    }

    [HttpGet("equipos/{id:int}/hoja-vida")]
    public async Task<IActionResult> ObtenerHojaVidaEquipo(int id)
    {
        var hojaVida = await _service.ObtenerHojaVidaEquipoAsync(id);

        if (hojaVida is null)
        {
            return NotFound(new { message = "Equipo no encontrado" });
        }

        return Ok(hojaVida);
    }
}
