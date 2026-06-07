import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MantenimientosPage } from './MantenimientosPage';
import { NuevaOrdenPage } from './NuevaOrdenPage';
import { DetalleOrdenPage } from './DetalleOrdenPage';

interface MantenimientosDashboardProps {
  basePath: string;
}

export type VistaMantenimiento = 'lista' | 'crear' | 'detalle';

export const MantenimientosDashboard = ({ basePath }: MantenimientosDashboardProps) => {
  console.log(basePath); // Consume basePath
  const [searchParams, setSearchParams] = useSearchParams();
  const [vista, setVista] = useState<VistaMantenimiento>('lista');
  const [mantenimientoSeleccionadoId, setMantenimientoSeleccionadoId] = useState<string | null>(null);
  const casoNotificacion = searchParams.get('caso');
  const equipoNotificacion = searchParams.get('equipo');

  useEffect(() => {
    if (casoNotificacion) {
      setVista('lista');
      setMantenimientoSeleccionadoId(null);
    }
  }, [casoNotificacion, equipoNotificacion]);

  const irACrear = () => {
    if (casoNotificacion || equipoNotificacion) {
      setSearchParams({}, { replace: true });
    }
    setVista('crear');
    setMantenimientoSeleccionadoId(null);
  };

  const irALista = () => {
    if (casoNotificacion || equipoNotificacion) {
      setSearchParams({}, { replace: true });
    }
    setVista('lista');
    setMantenimientoSeleccionadoId(null);
  };

  const verDetalle = useCallback((ordenId: string) => {
    setMantenimientoSeleccionadoId(ordenId);
    setVista('detalle');
  }, []);

  const equipoEnfocadoId = useMemo(() => equipoNotificacion, [equipoNotificacion]);

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {vista === 'lista' && (
        <MantenimientosPage 
          onNuevoClick={irACrear} 
          onVerDetalle={(m) => verDetalle(m.id?.toString() || m.codigoCaso || '')} 
          casoInicialCodigo={casoNotificacion}
        />
      )}
      
      {vista === 'crear' && (
        <div className="relative">
           <button onClick={irALista} className="absolute top-4 right-4 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded z-10">Volver a la lista</button>
           <NuevaOrdenPage />
        </div>
      )}

      {vista === 'detalle' && mantenimientoSeleccionadoId && (
        <DetalleOrdenPage 
          ordenId={mantenimientoSeleccionadoId} 
          onVolver={irALista} 
          equipoEnfocadoId={equipoEnfocadoId}
        />
      )}
    </div>
  );
};

