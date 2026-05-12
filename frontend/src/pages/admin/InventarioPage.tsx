import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AxiosError } from 'axios';
import { obtenerEquipos } from '../../services/inventarioService';
import type { Equipo } from '../../services/inventarioService';

export const InventarioPage = () => {
  const navigate = useNavigate();
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cargarEquipos = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await obtenerEquipos();
        setEquipos(data);
      } catch (err) {
        const axiosError = err as AxiosError;
        setError(axiosError.response ? 'No se pudo cargar el inventario.' : 'No hay conexión con el servicio de inventario.');
      } finally {
        setLoading(false);
      }
    };

    cargarEquipos();
  }, []);

  if (loading) {
    return <div className="text-gray-600">Cargando inventario...</div>;
  }

  if (error) {
    return <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">{error}</div>;
  }

  return (
    <section className="text-left">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-blue-800">Inventario</h2>
          <p className="text-gray-500">Equipos registrados en el sistema.</p>
        </div>
        <button
          onClick={() => navigate('/admin/registrar-equipo')}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg transition"
        >
          Registrar equipo
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Serie</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Equipo</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Laboratorio</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Estado</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {equipos.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                  No hay equipos registrados.
                </td>
              </tr>
            ) : (
              equipos.map((equipo) => (
                <tr key={equipo.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-700 font-medium">{equipo.numeroSerie}</td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-gray-800">{equipo.marca} {equipo.modelo}</div>
                    <div className="text-sm text-gray-500">{equipo.procesador}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{equipo.laboratorio}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex rounded-full bg-green-50 text-green-700 px-3 py-1 text-sm font-medium">
                      {equipo.estado}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => navigate(`/admin/inventario/${equipo.id}/hoja-vida`)}
                      className="bg-slate-800 hover:bg-slate-900 text-white px-3 py-2 rounded-lg text-sm font-semibold transition"
                    >
                      Ver hoja de vida
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};
