import React, { useEffect, useState } from 'react';
import { obtenerOrdenPorId, actualizarEstadoDetalle } from '../../services/mantenimientoService';

interface DetalleOrdenPageProps {
  ordenId: string;
  onVolver?: () => void;
}

export const DetalleOrdenPage: React.FC<DetalleOrdenPageProps> = ({ ordenId, onVolver }) => {
  const [orden, setOrden] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrden = async () => {
      try {
        setLoading(true);
        const data = await obtenerOrdenPorId(ordenId);
        setOrden(data);
      } catch (err) {
        console.error(err);
        setError('No se pudo cargar la orden.');
      } finally {
        setLoading(false);
      }
    };
    fetchOrden();
  }, [ordenId]);

  const handleEstadoChange = async (detalleId: string, nuevoEstado: string) => {
    // Actualización optimista
    const detallesAnteriores = [...orden.detallesMantenimientos];
    const ordenActualizada = { ...orden };
    
    const detalleIndex = ordenActualizada.detallesMantenimientos.findIndex((d: any) => d.id === detalleId);
    if (detalleIndex >= 0) {
      ordenActualizada.detallesMantenimientos[detalleIndex].estadoIndividual = nuevoEstado;
      setOrden(ordenActualizada);
    }

    try {
      const response = await actualizarEstadoDetalle(orden.id, detalleId, nuevoEstado);
      // Actualizamos con los datos reales del backend si hubo cambio en fechas (ej: FechaInicio, FechaFin)
      const ordenConFechas = { ...orden };
      ordenConFechas.detallesMantenimientos[detalleIndex] = response;
      setOrden(ordenConFechas);
    } catch (err) {
      console.error(err);
      alert('Error al actualizar el estado. Se revertirá al estado anterior.');
      // Revertir
      setOrden({ ...orden, detallesMantenimientos: detallesAnteriores });
    }
  };

  const handleCerrarOrden = async () => {
    if (!window.confirm('¿Está seguro de cerrar esta orden? Ya no podrá realizar cambios.')) return;
    try {
      setLoading(true);
      const res = await import('../../services/mantenimientoService').then(m => m.cerrarOrdenMaestra(orden.id));
      setOrden(res);
      alert('Orden cerrada correctamente.');
    } catch (err) {
      console.error(err);
      alert('Error al cerrar la orden.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeColor = (estado: string) => {
    switch (estado) {
      case 'Pendiente': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'En Proceso': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Finalizado': return 'bg-green-100 text-green-800 border-green-200';
      case 'No Reparado (De Baja)': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const estadosPermitidos = ['Pendiente', 'En Proceso', 'Finalizado', 'No Reparado (De Baja)'];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600"></div>
      </div>
    );
  }

  if (error || !orden) {
    return (
      <div className="container mx-auto p-4 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="bg-red-50 text-red-700 p-8 rounded-2xl shadow-lg flex flex-col items-center">
          <svg className="w-16 h-16 mb-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          <h2 className="text-2xl font-bold mb-4">{error || 'Orden no encontrada'}</h2>
          {onVolver && (
            <button onClick={onVolver} className="px-6 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors">Volver</button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Panel de Orden: {orden.codigoCaso}</h1>
        <div className="flex gap-2">
          {orden.estadoGeneral === 'Abierto' && (
            <button onClick={handleCerrarOrden} className="px-4 py-2 bg-red-600 text-white border border-red-700 rounded shadow-sm hover:bg-red-700 font-medium">
              Cerrar Orden
            </button>
          )}
          {onVolver && (
            <button onClick={onVolver} className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded shadow-sm hover:bg-gray-100 font-medium">
              &larr; Volver
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="flex flex-col">
            <span className="text-sm font-bold text-gray-400 uppercase">Fecha de Ingreso</span>
            <span className="text-lg font-semibold text-gray-800">{new Date(orden.fechaIngreso).toLocaleDateString()}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-gray-400 uppercase">Tipo</span>
            <span className="text-lg font-semibold text-gray-800">{orden.tipoMantenimiento}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-gray-400 uppercase">Estado General</span>
            <span className={`text-lg font-semibold ${orden.estadoGeneral === 'Cerrado' ? 'text-red-600' : 'text-green-600'}`}>
              {orden.estadoGeneral}
            </span>
          </div>
          {orden.estadoGeneral === 'Cerrado' && orden.fechaCierre && (
            <div className="flex flex-col">
              <span className="text-sm font-bold text-gray-400 uppercase">Fecha Cierre</span>
              <span className="text-lg font-semibold text-gray-800">{new Date(orden.fechaCierre).toLocaleString()}</span>
            </div>
          )}
          <div className="flex flex-col md:col-span-4">
            <span className="text-sm font-bold text-gray-400 uppercase">Descripción General</span>
            <span className="text-lg font-medium text-gray-700">{orden.descripcionGeneral || 'N/A'}</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-xl font-bold text-gray-800">Equipos Asignados</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-white">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Equipo ID</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Laboratorista ID</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Inicio / Fin</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Estado</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {orden.detallesMantenimientos?.map((detalle: any) => (
                <tr key={detalle.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 truncate max-w-[150px]" title={detalle.equipoId}>
                    {detalle.equipoId.substring(0, 8)}...
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 truncate max-w-[150px]" title={detalle.laboratoristaAsignadoId}>
                    {detalle.laboratoristaAsignadoId.substring(0, 8)}...
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    <div className="flex flex-col">
                      <span className="text-xs">Inicio: {detalle.fechaInicio ? new Date(detalle.fechaInicio).toLocaleDateString() : '-'}</span>
                      <span className="text-xs">Fin: {detalle.fechaFin ? new Date(detalle.fechaFin).toLocaleDateString() : '-'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex items-center gap-3">
                      <select
                        value={detalle.estadoIndividual}
                        onChange={(e) => handleEstadoChange(detalle.id, e.target.value)}
                        className="border border-gray-300 rounded px-2 py-1.5 text-sm font-medium text-gray-700 bg-white focus:ring-2 focus:ring-blue-500 outline-none shadow-sm cursor-pointer"
                        disabled={detalle.estadoIndividual === 'Finalizado' || detalle.estadoIndividual === 'No Reparado (De Baja)'}
                      >
                        {estadosPermitidos.map((est) => {
                          // Lógica básica para no permitir retroceder
                          const idxActual = estadosPermitidos.indexOf(detalle.estadoIndividual);
                          const idxOp = estadosPermitidos.indexOf(est);
                          return (
                            <option key={est} value={est} disabled={idxOp < idxActual}>
                              {est}
                            </option>
                          );
                        })}
                      </select>
                      
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${getStatusBadgeColor(detalle.estadoIndividual)}`}>
                        {detalle.estadoIndividual}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {(!orden.detallesMantenimientos || orden.detallesMantenimientos.length === 0) && (
            <div className="p-8 text-center text-gray-500 font-medium">No hay equipos asignados a esta orden.</div>
          )}
        </div>
      </div>
    </div>
  );
};
