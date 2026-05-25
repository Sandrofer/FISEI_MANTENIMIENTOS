import { useEffect, useState } from 'react';
import { obtenerMantenimientoPorId, type MantenimientoDto } from '../../services/mantenimientoService';

interface MantenimientoDetalleProps {
  mantenimientoId: number;
  onVolver: () => void;
}

export const MantenimientoDetalle = ({ mantenimientoId, onVolver }: MantenimientoDetalleProps) => {
  const [mantenimiento, setMantenimiento] = useState<MantenimientoDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDetalle = async () => {
      try {
        setLoading(true);
        const data = await obtenerMantenimientoPorId(mantenimientoId);
        setMantenimiento(data);
      } catch (err) {
        console.error(err);
        setError('No se pudo cargar el detalle del mantenimiento.');
      } finally {
        setLoading(false);
      }
    };
    fetchDetalle();
  }, [mantenimientoId]);

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Cargando detalles...</div>;
  }

  if (error || !mantenimiento) {
    return (
      <div className="p-8">
        <div className="bg-red-50 text-red-700 p-4 rounded-lg">{error || 'Mantenimiento no encontrado'}</div>
        <button onClick={onVolver} className="mt-4 px-4 py-2 bg-slate-100 rounded-lg hover:bg-slate-200">Volver</button>
      </div>
    );
  }

  const getStatusBadge = (estado: string) => {
    const isTerminado = estado === 'Completado' || estado === 'Terminado';
    if (isTerminado) return <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium flex items-center gap-1.5 w-max"><span className="w-1.5 h-1.5 rounded-full bg-green-600"></span> Terminado</span>;
    if (estado === 'EnProceso') return <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium flex items-center gap-1.5 w-max"><span className="w-1.5 h-1.5 rounded-full bg-yellow-600"></span> En Proceso</span>;
    if (estado === 'Pendiente') return <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium flex items-center gap-1.5 w-max"><span className="w-1.5 h-1.5 rounded-full bg-orange-600"></span> Pendiente</span>;
    return <span className="px-3 py-1 bg-slate-100 text-slate-800 rounded-full text-xs font-medium w-max">{estado}</span>;
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 md:p-6 pb-20">
      <button 
        onClick={onVolver}
        className="mb-6 flex items-center gap-2 text-slate-500 hover:text-primary transition-colors font-medium text-sm"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
        Volver a la lista
      </button>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-slate-50 border-b border-slate-200 p-6 flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold text-slate-800">
                Detalle de Petición MT-{mantenimiento.id.toString().padStart(4, '0')}
              </h2>
              {getStatusBadge(mantenimiento.estado)}
            </div>
            <p className="text-slate-500 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              Creado el {new Date(mantenimiento.fechaCreacion).toLocaleDateString()}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-500">Prioridad</p>
            <p className="font-bold text-slate-800">{mantenimiento.prioridad}</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
          
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">Información del Equipo</h3>
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
                <p className="font-bold text-slate-800 mb-1">{mantenimiento.equipo.numeroSerie}</p>
                <p className="text-sm text-slate-600 mb-1">Ubicación: <span className="font-medium text-slate-800">{mantenimiento.equipo.laboratorio}</span></p>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">Detalles del Mantenimiento</h3>
              <ul className="space-y-3">
                <li className="flex flex-col">
                  <span className="text-sm text-slate-500">Tipo</span>
                  <span className="font-medium text-slate-800">{mantenimiento.tipo}</span>
                </li>
                <li className="flex flex-col">
                  <span className="text-sm text-slate-500">Técnico Responsable</span>
                  <span className="font-medium text-slate-800">{mantenimiento.responsable || 'No asignado'}</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">Fechas</h3>
              <ul className="space-y-3">
                <li className="flex flex-col">
                  <span className="text-sm text-slate-500">Fecha Programada</span>
                  <span className="font-medium text-slate-800">{mantenimiento.fechaProgramada}</span>
                </li>
                {mantenimiento.fechaRealizada && (
                  <li className="flex flex-col">
                    <span className="text-sm text-slate-500">Fecha Realizada</span>
                    <span className="font-medium text-slate-800">{mantenimiento.fechaRealizada}</span>
                  </li>
                )}
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">Observaciones Iniciales</h3>
              <p className="text-slate-700 bg-slate-50 p-4 rounded-lg border border-slate-100 italic">
                {mantenimiento.observaciones || 'No hay observaciones registradas.'}
              </p>
            </div>
          </div>

        </div>

        {/* Technical Data (if completed) */}
        {(mantenimiento.diagnostico || mantenimiento.accionesRealizadas) && (
          <div className="p-6 border-t border-slate-100 bg-slate-50">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Reporte Técnico</h3>
            <div className="space-y-4">
              {mantenimiento.diagnostico && (
                <div>
                  <span className="text-sm font-medium text-slate-500 block mb-1">Diagnóstico:</span>
                  <p className="text-slate-800">{mantenimiento.diagnostico}</p>
                </div>
              )}
              {mantenimiento.accionesRealizadas && (
                <div>
                  <span className="text-sm font-medium text-slate-500 block mb-1">Acciones Realizadas:</span>
                  <p className="text-slate-800">{mantenimiento.accionesRealizadas}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
