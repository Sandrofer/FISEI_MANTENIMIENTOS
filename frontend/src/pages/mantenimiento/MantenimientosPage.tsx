import { useEffect, useState } from 'react';
import { obtenerTodasLasOrdenes } from '../../services/mantenimientoService';

interface MantenimientosPageProps {
  onNuevoClick: () => void;
  onVerDetalle: (orden: any) => void;
}

export const MantenimientosPage = ({ onNuevoClick, onVerDetalle }: MantenimientosPageProps) => {
  const [ordenes, setOrdenes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const data = await obtenerTodasLasOrdenes();
      setOrdenes(data);
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

  const countPendientes = (orden: any) => {
    if (!orden.detallesMantenimientos) return 0;
    return orden.detallesMantenimientos.filter((d: any) => d.estadoIndividual === 'Pendiente' || d.estadoIndividual === 'En Proceso').length;
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4 md:p-6 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div>
          <h2 className="text-2xl font-bold text-primary tracking-tight">Gestión de Mantenimientos</h2>
          <p className="text-slate-500 mt-1">Controle y dé seguimiento a las peticiones de mantenimiento con múltiples equipos.</p>
        </div>
        <button
          onClick={onNuevoClick}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-md shadow-blue-600/20 transition-all flex items-center gap-2"
        >
          <span className="text-lg leading-none">+</span> Nueva Orden
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
                <th className="px-6 py-4 text-sm font-semibold text-primary">Código</th>
                <th className="px-6 py-4 text-sm font-semibold text-primary">Fecha Ingreso</th>
                <th className="px-6 py-4 text-sm font-semibold text-primary">Tipo</th>
                <th className="px-6 py-4 text-sm font-semibold text-primary">Estado General</th>
                <th className="px-6 py-4 text-sm font-semibold text-primary">Equipos Totales</th>
                <th className="px-6 py-4 text-sm font-semibold text-primary">Equipos Pendientes</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-slate-500">Cargando órdenes de mantenimiento...</td>
                </tr>
              ) : ordenes.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-slate-500">No hay órdenes registradas.</td>
                </tr>
              ) : (
                ordenes.map((orden) => (
                  <tr
                    key={orden.id}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    onClick={() => onVerDetalle(orden)}
                  >
                    <td className="px-6 py-4 font-bold text-slate-800">{orden.codigoCaso}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{new Date(orden.fechaIngreso).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{orden.tipoMantenimiento}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${orden.estadoGeneral === 'Cerrado' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                        {orden.estadoGeneral}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 font-bold text-center">{orden.detallesMantenimientos?.length || 0}</td>
                    <td className="px-6 py-4">
                      {countPendientes(orden) > 0 ? (
                        <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-bold">{countPendientes(orden)} Pendientes/Proceso</span>
                      ) : (
                        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-bold">Todo Finalizado</span>
                      )}
                    </td>
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

