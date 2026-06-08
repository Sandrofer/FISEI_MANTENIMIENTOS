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
        return File(contenido, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "plantilla_equipos.xlsx");
    }

    [HttpPost("equipos/importar")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> ImportarEquipos([FromForm] IFormFile? archivo, [FromForm] bool importacionParcial, [FromForm] bool autoCrear, CancellationToken cancellationToken)
    {
        if (archivo is null) return BadRequest(new ImportacionEquiposResponseDto { Success = false, Errores = [new ErrorImportacionDto { Fila = 0, Campo = "Archivo", Mensaje = "Debe adjuntar un archivo .xlsx." }] });
        if (!TryGetUsuarioId(out var usuarioId)) return Unauthorized(new { success = false, mensaje = "No se pudo identificar el usuario." });
        try { var r = await _excelImportService.ImportarAsync(archivo, usuarioId, importacionParcial, autoCrear, cancellationToken); return r.Success ? Ok(r) : BadRequest(r); }
        catch (Exception ex) { return StatusCode(500, new ImportacionEquiposResponseDto { Success = false, Errores = [new ErrorImportacionDto { Fila = 0, Campo = "Archivo", Mensaje = ex.Message }] }); }
    }

    [HttpPost("equipos/validar-importacion")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> ValidarImportacion([FromForm] IFormFile? archivo, CancellationToken cancellationToken)
    {
        if (archivo is null) return BadRequest(new ResumenValidacionDto { Success = false, Mensaje = "Debe adjuntar un archivo." });
        try { return Ok(await _excelImportService.ValidarImportacionAsync(archivo, cancellationToken)); }
        catch (Exception ex) { return StatusCode(500, new ResumenValidacionDto { Success = false, Mensaje = ex.Message }); }
    }

    [HttpPost("individual")]
    public async Task<IActionResult> RegistrarEquipo([FromBody] CrearEquipoDto dto)
    {
        try { return Ok(await _service.RegistrarEquipoAsync(dto)); }
        catch (InvalidOperationException ex) { return Conflict(new { mensaje = ex.Message }); }
        catch (Exception ex) { return StatusCode(500, new { mensaje = "Error al registrar", detalle = ex.Message }); }
    }

    [HttpGet("equipos")]
    public async Task<ActionResult<List<EquipoResponseDto>>> ObtenerEquipos([FromQuery] string? estado) => Ok(await _service.ObtenerEquiposAsync(estado));

    [HttpGet("equipos/{id:guid}/hoja-vida")]
    public async Task<IActionResult> ObtenerHojaVidaEquipo(Guid id)
    {
        var h = await _service.ObtenerHojaVidaEquipoAsync(id);
        return h is null ? NotFound(new { message = "Equipo no encontrado" }) : Ok(h);
    }

    [HttpPut("equipos/{id:guid}")]
    public async Task<IActionResult> ActualizarEquipo(Guid id, [FromBody] ActualizarEquipoDto dto)
    {
        var r = await _service.ActualizarEquipoAsync(id, dto);
        return r is null ? NotFound(new { mensaje = "Equipo no encontrado" }) : Ok(r);
    }

    [HttpGet("categorias")]
    public async Task<IActionResult> GetCategorias() => Ok(await _service.ObtenerCategoriasAsync());

    [HttpGet("marcas")]
    public async Task<IActionResult> GetMarcas() => Ok(await _service.ObtenerMarcasAsync());

    [HttpGet("ubicaciones")]
    public async Task<IActionResult> GetUbicaciones() => Ok(await _service.ObtenerUbicacionesAsync());

    [HttpDelete("equipos/{id:guid}")]
    public async Task<IActionResult> EliminarEquipo(Guid id)
    {
        return await _service.EliminarEquipoAsync(id) ? Ok(new { mensaje = "Equipo eliminado" }) : NotFound(new { mensaje = "Equipo no encontrado" });
    }

    private bool TryGetUsuarioId(out int usuarioId)
    {
        if (TryReadUsuarioId(User.Claims, out usuarioId)) return true;
        var auth = Request.Headers.Authorization.ToString();
        if (!auth.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase)) { usuarioId = 0; return false; }
        try { return TryReadUsuarioId(new JwtSecurityTokenHandler().ReadJwtToken(auth["Bearer ".Length..].Trim()).Claims, out usuarioId); }
        catch { usuarioId = 0; return false; }
    }

    private static bool TryReadUsuarioId(IEnumerable<Claim> claims, out int usuarioId)
    {
        var ids = new HashSet<string>(StringComparer.OrdinalIgnoreCase) { "usuario_id", "user_id", "id", JwtRegisteredClaimNames.Sub, "sub", "nameid", ClaimTypes.NameIdentifier };
        var raw = claims.FirstOrDefault(c => ids.Contains(c.Type))?.Value;
        return int.TryParse(raw, out usuarioId) && usuarioId > 0;
    }
}