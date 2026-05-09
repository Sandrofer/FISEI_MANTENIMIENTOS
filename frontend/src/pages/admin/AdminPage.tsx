import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export const AdminPage = () => {
  const { usuario, cerrarSesion } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    cerrarSesion();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-blue-800">Panel Administrador</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">Bienvenido, {usuario?.nombre}</span>
            <button onClick={handleLogout} className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600">
              Cerrar sesión
            </button>
          </div>
        </div>
        <p className="text-gray-500">Módulos del sistema aparecerán aquí.</p>
      </div>
    </div>
  );
};