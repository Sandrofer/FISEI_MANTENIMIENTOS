using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace FISEI.Notificaciones.API.Hubs;

[Authorize]
public class NotificacionesHub : Hub
{
    public Task JoinUserGroup(string usuarioId)
    {
        return Groups.AddToGroupAsync(Context.ConnectionId, $"user_{usuarioId}");
    }

    public Task LeaveUserGroup(string usuarioId)
    {
        return Groups.RemoveFromGroupAsync(Context.ConnectionId, $"user_{usuarioId}");
    }
}
