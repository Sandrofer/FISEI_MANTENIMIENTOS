using System.Net.Http.Json;

namespace FISEI.Mantenimientos.API.Services;

public class NotificacionesClient : INotificacionesClient
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<NotificacionesClient> _logger;

    public NotificacionesClient(HttpClient httpClient, ILogger<NotificacionesClient> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
    }

    public Task EnviarAsignacionAsync(int usuarioId, string codigoCaso, Guid equipoId)
    {
        var mensaje = $"Se le ha asignado el caso {codigoCaso}.";
        return EnviarAsync(new CrearNotificacionRequest(usuarioId, codigoCaso, equipoId, mensaje, "ASIGNACION"));
    }

    public Task EnviarCompletadoAsync(int usuarioId, string codigoCaso, Guid equipoId)
    {
        var mensaje = $"El detalle del caso {codigoCaso} fue finalizado.";
        return EnviarAsync(new CrearNotificacionRequest(usuarioId, codigoCaso, equipoId, mensaje, "COMPLETADO"));
    }

    public Task EnviarCierreAsync(int usuarioId, string codigoCaso, Guid equipoId)
    {
        var mensaje = $"El caso {codigoCaso} fue cerrado.";
        return EnviarAsync(new CrearNotificacionRequest(usuarioId, codigoCaso, equipoId, mensaje, "CIERRE"));
    }

    public Task EnviarCambioEstadoAdminAsync(int usuarioId, string codigoCaso, Guid equipoId, string estado)
    {
        var tipo = estado switch
        {
            "En Proceso" => "ESTADO_EN_PROCESO",
            "Finalizado" => "ESTADO_FINALIZADO",
            "No Reparado (De Baja)" => "ESTADO_NO_REPARADO",
            _ => "CAMBIO_ESTADO"
        };

        var mensaje = $"El estado tecnico del caso {codigoCaso} cambio a {estado}.";
        return EnviarAsync(new CrearNotificacionRequest(usuarioId, codigoCaso, equipoId, mensaje, tipo));
    }

    private async Task EnviarAsync(CrearNotificacionRequest request)
    {
        try
        {
            var response = await _httpClient.PostAsJsonAsync("api/notificaciones", request);
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning(
                    "No se pudo enviar la notificacion {Tipo} para el caso {CodigoCaso}. StatusCode: {StatusCode}",
                    request.Tipo,
                    request.CodigoCaso,
                    response.StatusCode);
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(
                ex,
                "No se pudo contactar el microservicio de notificaciones para el caso {CodigoCaso}.",
                request.CodigoCaso);
        }
    }
}

public record CrearNotificacionRequest(
    int UsuarioId,
    string CodigoCaso,
    Guid EquipoId,
    string Mensaje,
    string Tipo);
