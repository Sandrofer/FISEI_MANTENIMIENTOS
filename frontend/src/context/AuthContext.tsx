import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type { LoginResponse } from '../types/auth';

interface AuthContextType {
  usuario: LoginResponse | null;
  guardarSesion: (data: LoginResponse) => void;
  cerrarSesion: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [usuario, setUsuario] = useState<LoginResponse | null>(() => {
    const token = sessionStorage.getItem('token');
    const nombre = sessionStorage.getItem('nombre');
    const rol = sessionStorage.getItem('rol');
    if (token && nombre && rol) return { token, nombre, rol };
    return null;
  });

  const guardarSesion = (data: LoginResponse) => {
    sessionStorage.setItem('token', data.token);
    sessionStorage.setItem('nombre', data.nombre);
    sessionStorage.setItem('rol', data.rol);
    setUsuario(data);
  };

  const cerrarSesion = () => {
    sessionStorage.clear();
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