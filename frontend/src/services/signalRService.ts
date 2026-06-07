import * as signalR from '@microsoft/signalr';
import toast from 'react-hot-toast';

export interface NotificacionDto {
  id: string;
  usuarioId: number;
  codigoCaso: string;
  equipoId: string;
  mensaje: string;
  tipo: string;
  leido: boolean;
  fechaCreacion: string | null;
  fechaLectura: string | null;
}

const HUB_URL = `${import.meta.env.VITE_NOTIFICACIONES_URL ?? 'http://localhost:5086'}/hubs/notificaciones`;

class SignalRService {
  private connection: signalR.HubConnection | null = null;
  private usuarioId: number | null = null;

  async conectar(usuarioId: number, token: string) {
    if (this.connection && this.usuarioId === usuarioId) {
      return;
    }

    await this.desconectar();
    this.usuarioId = usuarioId;

    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(HUB_URL, { accessTokenFactory: () => token })
      .withAutomaticReconnect()
      .build();

    this.connection.on('RecibirNotificacion', (notificacion: NotificacionDto) => {
      toast(notificacion.mensaje, {
        icon: notificacion.tipo === 'COMPLETADO' ? 'OK' : '!',
        duration: 5000
      });
      window.dispatchEvent(new CustomEvent('fisei:notificacion-recibida'));
    });

    this.connection.onreconnected(() => {
      if (this.usuarioId) {
        void this.connection?.invoke('JoinUserGroup', this.usuarioId.toString());
      }
    });

    await this.connection.start();
    await this.connection.invoke('JoinUserGroup', usuarioId.toString());
  }

  async desconectar() {
    if (!this.connection) {
      return;
    }

    const usuarioId = this.usuarioId;
    const connection = this.connection;
    this.connection = null;
    this.usuarioId = null;

    try {
      if (usuarioId && connection.state === signalR.HubConnectionState.Connected) {
        await connection.invoke('LeaveUserGroup', usuarioId.toString());
      }
    } finally {
      await connection.stop();
    }
  }
}

export const signalRService = new SignalRService();
