using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Inventory.API.DTOs;
using Inventory.API.Services;
using Microsoft.AspNetCore.Mvc;

namespace Inventory.API.Controllers;

[ApiController]
[Route("api/inventario")]
public class InventarioController : ControllerBase
{
    private readonly InventarioService _service;
    private readonly ExcelImportService _excelImportService;

    public InventarioController(InventarioService service, ExcelImportService excelImportService)
    {
        _service = service;
        _excelImportService = excelImportService;
    }

    [HttpGet("plantilla")]
    public IActionResult DescargarPlantilla()
    {
        var contenido = _excelImportService.GenerarPlantilla();
        return File(
            contenido,
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "plantilla_equipos.xlsx");
    }

    [HttpPost("equipos/importar")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> ImportarEquipos([FromForm] IFormFile? archivo, [FromForm] bool importacionParcial, [FromForm] bool autoCrear, CancellationToken cancellationToken)
    {
        if (archivo is null)
        {
            return BadRequest(new ImportacionEquiposResponseDto
            {
                Success = false,
                Errores =
                [
                    new ErrorImportacionDto
                    {
                        Fila = 0,
                        Campo = "Archivo",
                        Mensaje = "Debe adjuntar un archivo .xlsx."
                    }
                ]
            });
        }

        if (!TryGetUsuarioId(out var usuarioId, out var responsableId))
        {
            return Unauthorized(new
            {
                success = false,
                mensaje = "No se pudo identificar el usuario autenticado."
            });
        }

        try
        {
            var resultado = await _excelImportService.ImportarAsync(archivo, usuarioId, responsableId, importacionParcial, autoCrear, cancellationToken);
            return resultado.Success ? Ok(resultado) : BadRequest(resultado);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ImportacionEquiposResponseDto
            {
                Success = false,
                Errores =
                [
                    new ErrorImportacionDto
                    {
                        Fila = 0,
                        Campo = "Archivo",
                        Mensaje = $"No se pudo completar la importacion. {ex.Message}"
                    }
                ]
            });
        }
    }

    [HttpPost("equipos/validar-importacion")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> ValidarImportacion([FromForm] IFormFile? archivo, CancellationToken cancellationToken)
    {
        if (archivo is null)
        {
            return BadRequest(new ResumenValidacionDto
            {
                Success = false,
                Mensaje = "Debe adjuntar un archivo .xlsx."
            });
        }

        try
        {
            var resultado = await _excelImportService.ValidarImportacionAsync(archivo, cancellationToken);
            return Ok(resultado);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ResumenValidacionDto
            {
                Success = false,
                Mensaje = $"Error al validar el archivo: {ex.Message}"
            });
        }
    }

    [HttpPost("individual")]
    public async Task<IActionResult> RegistrarEquipo([FromBody] CrearEquipoDto dto)
    {
        try
        {
            var resultado = await _service.RegistrarEquipoAsync(dto);
            return Ok(resultado);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { mensaje = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { mensaje = "Error al registrar el equipo", detalle = ex.Message });
        }
    }

    [HttpGet("equipos")]
    public async Task<ActionResult<List<EquipoResponseDto>>> ObtenerEquipos([FromQuery] string? estado)
    {
        var equipos = await _service.ObtenerEquiposAsync(estado);
        return Ok(equipos);
    }

    [HttpGet("equipos/{id:guid}/hoja-vida")]
    public async Task<IActionResult> ObtenerHojaVidaEquipo(Guid id)
    {
        var hojaVida = await _service.ObtenerHojaVidaEquipoAsync(id);

        if (hojaVida is null)
        {
            return NotFound(new { message = "Equipo no encontrado" });
        }

        return Ok(hojaVida);
    }

    [HttpPut("equipos/{id:guid}")]
    public async Task<IActionResult> ActualizarEquipo(Guid id, [FromBody] ActualizarEquipoDto dto)
    {
        var resultado = await _service.ActualizarEquipoAsync(id, dto);

        if (resultado is null)
        {
            return NotFound(new { mensaje = "Equipo no encontrado" });
        }

        return Ok(resultado);
    }

    [HttpDelete("equipos/{id:guid}")]
    public async Task<IActionResult> EliminarEquipo(Guid id)
    {
        var eliminado = await _service.EliminarEquipoAsync(id);

        if (!eliminado)
        {
            return NotFound(new { mensaje = "Equipo no encontrado" });
        }

        return Ok(new { mensaje = "Equipo eliminado correctamente" });
    }

    private bool TryGetUsuarioId(out Guid usuarioId, out int responsableId)
    {
        if (TryReadUsuarioId(User.Claims, out usuarioId, out responsableId))
        {
            return true;
        }

        var authorization = Request.Headers.Authorization.ToString();
        if (!authorization.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
        {
            usuarioId = Guid.Empty;
            responsableId = 0;
            return false;
        }

        try
        {
            var token = authorization["Bearer ".Length..].Trim();
            var jwt = new JwtSecurityTokenHandler().ReadJwtToken(token);
            return TryReadUsuarioId(jwt.Claims, out usuarioId, out responsableId);
        }
        catch
        {
            usuarioId = Guid.Empty;
            responsableId = 0;
            return false;
        }
    }

    private static bool TryReadUsuarioId(IEnumerable<Claim> claims, out Guid usuarioId, out int responsableId)
    {
        var idClaimTypes = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            "usuario_id",
            "user_id",
            "userid",
            "id",
            JwtRegisteredClaimNames.Sub,
            "sub",
            "nameid",
            ClaimTypes.NameIdentifier
        };

        var rawUserId = claims
            .FirstOrDefault(c => idClaimTypes.Contains(c.Type))
            ?.Value;

        if (int.TryParse(rawUserId, out var numericUserId) && numericUserId > 0)
        {
            responsableId = numericUserId;
            usuarioId = Guid.Parse($"00000000-0000-0000-0000-{numericUserId:000000000000}");
            return true;
        }

        if (Guid.TryParse(rawUserId, out usuarioId))
        {
            responsableId = 0;
            return true;
        }

        usuarioId = Guid.Empty;
        responsableId = 0;
        return false;
    }
}
