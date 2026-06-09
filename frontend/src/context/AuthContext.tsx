import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { LoginResponse } from '../types/auth';
import { signalRService } from '../services/signalRService';
import { FORCE_REAUTH_STORAGE_KEY } from '../services/authService';

const STORAGE_TOKEN_KEY = 'fisei_token';
const STORAGE_NAME_KEY = 'fisei_nombre';
const STORAGE_ROLE_KEY = 'fisei_rol';

interface AuthContextType {
  usuario: LoginResponse | null;
  guardarSesion: (data: LoginResponse) => void;
  cerrarSesion: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [usuario, setUsuario] = useState<LoginResponse | null>(() => {
    const token = localStorage.getItem(STORAGE_TOKEN_KEY);
    const nombre = localStorage.getItem(STORAGE_NAME_KEY);
    const rol = localStorage.getItem(STORAGE_ROLE_KEY);
    if (token && nombre && rol) return { token, nombre, rol, userId: obtenerUserIdDesdeToken(token) };
    return null;
  });

  useEffect(() => {
    const rolesConNotificaciones = ['Laboratorista', 'Administrador'];

    if (usuario?.rol && rolesConNotificaciones.includes(usuario.rol) && usuario.userId && usuario.token) {
      let activo = true;
      signalRService.conectar(usuario.userId, usuario.token).catch((error) => {
        if (activo) {
          console.error('No se pudo conectar a SignalR de notificaciones', error);
        }
      });
      return () => {
        activo = false;
        signalRService.desconectar().catch((error) => {
          console.error('No se pudo desconectar SignalR de notificaciones', error);
        });
      };
    }

    signalRService.desconectar().catch((error) => {
      console.error('No se pudo desconectar SignalR de notificaciones', error);
    });
  }, [usuario]);

  const guardarSesion = (data: LoginResponse) => {
    localStorage.setItem(STORAGE_TOKEN_KEY, data.token);
    localStorage.setItem(STORAGE_NAME_KEY, data.nombre);
    localStorage.setItem(STORAGE_ROLE_KEY, data.rol);
    setUsuario({ ...data, userId: data.userId ?? obtenerUserIdDesdeToken(data.token) });
  };

  const cerrarSesion = () => {
    localStorage.removeItem(STORAGE_TOKEN_KEY);
    localStorage.removeItem(STORAGE_NAME_KEY);
    localStorage.removeItem(STORAGE_ROLE_KEY);
    localStorage.setItem(FORCE_REAUTH_STORAGE_KEY, '1');
    signalRService.desconectar().catch((error) => {
      console.error('No se pudo desconectar SignalR de notificaciones', error);
    });
    setUsuario(null);
  };

  return (
    <AuthContext.Provider value={{ usuario, guardarSesion, cerrarSesion }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
};

const obtenerUserIdDesdeToken = (token: string): number | undefined => {
  const [, payload] = token.split('.');
  if (!payload) return undefined;

  try {
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    const json = JSON.parse(decodeURIComponent(
      decoded.split('').map((c) => `%${('00' + c.charCodeAt(0).toString(16)).slice(-2)}`).join('')
    ));
    const id = json.sub
      ?? json.nameid
      ?? json["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"];

    const parsed = Number(id);
    return Number.isFinite(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
};
