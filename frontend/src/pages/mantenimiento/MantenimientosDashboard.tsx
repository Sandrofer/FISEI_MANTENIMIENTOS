import { useState } from 'react';
import { MantenimientosPage } from './MantenimientosPage';
import { MantenimientoForm } from './MantenimientoForm';
import { MantenimientoDetalle } from './MantenimientoDetalle';
import type { MantenimientoDto } from '../../services/mantenimientoService';

interface MantenimientosDashboardProps {
  basePath: string;
}

export type VistaMantenimiento = 'lista' | 'crear' | 'detalle';

export const MantenimientosDashboard = ({ basePath }: MantenimientosDashboardProps) => {
  console.log(basePath); // Consume basePath
  const [vista, setVista] = useState<VistaMantenimiento>('lista');
  const [mantenimientoSeleccionado, setMantenimientoSeleccionado] = useState<MantenimientoDto | null>(null);

  const irACrear = () => {
    setVista('crear');
    setMantenimientoSeleccionado(null);
  };

  const irALista = () => {
    setVista('lista');
    setMantenimientoSeleccionado(null);
  };

  const verDetalle = (mantenimiento: MantenimientoDto) => {
    setMantenimientoSeleccionado(mantenimiento);
    setVista('detalle');
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {vista === 'lista' && (
        <MantenimientosPage 
          onNuevoClick={irACrear} 
          onVerDetalle={verDetalle} 
        />
      )}
      
      {vista === 'crear' && (
        <MantenimientoForm 
          onCancel={irALista} 
          onSuccess={irALista} 
        />
      )}

      {vista === 'detalle' && mantenimientoSeleccionado && (
        <MantenimientoDetalle 
          mantenimientoId={mantenimientoSeleccionado.id} 
          onVolver={irALista} 
        />
      )}
    </div>
  );
};
