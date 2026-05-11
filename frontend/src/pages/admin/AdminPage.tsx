import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { UsuariosPage } from './UsuariosPage';

export const AdminPage = () => {
  const { usuario, cerrarSesion } = useAuth();
  const navigate = useNavigate();
  const [seccion, setSeccion] = useState('inicio');

  const handleLogout = () => {
    cerrarSesion();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-blue-800 text-white flex flex-col">
        <div className="p-6 border-b border-blue-700">
          <h1 className="text-xl font-bold">FISEI</h1>
          <p className="text-blue-300 text-sm">Mantenimientos</p>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <button
            onClick={() => setSeccion('inicio')}
            className={`w-full text-left px-4 py-2 rounded-lg ${seccion === 'inicio' ? 'bg-blue-600' : 'hover:bg-blue-700'}`}
          >
             Inicio
          </button>
          <button
            onClick={() => setSeccion('usuarios')}
            className={`w-full text-left px-4 py-2 rounded-lg ${seccion === 'usuarios' ? 'bg-blue-600' : 'hover:bg-blue-700'}`}
          >
             Usuarios
          </button>
          <button
            onClick={() => navigate('/admin/registrar-equipo')}
            className="w-full text-left px-4 py-2 rounded-lg hover:bg-blue-700"
          >
             Registrar Equipo
          </button>
        </nav>
        <div className="p-4 border-t border-blue-700">
          <p className="text-sm text-blue-300 mb-2">{usuario?.nombre}</p>
          <button onClick={handleLogout} className="w-full bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 text-sm">
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Contenido */}
      <main className="flex-1 p-8">
        {seccion === 'inicio' && (
          <div>
            <h2 className="text-2xl font-bold text-blue-800 mb-4">Bienvenido, {usuario?.nombre} 👋</h2>
            <p className="text-gray-500 mb-6">Selecciona una opción del menú.</p>

            {/* Tarjetas de acceso rápido */}
            <div className="grid grid-cols-2 gap-4">
              <div
                onClick={() => setSeccion('usuarios')}
                className="bg-white rounded-xl shadow p-6 cursor-pointer hover:shadow-md border-l-4 border-blue-500"
              >
                <p className="text-3xl mb-2">👥</p>
                <h3 className="font-bold text-gray-800">Gestión de Usuarios</h3>
                <p className="text-sm text-gray-500">Crear y administrar usuarios del sistema</p>
              </div>

              <div
                onClick={() => navigate('/admin/registrar-equipo')}
                className="bg-white rounded-xl shadow p-6 cursor-pointer hover:shadow-md border-l-4 border-green-500"
              >
                <p className="text-3xl mb-2">💻</p>
                <h3 className="font-bold text-gray-800">Registrar Equipo</h3>
                <p className="text-sm text-gray-500">Registrar un equipo tecnológico individual</p>
              </div>
            </div>
          </div>
        )}
        {seccion === 'usuarios' && <UsuariosPage />}
      </main>
    </div>
  );
};