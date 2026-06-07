namespace FISEI.Mantenimientos.API.Services;

public interface INotificacionesClient
{
    Task EnviarAsignacionAsync(int usuarioId, string codigoCaso, Guid equipoId);

    Task EnviarCompletadoAsync(int usuarioId, string codigoCaso, Guid equipoId);

    Task EnviarCierreAsync(int usuarioId, string codigoCaso, Guid equipoId);
}
