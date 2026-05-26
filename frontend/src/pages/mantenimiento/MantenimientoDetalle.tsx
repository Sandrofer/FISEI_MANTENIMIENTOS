import { useEffect, useState } from 'react';
import {
  actualizarMantenimiento,
  obtenerMantenimientoPorId,
  type ActualizarMantenimientoDto,
  type MantenimientoDto
} from '../../services/mantenimientoService';
import { getUsuarios } from '../../services/usuarioService';

interface MantenimientoDetalleProps {
  mantenimientoId: number;
  onVolver: () => void;
}

export const MantenimientoDetalle = ({ mantenimientoId, onVolver }: MantenimientoDetalleProps) => {
  const [mantenimiento, setMantenimiento] = useState<MantenimientoDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [editando, setEditando] = useState(false);
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [loadingUsuarios, setLoadingUsuarios] = useState(false);
  const [formData, setFormData] = useState<ActualizarMantenimientoDto>({
    tipo: '',
    responsable: '',
    prioridad: '',
    fechaProgramada: '',
    observaciones: ''
  });

  useEffect(() => {
    const fetchDetalle = async () => {
      try {
        setLoading(true);
        const data = await obtenerMantenimientoPorId(mantenimientoId);
        setMantenimiento(data);
        setFormData({
          tipo: data.tipo ?? 'Preventivo',
          responsable: data.responsable ?? '',
          prioridad: data.prioridad ?? 'Media',
          fechaProgramada: data.fechaProgramada,
          observaciones: data.observaciones ?? ''
        });
      } catch (err) {
        console.error(err);
        setError('No se pudo cargar el detalle del mantenimiento.');
      } finally {
        setLoading(false);
      }
    };
    fetchDetalle();
  }, [mantenimientoId]);

  useEffect(() => {
    const cargarUsuarios = async () => {
      try {
        setLoadingUsuarios(true);
        const response = await getUsuarios(1, 100);
        const laboratoristas = response.datos?.filter((u: any) => u.rol === 'Laboratorista') || [];
        setUsuarios(laboratoristas);
      } catch (err) {
        console.error('Error al cargar responsables', err);
      } finally {
        setLoadingUsuarios(false);
      }
    };

    cargarUsuarios();
  }, []);

  const handleGuardarEdicion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mantenimiento) return;

    try {
      setSaving(true);
      setEditError(null);
      await actualizarMantenimiento(mantenimiento.id, {
        ...formData,
        observaciones: formData.observaciones?.trim() || undefined
      });

      const actualizado = await obtenerMantenimientoPorId(mantenimiento.id);
      setMantenimiento(actualizado);
      setFormData({
        tipo: actualizado.tipo ?? 'Preventivo',
        responsable: actualizado.responsable ?? '',
        prioridad: actualizado.prioridad ?? 'Media',
        fechaProgramada: actualizado.fechaProgramada,
        observaciones: actualizado.observaciones ?? ''
      });
      setEditando(false);
    } catch (err) {
      console.error(err);
      const axiosError = err as any;
      const detalle = axiosError.response?.data?.mensaje
        || axiosError.response?.data?.title
        || axiosError.response?.data?.detalle
        || axiosError.message;
      setEditError(`No se pudo guardar la edicion del mantenimiento. ${detalle ?? ''}`.trim());
    } finally {
      setSaving(false);
    }
  };

  const responsableActualExiste = usuarios.some(
    (u) => `${u.nombre} ${u.apellido}` === formData.responsable
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !mantenimiento) {
    return (
      <div className="w-full max-w-5xl mx-auto p-4 md:p-6 pb-20">
        <div className="bg-red-50 text-red-700 p-6 rounded-xl border border-red-100 shadow-sm flex flex-col items-center">
          <svg className="w-12 h-12 mb-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          <p className="font-semibold text-lg">{error || 'Mantenimiento no encontrado'}</p>
          <button onClick={onVolver} className="mt-6 px-6 py-2.5 bg-white text-red-600 rounded-lg hover:bg-red-50 border border-red-200 font-medium transition-colors">Volver al listado</button>
        </div>
      </div>
    );
  }

  const getStatusBadge = (estado: string) => {
    const isTerminado = estado === 'Completado' || estado === 'Terminado';
    if (isTerminado) return <span className="px-3.5 py-1.5 bg-green-100 text-green-800 rounded-md text-xs font-bold uppercase tracking-wider flex items-center gap-2 w-max shadow-sm"><span className="w-2 h-2 rounded-full bg-green-600 animate-pulse"></span> TERMINADO</span>;
    if (estado === 'EnProceso' || estado === 'En progreso') return <span className="px-3.5 py-1.5 bg-blue-100 text-blue-800 rounded-md text-xs font-bold uppercase tracking-wider flex items-center gap-2 w-max shadow-sm"><span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span> EN PROGRESO</span>;
    if (estado === 'Pendiente') return <span className="px-3.5 py-1.5 bg-orange-100 text-orange-800 rounded-md text-xs font-bold uppercase tracking-wider flex items-center gap-2 w-max shadow-sm"><span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span> PENDIENTE</span>;
    return <span className="px-3.5 py-1.5 bg-slate-100 text-slate-800 rounded-md text-xs font-bold uppercase tracking-wider w-max shadow-sm">{estado}</span>;
  };

  const getPrioridadBadge = (prioridad: string | null) => {
    if (!prioridad) return null;
    switch (prioridad) {
      case 'Baja': return <span className="px-3.5 py-1.5 bg-slate-100 text-slate-600 rounded-md text-xs font-bold uppercase tracking-wider w-max shadow-sm border border-slate-200 flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span> PRIORIDAD BAJA</span>;
      case 'Media': return <span className="px-3.5 py-1.5 bg-yellow-50 text-yellow-700 rounded-md text-xs font-bold uppercase tracking-wider w-max shadow-sm border border-yellow-200 flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-yellow-500"></span> PRIORIDAD MEDIA</span>;
      case 'Alta': return <span className="px-3.5 py-1.5 bg-red-50 text-red-700 rounded-md text-xs font-bold uppercase tracking-wider w-max shadow-sm border border-red-200 flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span> PRIORIDAD ALTA</span>;
      default: return <span className="px-3.5 py-1.5 bg-slate-100 text-slate-700 rounded-md text-xs font-bold uppercase tracking-wider w-max shadow-sm border border-slate-200">PRIORIDAD {prioridad}</span>;
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-4 md:p-6 pb-20 animate-fade-in">
      
      {/* ACTION BAR SUPERIOR */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <button 
          onClick={onVolver}
          className="group flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors font-semibold text-sm bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm hover:shadow"
        >
          <svg className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Volver al listado
        </button>

        <div className="flex items-center gap-3">
          <button onClick={() => setEditando(true)} className="px-4 py-2 bg-white text-slate-700 border border-slate-200 rounded-lg shadow-sm hover:bg-slate-50 font-medium text-sm flex items-center gap-2 transition-all">
            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
            Editar
          </button>
          <button onClick={() => alert('Función de reporte en desarrollo')} className="px-4 py-2 bg-primary text-white rounded-lg shadow-md hover:bg-primary/90 font-medium text-sm flex items-center gap-2 transition-all">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
            Generar Reporte
          </button>
        </div>
      </div>

      {editando && (
        <form onSubmit={handleGuardarEdicion} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
          <div className="flex items-center justify-between gap-4 mb-6 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-800">Editar mantenimiento</h3>
              <p className="text-sm text-slate-500">Actualiza los datos principales de la orden MT-{mantenimiento.id.toString().padStart(4, '0')}.</p>
            </div>
            <button
              type="button"
              onClick={() => setEditando(false)}
              className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-medium text-sm"
            >
              Cancelar
            </button>
          </div>

          {editError && (
            <div className="mb-5 p-4 bg-red-50 text-red-700 rounded-lg border border-red-100">
              {editError}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-800">Tipo</label>
              <select
                className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                value={formData.tipo}
                onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                required
              >
                <option value="Preventivo">Preventivo</option>
                <option value="Correctivo">Correctivo</option>
                <option value="Adaptativo">Adaptativo</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-800">Prioridad</label>
              <select
                className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                value={formData.prioridad}
                onChange={(e) => setFormData({ ...formData, prioridad: e.target.value })}
                required
              >
                <option value="Baja">Baja</option>
                <option value="Media">Media</option>
                <option value="Alta">Alta</option>
                <option value="Urgente">Urgente</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-800">Responsable</label>
              <select
                className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                value={formData.responsable}
                onChange={(e) => setFormData({ ...formData, responsable: e.target.value })}
                required
              >
                <option value="" disabled>
                  {loadingUsuarios ? 'Cargando responsables...' : 'Seleccione un responsable'}
                </option>
                {formData.responsable && !responsableActualExiste && (
                  <option value={formData.responsable}>{formData.responsable}</option>
                )}
                {usuarios.map((usuario) => {
                  const nombreCompleto = `${usuario.nombre} ${usuario.apellido}`;
                  return (
                    <option key={usuario.id} value={nombreCompleto}>
                      {nombreCompleto}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-800">Fecha programada</label>
              <input
                type="date"
                className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                value={formData.fechaProgramada}
                onChange={(e) => setFormData({ ...formData, fechaProgramada: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="block text-sm font-semibold text-slate-800">Observaciones</label>
              <textarea
                rows={3}
                maxLength={500}
                className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                value={formData.observaciones ?? ''}
                onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-end pt-6">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-md shadow-blue-600/20 transition-all disabled:opacity-50"
            >
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      )}

      {/* HEADER DASHBOARD CARD */}
      <div className="bg-white rounded-t-2xl shadow-sm border border-slate-200 border-b-0 overflow-hidden">
        <div className="p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-gradient-to-r from-white to-slate-50">
          <div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
              Orden de Mantenimiento
            </p>
            <h2 className="text-4xl md:text-5xl font-black text-slate-800 tracking-tight">
              MT-{mantenimiento.id.toString().padStart(4, '0')}
            </h2>
            <div className="flex items-center gap-2 mt-4 text-slate-500 text-sm font-medium">
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              Registrado el {new Date(mantenimiento.fechaCreacion).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>
          
          <div className="flex flex-col items-start md:items-end gap-5 w-full md:w-auto">
            <div className="flex flex-col gap-1.5 items-start md:items-end w-full">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Estado Actual</span>
              {getStatusBadge(mantenimiento.estado)}
            </div>
            <div className="flex flex-col gap-1.5 items-start md:items-end w-full">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Nivel de Prioridad</span>
              {getPrioridadBadge(mantenimiento.prioridad)}
            </div>
          </div>
        </div>
      </div>

      {/* MAIN UNIFIED CONTENT CARD */}
      <div className="bg-white rounded-b-2xl shadow-sm border border-slate-200 p-6 md:p-10 mb-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-10">
          
          {/* COLUMNA IZQUIERDA */}
          <div className="space-y-10">
            {/* INFORMACION DEL EQUIPO */}
            <div>
              <h3 className="text-sm font-bold text-primary uppercase tracking-widest mb-6 flex items-center gap-2 border-b border-slate-100 pb-4">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                Información del Equipo
              </h3>
              
              <div className="space-y-5">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Número de Serie / Etiqueta</span>
                  <span className="text-lg font-bold text-slate-800 bg-slate-50 px-4 py-2.5 rounded-lg border border-slate-100 w-full inline-block">{mantenimiento.equipo.numeroSerie}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Ubicación Asignada</span>
                  <div className="flex items-center gap-2 text-slate-700 font-medium bg-slate-50 px-4 py-2.5 rounded-lg border border-slate-100">
                    <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    {mantenimiento.equipo.laboratorio}
                  </div>
                </div>
              </div>
            </div>

            {/* DETALLES DEL MANTENIMIENTO */}
            <div>
              <h3 className="text-sm font-bold text-primary uppercase tracking-widest mb-6 flex items-center gap-2 border-b border-slate-100 pb-4">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" /></svg>
                Detalles de Intervención
              </h3>
              
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Tipo de Mantenimiento</span>
                    <span className="font-bold text-slate-800">{mantenimiento.tipo}</span>
                  </div>
                  <div className="flex flex-col bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Técnico Asignado</span>
                    {mantenimiento.responsable ? (
                      <span className="font-bold text-slate-800 flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs">
                          {mantenimiento.responsable.charAt(0).toUpperCase()}
                        </div>
                        {mantenimiento.responsable}
                      </span>
                    ) : (
                      <span className="font-medium text-slate-400 italic">No asignado aún</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* COLUMNA DERECHA */}
          <div className="space-y-10">
            {/* FECHAS */}
            <div>
              <h3 className="text-sm font-bold text-primary uppercase tracking-widest mb-6 flex items-center gap-2 border-b border-slate-100 pb-4">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                Cronograma
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Fecha Programada</span>
                    <span className="font-bold text-slate-800 text-lg">{mantenimiento.fechaProgramada}</span>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Fecha de Finalización</span>
                    {mantenimiento.fechaRealizada ? (
                      <span className="font-bold text-slate-800 text-lg">{mantenimiento.fechaRealizada}</span>
                    ) : (
                      <span className="font-medium text-slate-400 italic">No finalizado</span>
                    )}
                  </div>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${mantenimiento.fechaRealizada ? 'bg-green-100 text-green-600' : 'bg-slate-200 text-slate-400'}`}>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  </div>
                </div>
              </div>
            </div>

            {/* OBSERVACIONES */}
            <div>
              <h3 className="text-sm font-bold text-primary uppercase tracking-widest mb-6 flex items-center gap-2 border-b border-slate-100 pb-4">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" /></svg>
                Observaciones del Reporte
              </h3>
              
              {mantenimiento.observaciones ? (
                <div className="bg-amber-50 border-l-4 border-amber-400 p-5 rounded-r-xl min-h-[120px]">
                  <p className="text-amber-900 leading-relaxed font-medium">
                    "{mantenimiento.observaciones}"
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 px-4 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 min-h-[120px]">
                  <svg className="w-10 h-10 text-slate-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                  <p className="text-slate-400 font-medium">Sin observaciones registradas al inicio del reporte.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* REPORTE TÉCNICO FINAL (Si existe diagnóstico o acciones) */}
      {(mantenimiento.diagnostico || mantenimiento.accionesRealizadas) && (
        <div className="bg-slate-800 rounded-2xl shadow-lg border border-slate-700 p-6 md:p-10 text-white overflow-hidden relative">
          {/* Decorative background element */}
          <div className="absolute top-0 right-0 -mr-16 -mt-16 text-slate-700 opacity-50 pointer-events-none">
            <svg className="w-64 h-64" fill="currentColor" viewBox="0 0 24 24"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
          </div>
          
          <div className="relative z-10">
            <h3 className="text-sm font-bold text-blue-400 uppercase tracking-widest mb-6 flex items-center gap-2 border-b border-slate-600 pb-4">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4V5a2 2 0 00-2-2H9a2 2 0 00-2 2v7z" /></svg>
              Resolución Técnica
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {mantenimiento.diagnostico && (
                <div className="bg-slate-700/50 p-6 rounded-xl border border-slate-600 backdrop-blur-sm">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    Diagnóstico Encontrado
                  </span>
                  <p className="text-slate-100 leading-relaxed text-sm md:text-base">{mantenimiento.diagnostico}</p>
                </div>
              )}
              {mantenimiento.accionesRealizadas && (
                <div className="bg-slate-700/50 p-6 rounded-xl border border-slate-600 backdrop-blur-sm">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                    Acciones Realizadas
                  </span>
                  <p className="text-slate-100 leading-relaxed text-sm md:text-base">{mantenimiento.accionesRealizadas}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
