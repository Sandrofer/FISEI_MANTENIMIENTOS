import React, { useEffect, useState } from 'react';

import { obtenerOrdenPorId, actualizarEstadoDetalle } from '../../services/mantenimientoService';
import { obtenerEquipos } from '../../services/inventarioService';
import { getUsuarios } from '../../services/usuarioService';
import { useAuth } from '../../context/AuthContext';
import { ResolverModal } from './ResolverModal';

interface DetalleOrdenPageProps {
  ordenId: string;
  onVolver?: () => void;
  equipoEnfocadoId?: string | null;
}

export const DetalleOrdenPage: React.FC<DetalleOrdenPageProps> = ({ ordenId, onVolver, equipoEnfocadoId }) => {
  const [orden, setOrden] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mostrarConfirmacionCierre, setMostrarConfirmacionCierre] = useState(false);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const [mensajeError, setMensajeError] = useState<string | null>(null);

  const [modalResolverAbierto, setModalResolverAbierto] = useState(false);
  const [detalleAResolver, setDetalleAResolver] = useState<{ detalleId: string, equipoId: string, categoriaEquipo: string } | null>(null);

  const { usuario } = useAuth();

  // States for lookup data
  const [equipos, setEquipos] = useState<any[]>([]);
  const [usuarios, setUsuarios] = useState<any[]>([]);

  useEffect(() => {
    let activo = true;

    const fetchData = async (mostrarCarga = true) => {
      try {
        if (mostrarCarga) {
          setLoading(true);
        }
        // Fetch order, teams, and users concurrently
        const [ordenData, equiposData, usuariosData] = await Promise.all([
          obtenerOrdenPorId(ordenId),
          obtenerEquipos().catch(() => []), // Fallback to empty array if fails
          getUsuarios(1, 1000).catch(() => ({ datos: [] }))
        ]);

        if (activo) {
          setOrden(ordenData);
          setEquipos(equiposData);
          setUsuarios(usuariosData.datos || []);
        }
      } catch (err) {
        console.error(err);
        if (activo) {
          setError('No se pudo cargar la orden.');
        }
      } finally {
        if (activo && mostrarCarga) {
          setLoading(false);
        }
      }
    };

    fetchData();

    const onNotificacion = () => {
      void fetchData(false);
    };

    window.addEventListener('fisei:notificacion-recibida', onNotificacion);
    return () => {
      activo = false;
      window.removeEventListener('fisei:notificacion-recibida', onNotificacion);
    };
  }, [ordenId]);

  useEffect(() => {
    if (!loading && equipoEnfocadoId) {
      document
        .getElementById(`detalle-equipo-${equipoEnfocadoId}`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [equipoEnfocadoId, loading]);

  const getNombreEquipo = (equipoId: string) => {
    const equipo = equipos.find(e => String(e.id) === String(equipoId));
    if (equipo) {
      return equipo.nombreModelo || equipo.modelo || `Equipo ${equipo.numeroSerie || ''}`.trim();
    }
    return equipoId.substring(0, 8);
  };

  const getCategoriaEquipo = (equipoId: string) => {
    const equipo = equipos.find(e => String(e.id) === String(equipoId));
    if (equipo && equipo.categoria) {
      return equipo.categoria;
    }
    return 'Cómputo'; // fallback default
  };

  const getNombreUsuario = (usuarioId: number) => {
    const usuario = usuarios.find(u => Number(u.id) === Number(usuarioId));
    if (usuario) {
      return `${usuario.nombre} ${usuario.apellido}`.trim();
    }
    return `Usuario ID: ${usuarioId}`;
  };

  const handleEstadoChange = async (detalleId: string, nuevoEstado: string) => {
    const detallesAnteriores = [...orden.detallesMantenimientos];
    const ordenActualizada = { ...orden };

    const detalleIndex = ordenActualizada.detallesMantenimientos.findIndex((d: any) => d.id === detalleId);
    if (detalleIndex >= 0) {
      ordenActualizada.detallesMantenimientos[detalleIndex].estadoIndividual = nuevoEstado;
      setOrden(ordenActualizada);
    }

    try {
      const response = await actualizarEstadoDetalle(orden.id, detalleId, nuevoEstado);
      const ordenConFechas = { ...orden };
      ordenConFechas.detallesMantenimientos[detalleIndex] = response;
      setOrden(ordenConFechas);
    } catch (err) {
      console.error(err);
      setMensajeError('Error al actualizar el estado. Se revertirá al estado anterior.');
      setTimeout(() => setMensajeError(null), 5000);
      setOrden({ ...orden, detallesMantenimientos: detallesAnteriores });
    }
  };

  const handleCerrarOrden = () => {
    const equiposPendientes = orden.detallesMantenimientos?.filter(
      (d: any) => d.estadoIndividual !== 'Finalizado' && d.estadoIndividual !== 'No Reparado (De Baja)'
    );

    if (equiposPendientes && equiposPendientes.length > 0) {
      setMensajeError("No se puede cerrar la orden. Todos los equipos deben estar finalizados o dados de baja.");
      setTimeout(() => setMensajeError(null), 5000);
      return;
    }

    setMostrarConfirmacionCierre(true);
  };

  const confirmarCierreOrden = async () => {
    setMostrarConfirmacionCierre(false);
    try {
      setLoading(true);
      const res = await import('../../services/mantenimientoService').then(m => m.cerrarOrdenMaestra(orden.id));
      setOrden(res);
      setMensajeExito('Orden cerrada correctamente.');
      setTimeout(() => setMensajeExito(null), 5000);
    } catch (err) {
      console.error(err);
      setMensajeError('Error al cerrar la orden.');
      setTimeout(() => setMensajeError(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeColor = (estado: string) => {
    switch (estado) {
      case 'Pendiente': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'En Proceso': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Finalizado': return 'bg-green-100 text-green-800 border-green-200';
      case 'No Reparado (De Baja)': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getGeneralStatusBadge = (estado: string) => {
    const isCerrado = estado === 'Cerrado';
    if (isCerrado) return <span className="px-3.5 py-1.5 bg-red-100 text-red-800 rounded-md text-xs font-bold uppercase tracking-wider flex items-center gap-2 w-max shadow-sm border border-red-200"><span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span> CERRADO</span>;
    return <span className="px-3.5 py-1.5 bg-blue-100 text-blue-800 rounded-md text-xs font-bold uppercase tracking-wider flex items-center gap-2 w-max shadow-sm border border-blue-200"><span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span> ABIERTO</span>;
  };

  const estadosPermitidos = ['Pendiente', 'En Proceso', 'Finalizado', 'No Reparado (De Baja)'];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !orden) {
    return (
      <div className="w-full max-w-5xl mx-auto p-4 md:p-6 pb-20">
        <div className="bg-red-50 text-red-700 p-6 rounded-xl border border-red-100 shadow-sm flex flex-col items-center">
          <svg className="w-12 h-12 mb-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          <p className="font-semibold text-lg">{error || 'Orden no encontrada'}</p>
          {onVolver && (
            <button onClick={onVolver} className="mt-6 px-6 py-2.5 bg-white text-red-600 rounded-lg hover:bg-red-50 border border-red-200 font-medium transition-colors">Volver al listado</button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-4 md:p-6 pb-20 animate-fade-in relative">

      {/* SUCCESS TOAST */}
      {mensajeExito && (
        <div className="fixed top-4 right-4 z-50 animate-fade-in flex items-center gap-3 bg-green-50 border-l-4 border-green-500 p-4 rounded shadow-lg">
          <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          <div>
            <h3 className="text-sm font-bold text-green-800">¡Éxito!</h3>
            <p className="text-sm text-green-700">{mensajeExito}</p>
          </div>
          <button onClick={() => setMensajeExito(null)} className="ml-4 text-green-600 hover:text-green-800">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      )}

      {/* ERROR TOAST */}
      {mensajeError && (
        <div className="fixed top-4 right-4 z-50 animate-fade-in flex items-center gap-3 bg-red-50 border-l-4 border-red-500 p-4 rounded shadow-lg">
          <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <div>
            <h3 className="text-sm font-bold text-red-800">Atención</h3>
            <p className="text-sm text-red-700">{mensajeError}</p>
          </div>
          <button onClick={() => setMensajeError(null)} className="ml-4 text-red-600 hover:text-red-800">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      )}

      {/* CONFIRMATION MODAL */}
      {mostrarConfirmacionCierre && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-slate-200">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600 shrink-0">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">Cerrar Orden de Mantenimiento</h3>
                <p className="text-sm text-slate-500 mt-1">¿Está seguro de cerrar esta orden? Una vez cerrada, <strong>no podrá realizar más cambios</strong> ni modificar el estado de los equipos asignados.</p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={() => setMostrarConfirmacionCierre(false)}
                className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarCierreOrden}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 shadow-md transition-colors flex items-center gap-2"
              >
                Sí, cerrar orden
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ACTION BAR SUPERIOR */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        {onVolver && (
          <button
            onClick={onVolver}
            className="group flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors font-semibold text-sm bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm hover:shadow"
          >
            <svg className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Volver al listado
          </button>
        )}

        <div className="flex items-center gap-3">
          {orden.estadoGeneral === 'Abierto' && (
            <button onClick={handleCerrarOrden} className="px-4 py-2 bg-red-600 text-white rounded-lg shadow-md hover:bg-red-700 font-medium text-sm flex items-center gap-2 transition-all">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              Cerrar Orden
            </button>
          )}
          <button onClick={() => alert('Función de reporte en desarrollo')} className="px-4 py-2 bg-primary text-white rounded-lg shadow-md hover:bg-primary/90 font-medium text-sm flex items-center gap-2 transition-all">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
            Generar Reporte
          </button>
        </div>
      </div>

      {/* HEADER DASHBOARD CARD */}
      <div className="bg-white rounded-t-2xl shadow-sm border border-slate-200 border-b-0 overflow-hidden">
        <div className="p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-gradient-to-r from-white to-slate-50">
          <div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
              Caso de Mantenimiento
            </p>
            <h2 className="text-4xl md:text-5xl font-black text-slate-800 tracking-tight">
              {orden.codigoCaso}
            </h2>
            <div className="flex items-center gap-2 mt-4 text-slate-500 text-sm font-medium">
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              Registrado el {new Date(orden.fechaIngreso).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>

          <div className="flex flex-col items-start md:items-end gap-5 w-full md:w-auto">
            <div className="flex flex-col gap-1.5 items-start md:items-end w-full">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Estado Actual</span>
              {getGeneralStatusBadge(orden.estadoGeneral)}
            </div>
          </div>
        </div>
      </div>

      {/* MAIN UNIFIED CONTENT CARD */}
      <div className="bg-white rounded-b-2xl shadow-sm border border-slate-200 p-6 md:p-10 mb-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-10">

          {/* COLUMNA IZQUIERDA */}
          <div className="space-y-10">
            {/* INFORMACION GENERAL */}
            <div>
              <h3 className="text-sm font-bold text-primary uppercase tracking-widest mb-6 flex items-center gap-2 border-b border-slate-100 pb-4">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Información del Caso
              </h3>

              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Tipo de Mantenimiento</span>
                    <span className="font-bold text-slate-800">{orden.tipoMantenimiento}</span>
                  </div>
                  <div className="flex flex-col bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Equipos Involucrados</span>
                    <span className="font-bold text-slate-800">{orden.detallesMantenimientos?.length || 0} equipos</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* COLUMNA DERECHA */}
          <div className="space-y-10">
            {/* DESCRIPCIÓN */}
            <div>
              <h3 className="text-sm font-bold text-primary uppercase tracking-widest mb-6 flex items-center gap-2 border-b border-slate-100 pb-4">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" /></svg>
                Descripción General
              </h3>

              {orden.descripcionGeneral ? (
                <div className="bg-slate-50 border-l-4 border-slate-400 p-5 rounded-r-xl min-h-[100px]">
                  <p className="text-slate-700 leading-relaxed font-medium">
                    "{orden.descripcionGeneral}"
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-6 px-4 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 min-h-[100px]">
                  <p className="text-slate-400 font-medium">Sin descripción registrada.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* EQUIPOS TABLE */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-8 py-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" /></svg>
            Equipos Asignados
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white border-b border-slate-100">
                <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Equipo</th>
                <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Técnico Asignado</th>
                <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Inicio / Fin</th>
                <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Estado Técnico</th>
                <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 bg-white">
              {orden.detallesMantenimientos?.map((detalle: any) => {
                const equipoEnfocado = equipoEnfocadoId && String(detalle.equipoId) === String(equipoEnfocadoId);

                return (
                  <tr
                    id={`detalle-equipo-${detalle.equipoId}`}
                    key={detalle.id}
                    className={`${equipoEnfocado ? 'bg-red-50/80 ring-2 ring-inset ring-red-200' : 'hover:bg-slate-50/50'} transition-colors`}
                  >
                    <td className="px-8 py-4">
                      <span className={`text-sm font-bold font-mono px-2 py-1 rounded border ${equipoEnfocado ? 'bg-white text-red-800 border-red-200' : 'bg-slate-100 text-slate-800 border-slate-200'}`} title={`ID: ${detalle.equipoId}`}>
                        {getNombreEquipo(detalle.equipoId)}
                      </span>
                      {equipoEnfocado && (
                        <span className="ml-2 inline-flex rounded-full bg-red-100 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-red-800">
                          Asignado
                        </span>
                      )}
                    </td>
                    <td className="px-8 py-4">
                      <span className="text-sm font-medium text-slate-600" title={`ID Usuario: ${detalle.laboratoristaAsignadoId}`}>
                        {getNombreUsuario(detalle.laboratoristaAsignadoId)}
                      </span>
                    </td>
                    <td className="px-8 py-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                          <span className="text-xs font-medium text-slate-500">Inicio: {detalle.fechaInicio ? new Date(detalle.fechaInicio).toLocaleDateString() : '-'}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-green-400"></span>
                          <span className="text-xs font-medium text-slate-500">Fin: {detalle.fechaFin ? new Date(detalle.fechaFin).toLocaleDateString() : '-'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-4">
                      <div className="flex items-center gap-3">
                        <select
                          value={detalle.estadoIndividual}
                          onChange={(e) => handleEstadoChange(detalle.id, e.target.value)}
                          className="border border-slate-200 rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 bg-white hover:border-primary focus:ring-2 focus:ring-primary/20 outline-none shadow-sm cursor-pointer transition-all appearance-none pr-8 relative disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-50"
                          disabled={orden.estadoGeneral === 'Cerrado' || detalle.estadoIndividual === 'Finalizado' || detalle.estadoIndividual === 'No Reparado (De Baja)'}
                          style={{
                            backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                            backgroundPosition: `right 0.5rem center`,
                            backgroundRepeat: `no-repeat`,
                            backgroundSize: `1.5em 1.5em`
                          }}
                        >
                          {estadosPermitidos.map((est) => {
                            const idxActual = estadosPermitidos.indexOf(detalle.estadoIndividual);
                            const idxOp = estadosPermitidos.indexOf(est);
                            return (
                              <option key={est} value={est} disabled={idxOp < idxActual}>
                                {est}
                              </option>
                            );
                          })}
                        </select>

                        <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-wider uppercase border shadow-sm ${getStatusBadgeColor(detalle.estadoIndividual)}`}>
                          {detalle.estadoIndividual}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-4">
                      {usuario?.rol === 'Laboratorista' && detalle.laboratoristaAsignadoId === usuario?.userId && detalle.estadoIndividual !== 'Finalizado' && detalle.estadoIndividual !== 'No Reparado (De Baja)' && (
                        <button
                          onClick={() => {
                            setDetalleAResolver({
                              detalleId: detalle.id,
                              equipoId: detalle.equipoId,
                              categoriaEquipo: getCategoriaEquipo(detalle.equipoId)
                            });
                            setModalResolverAbierto(true);
                          }}
                          className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg font-medium shadow-md transition-all text-xs flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
                          Resolver
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {(!orden.detallesMantenimientos || orden.detallesMantenimientos.length === 0) && (
                <tr>
                  <td colSpan={5} className="px-8 py-10 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-slate-400">
                      <svg className="w-10 h-10 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
                      <span className="font-medium text-sm">No hay equipos asignados a esta orden.</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* RESOLVER MODAL */}
      {modalResolverAbierto && detalleAResolver && (
        <ResolverModal
          ordenId={ordenId}
          detalleId={detalleAResolver.detalleId}
          categoriaEquipo={detalleAResolver.categoriaEquipo}
          onClose={() => setModalResolverAbierto(false)}
          onSuccess={() => {
            setModalResolverAbierto(false);
            setMensajeExito("Mantenimiento resuelto correctamente.");
            obtenerOrdenPorId(ordenId).then(setOrden);
          }}
        />
      )}
    </div>
  );
};

