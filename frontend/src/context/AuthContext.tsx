import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type { LoginResponse } from '../types/auth';

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
    if (token && nombre && rol) return { token, nombre, rol };
    return null;
  });

  const guardarSesion = (data: LoginResponse) => {
    localStorage.setItem(STORAGE_TOKEN_KEY, data.token);
    localStorage.setItem(STORAGE_NAME_KEY, data.nombre);
    localStorage.setItem(STORAGE_ROLE_KEY, data.rol);
    setUsuario(data);
  };

  const cerrarSesion = () => {
    localStorage.removeItem(STORAGE_TOKEN_KEY);
    localStorage.removeItem(STORAGE_NAME_KEY);
    localStorage.removeItem(STORAGE_ROLE_KEY);
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