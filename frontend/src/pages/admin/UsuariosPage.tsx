import { useEffect, useState } from 'react';
import { getUsuarios, crearUsuario, actualizarRol } from '../../services/usuarioService';

interface Usuario {
  id: number;
  nombre: string;
  apellido: string;
  correo: string;
  rol: string;
  activo: boolean;
}

export const UsuariosPage = () => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [cargando, setCargando] = useState(false);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [mensaje, setMensaje] = useState('');

  const [form, setForm] = useState({
    nombre: '', apellido: '', correo: '', password: '', rol: 'Laboratorista'
  });

  const cargar = async () => {
    setCargando(true);
    try {
      const data = await getUsuarios(pagina);
      setUsuarios(data.datos);
      setTotal(data.total);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargar(); }, [pagina]);

  const handleCrear = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await crearUsuario(form);
      setMensaje('Usuario creado exitosamente');
      setMostrarForm(false);
      setForm({ nombre: '', apellido: '', correo: '', password: '', rol: 'Laboratorista' });
      cargar();
    } catch {
      setMensaje('Error al crear usuario');
    }
  };

  const handleRol = async (id: number, rolActual: string) => {
    const nuevoRol = rolActual === 'Administrador' ? 'Laboratorista' : 'Administrador';
    try {
      await actualizarRol(id, nuevoRol);
      setMensaje('Rol actualizado correctamente');
      cargar();
    } catch {
      setMensaje('Error al actualizar rol');
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-blue-800">Gestión de Usuarios</h2>
        <button
          onClick={() => setMostrarForm(!mostrarForm)}
          className="bg-blue-800 text-white px-4 py-2 rounded-lg hover:bg-blue-900"
        >
          {mostrarForm ? 'Cancelar' : '+ Nuevo Usuario'}
        </button>
      </div>

      {mensaje && (
        <div className="mb-4 p-3 bg-green-100 text-green-800 rounded-lg">
          {mensaje}
        </div>
      )}

      {mostrarForm && (
        <form onSubmit={handleCrear} className="bg-white p-6 rounded-xl shadow mb-6 grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
            <input
              className="w-full border rounded-lg px-3 py-2"
              value={form.nombre}
              onChange={e => setForm({...form, nombre: e.target.value})}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Apellido</label>
            <input
              className="w-full border rounded-lg px-3 py-2"
              value={form.apellido}
              onChange={e => setForm({...form, apellido: e.target.value})}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Correo</label>
            <input
              type="email"
              className="w-full border rounded-lg px-3 py-2"
              value={form.correo}
              onChange={e => setForm({...form, correo: e.target.value})}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
            <input
              type="password"
              className="w-full border rounded-lg px-3 py-2"
              value={form.password}
              onChange={e => setForm({...form, password: e.target.value})}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
            <select
              className="w-full border rounded-lg px-3 py-2"
              value={form.rol}
              onChange={e => setForm({...form, rol: e.target.value})}
            >
              <option value="Laboratorista">Laboratorista</option>
              <option value="Administrador">Administrador</option>
            </select>
          </div>
          <div className="flex items-end">
            <button type="submit" className="w-full bg-blue-800 text-white py-2 rounded-lg hover:bg-blue-900">
              Crear Usuario
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-blue-800 text-white">
            <tr>
              <th className="px-4 py-3 text-left">Nombre</th>
              <th className="px-4 py-3 text-left">Correo</th>
              <th className="px-4 py-3 text-left">Rol</th>
              <th className="px-4 py-3 text-left">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              <tr><td colSpan={4} className="text-center py-8 text-gray-500">Cargando...</td></tr>
            ) : usuarios.map(u => (
              <tr key={u.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-3">{u.nombre} {u.apellido}</td>
                <td className="px-4 py-3">{u.correo}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    u.rol === 'Administrador' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {u.rol}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => handleRol(u.id, u.rol)}
                    className="text-xs bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded-lg"
                  >
                    Cambiar a {u.rol === 'Administrador' ? 'Laboratorista' : 'Administrador'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-between items-center px-4 py-3 border-t">
          <span className="text-sm text-gray-500">Total: {total} usuarios</span>
          <div className="flex gap-2">
            <button
              onClick={() => setPagina(p => Math.max(1, p - 1))}
              disabled={pagina === 1}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Anterior
            </button>
            <span className="px-3 py-1">Página {pagina}</span>
            <button
              onClick={() => setPagina(p => p + 1)}
              disabled={pagina * 10 >= total}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};