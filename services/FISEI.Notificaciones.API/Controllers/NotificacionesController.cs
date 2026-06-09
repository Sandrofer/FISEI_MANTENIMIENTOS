using System.Security.Claims;
using FISEI.Notificaciones.API.Data;
using FISEI.Notificaciones.API.Hubs;
using FISEI.Notificaciones.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace FISEI.Notificaciones.API.Controllers;

[ApiController]
[Route("api/notificaciones")]
[Authorize]
public class NotificacionesController : ControllerBase
{
    private readonly NotificacionesDbContext _dbContext;
    private readonly IHubContext<NotificacionesHub> _hubContext;

    public NotificacionesController(NotificacionesDbContext dbContext, IHubContext<NotificacionesHub> hubContext)
    {
        _dbContext = dbContext;
        _hubContext = hubContext;
    }

    [HttpPost]
    [AllowAnonymous]
    public async Task<ActionResult<NotificacionResponseDto>> Crear([FromBody] CrearNotificacionRequestDto request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var notificacion = new Notificacion
        {
            UsuarioId = request.UsuarioId,
            CodigoCaso = request.CodigoCaso,
            EquipoId = request.EquipoId,
            Mensaje = request.Mensaje,
            Tipo = request.Tipo,
            Leido = false,
            FechaCreacion = DateTime.Now
        };

        _dbContext.Notificaciones.Add(notificacion);
        await _dbContext.SaveChangesAsync();

        var response = NotificacionResponseDto.FromEntity(notificacion);

        await _hubContext.Clients
            .Group($"user_{request.UsuarioId}")
            .SendAsync("RecibirNotificacion", response);

        return Created(string.Empty, response);
    }

    [HttpGet("mis-notificaciones")]
    public async Task<ActionResult<IEnumerable<NotificacionResponseDto>>> ObtenerMisNotificaciones()
    {
        var usuarioId = ObtenerUsuarioId();
        if (usuarioId is null)
        {
            return Unauthorized("Token invalido o sin identificador de usuario.");
        }

        var notificaciones = await _dbContext.Notificaciones
            .AsNoTracking()
            .Where(n => n.UsuarioId == usuarioId.Value && !n.Leido)
            .OrderByDescending(n => n.FechaCreacion)
            .Select(n => new NotificacionResponseDto(
                n.Id,
                n.UsuarioId,
                n.CodigoCaso,
                n.EquipoId,
                n.Mensaje,
                n.Tipo,
                n.Leido,
                n.FechaCreacion,
                n.FechaLectura))
            .ToListAsync();

        return Ok(notificaciones);
    }

    [HttpPatch("marcar-leidas")]
    public async Task<IActionResult> MarcarLeidas([FromBody] Guid[] ids)
    {
        var usuarioId = ObtenerUsuarioId();
        if (usuarioId is null)
        {
            return Unauthorized("Token invalido o sin identificador de usuario.");
        }

        if (ids.Length == 0)
        {
            return BadRequest("Debe enviar al menos una notificacion.");
        }

        var notificaciones = await _dbContext.Notificaciones
            .Where(n => n.UsuarioId == usuarioId.Value && ids.Contains(n.Id) && !n.Leido)
            .ToListAsync();

        var ahora = DateTime.Now;
        foreach (var notificacion in notificaciones)
        {
            notificacion.Leido = true;
            notificacion.FechaLectura = ahora;
        }

        await _dbContext.SaveChangesAsync();
        return NoContent();
    }

    private int? ObtenerUsuarioId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst("sub")?.Value;

        return int.TryParse(claim, out var usuarioId) ? usuarioId : null;
    }
}

public record CrearNotificacionRequestDto(
    int UsuarioId,
    string CodigoCaso,
    Guid EquipoId,
    string Mensaje,
    string Tipo);

public record NotificacionResponseDto(
    Guid Id,
    int UsuarioId,
    string CodigoCaso,
    Guid EquipoId,
    string Mensaje,
    string Tipo,
    bool Leido,
    DateTime? FechaCreacion,
    DateTime? FechaLectura)
{
    public static NotificacionResponseDto FromEntity(Notificacion notificacion)
    {
        return new NotificacionResponseDto(
            notificacion.Id,
            notificacion.UsuarioId,
            notificacion.CodigoCaso,
            notificacion.EquipoId,
            notificacion.Mensaje,
            notificacion.Tipo,
            notificacion.Leido,
            notificacion.FechaCreacion,
            notificacion.FechaLectura);
    }
}
