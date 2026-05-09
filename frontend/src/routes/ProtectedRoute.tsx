import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '../context/AuthContext';

interface Props {
  children: ReactNode;
  rolesPermitidos?: string[];
}

export const ProtectedRoute = ({ children, rolesPermitidos }: Props) => {
  const { usuario } = useAuth();

  if (!usuario) return <Navigate to="/login" replace />;

  if (rolesPermitidos && !rolesPermitidos.includes(usuario.rol))
    return <Navigate to="/sin-acceso" replace />;

  return children;
};