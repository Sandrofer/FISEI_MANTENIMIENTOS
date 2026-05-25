import { useEffect, useState } from 'react';
import { obtenerMantenimientos, type MantenimientoDto } from '../../services/mantenimientoService';

interface MantenimientosPageProps {
  onNuevoClick: () => void;
  onVerDetalle: (m: MantenimientoDto) => void;
}

export const MantenimientosPage = ({ onNuevoClick, onVerDetalle }: MantenimientosPageProps) => {
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
    const isTerminado = estado === 'Completado' || estado === 'Terminado';
    if (isTerminado) return <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium flex items-center gap-1.5 w-max"><span className="w-1.5 h-1.5 rounded-full bg-green-600"></span> Terminado</span>;
    if (estado === 'EnProceso') return <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium flex items-center gap-1.5 w-max"><span className="w-1.5 h-1.5 rounded-full bg-yellow-600"></span> En Proceso</span>;
    if (estado === 'Pendiente') return <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium flex items-center gap-1.5 w-max"><span className="w-1.5 h-1.5 rounded-full bg-orange-600"></span> Pendiente</span>;
    return <span className="px-3 py-1 bg-slate-100 text-slate-800 rounded-full text-xs font-medium w-max">{estado}</span>;
  };

  const getPrioridadBadge = (prioridad: string | null) => {
    if (!prioridad) return null;
    switch (prioridad) {
      case 'Baja': return <span className="text-slate-500 font-medium text-sm flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-slate-400"></span>{prioridad}</span>;
      case 'Media': return <span className="text-yellow-600 font-medium text-sm flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-yellow-400"></span>{prioridad}</span>;
      case 'Alta': return <span className="text-red-600 font-bold text-sm flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500"></span>{prioridad}</span>;
      default: return <span className="text-slate-600 font-medium text-sm">{prioridad}</span>;
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4 md:p-6 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div>
          <h2 className="text-2xl font-bold text-primary tracking-tight">Gestión de Mantenimientos</h2>
          <p className="text-slate-500 mt-1">Controle y de seguimiento a las peticiones de mantenimiento de equipos.</p>
        </div>
        <button
          onClick={onNuevoClick}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-md shadow-blue-600/20 transition-all flex items-center gap-2"
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
                <th className="px-6 py-4 text-sm font-semibold text-primary">ID</th>
                <th className="px-6 py-4 text-sm font-semibold text-primary">Equipo</th>
                <th className="px-6 py-4 text-sm font-semibold text-primary">Tipo</th>
                <th className="px-6 py-4 text-sm font-semibold text-primary">Prioridad</th>
                <th className="px-6 py-4 text-sm font-semibold text-primary">Fecha Prog.</th>
                <th className="px-6 py-4 text-sm font-semibold text-primary">Estado</th>
                <th className="px-6 py-4 text-sm font-semibold text-primary">Responsable</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-slate-500">Cargando mantenimientos...</td>
                </tr>
              ) : mantenimientos.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-slate-500">No hay mantenimientos registrados.</td>
                </tr>
              ) : (
                mantenimientos.map((m) => (
                  <tr 
                    key={m.id} 
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    onClick={() => onVerDetalle(m)}
                  >
                    <td className="px-6 py-4 text-sm font-medium text-slate-700">MT-{m.id.toString().padStart(4, '0')}</td>
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
                    <td className="px-6 py-4 text-right">
                      <span className="text-primary opacity-0 group-hover:opacity-100 transition-opacity font-medium text-sm">Ver detalles &gt;</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
