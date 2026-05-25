import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { obtenerMantenimientos, type MantenimientoDto } from '../../services/mantenimientoService';

interface MantenimientosPageProps {
  basePath: string; // Ej: '/lab' o '/admin'
}

export const MantenimientosPage = ({ basePath }: MantenimientosPageProps) => {
  const navigate = useNavigate();
  const [mantenimientos, setMantenimientos] = useState<MantenimientoDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const data = await obtenerMantenimientos();
      setMantenimientos(data);
    } catch (err: any) {
      console.error(err);
      setError('Error al cargar la lista de mantenimientos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const getStatusBadge = (estado: string) => {
    switch (estado) {
      case 'Abierto':
      case 'Pendiente':
        return <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">Pendiente</span>;
      case 'EnProceso':
        return <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">En Proceso</span>;
      case 'Completado':
        return <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">Completado</span>;
      case 'Cancelado':
        return <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">Cancelado</span>;
      case 'Reprogramado':
        return <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">Reprogramado</span>;
      default:
        return <span className="px-3 py-1 bg-slate-100 text-slate-800 rounded-full text-xs font-medium">{estado}</span>;
    }
  };

  const getPrioridadBadge = (prioridad: string | null) => {
    if (!prioridad) return null;
    switch (prioridad) {
      case 'Baja': return <span className="text-slate-500 font-medium text-sm">{prioridad}</span>;
      case 'Media': return <span className="text-blue-600 font-medium text-sm">{prioridad}</span>;
      case 'Alta': return <span className="text-orange-600 font-medium text-sm">{prioridad}</span>;
      case 'Urgente': return <span className="text-red-600 font-bold text-sm">{prioridad}</span>;
      default: return <span className="text-slate-600 font-medium text-sm">{prioridad}</span>;
    }
  };

  return (
    <section className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Gestión de Mantenimientos</h2>
          <p className="text-slate-500 mt-1">Controle y de seguimiento a las peticiones de mantenimiento de equipos.</p>
        </div>
        <button
          onClick={() => navigate(`${basePath}/mantenimientos/nuevo`)}
          className="px-5 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-lg font-medium shadow-md shadow-primary/20 transition-all flex items-center gap-2"
        >
          <span className="text-lg leading-none">+</span> Nueva Petición
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg border border-red-100">
          <p>{error}</p>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">ID</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">Equipo</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">Tipo</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">Prioridad</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">Fecha Prog.</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">Estado</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">Responsable</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-500">Cargando mantenimientos...</td>
                </tr>
              ) : mantenimientos.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-500">No hay mantenimientos registrados.</td>
                </tr>
              ) : (
                mantenimientos.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">#{m.id}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-slate-800">{m.equipo.numeroSerie}</span>
                        <span className="text-xs text-slate-500">{m.equipo.laboratorio}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{m.tipo}</td>
                    <td className="px-6 py-4">{getPrioridadBadge(m.prioridad)}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{m.fechaProgramada}</td>
                    <td className="px-6 py-4">{getStatusBadge(m.estado)}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{m.responsable || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};
