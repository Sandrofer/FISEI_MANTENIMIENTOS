import { useState, useEffect } from 'react';
import { crearMantenimiento, obtenerMantenimientos, type CrearMantenimientoDto, type MantenimientoDto } from '../../services/mantenimientoService';
import { obtenerEquipos, type Equipo } from '../../services/inventarioService';
import { getUsuarios } from '../../services/usuarioService';

interface MantenimientoFormProps {
  onCancel: () => void;
  onSuccess: () => void;
}

export const MantenimientoForm = ({ onCancel, onSuccess }: MantenimientoFormProps) => {
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [recientes, setRecientes] = useState<MantenimientoDto[]>([]);
  
  const [formData, setFormData] = useState<CrearMantenimientoDto>({
    equipoId: 0,
    tipo: 'Preventivo',
    prioridad: 'Media',
    responsable: '',
    observaciones: '',
    fechaProgramada: '' // Use string for input type="date"
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargarRecientes = async () => {
    try {
      const data = await obtenerMantenimientos();
      setRecientes(data.slice(0, 5)); // Solo los 5 últimos
    } catch (err) {
      console.error("Error al cargar mantenimientos recientes", err);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [equiposRes, usuariosRes] = await Promise.all([
          obtenerEquipos(),
          getUsuarios(1, 100)
        ]);
        setEquipos(equiposRes);
        const laboratoristas = usuariosRes.datos?.filter((u: any) => u.rol === 'Laboratorista') || [];
        setUsuarios(laboratoristas);
        
        if (laboratoristas.length > 0) {
          setFormData(prev => ({ ...prev, responsable: laboratoristas[0].nombre + ' ' + laboratoristas[0].apellido }));
        }

        await cargarRecientes();
      } catch (err: any) {
        console.error(err);
        setError('Error al cargar datos necesarios.');
      }
    };
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.equipoId === 0) {
      setError('Seleccione un equipo.');
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      // Si la fecha programada está vacía, enviamos null para que el backend la auto-calcule si es necesario.
      const payload = {
        ...formData,
        fechaProgramada: formData.fechaProgramada ? formData.fechaProgramada : undefined
      };
      
      await crearMantenimiento(payload as any);
      onSuccess();
    } catch (err: any) {
      console.error(err.response?.data);
      const errorMsg = err.response?.data?.mensaje || JSON.stringify(err.response?.data?.errors || err.response?.data || err.message);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (estado: string) => {
    const isTerminado = estado === 'Completado' || estado === 'Terminado';
    if (isTerminado) return <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-green-600"></span> Terminado</span>;
    if (estado === 'EnProceso') return <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-yellow-600"></span> En Proceso</span>;
    if (estado === 'Pendiente') return <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-orange-600"></span> Pendiente</span>;
    return <span className="px-3 py-1 bg-slate-100 text-slate-800 rounded-full text-xs font-medium">{estado}</span>;
  };

  const renderPriorityDot = (prioridad: string) => {
    switch (prioridad) {
      case 'Baja': return <span className="w-3 h-3 rounded-full bg-slate-400 inline-block mr-2"></span>;
      case 'Media': return <span className="w-3 h-3 rounded-full bg-yellow-400 inline-block mr-2"></span>;
      case 'Alta': return <span className="w-3 h-3 rounded-full bg-red-500 inline-block mr-2"></span>;
      default: return null;
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-4 md:p-6 pb-20">
      
      {/* Cabecera del formulario */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 mb-8">
        <div className="flex items-center gap-3 mb-8 justify-center border-b border-slate-100 pb-6">
          <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h2 className="text-2xl font-bold text-primary tracking-tight">Registrar Mantenimiento</h2>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-3 border border-red-100">
            <span className="font-semibold text-lg">!</span>
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
            
            {/* 1. Equipo */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-800">1. Seleccionar Equipo <span className="text-red-500">*</span></label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
                <select
                  className="w-full pl-10 pr-4 py-3 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none text-slate-700"
                  value={formData.equipoId}
                  onChange={(e) => setFormData({ ...formData, equipoId: Number(e.target.value) })}
                  required
                >
                  <option value={0} disabled>Buscar por código, nombre o ubicación</option>
                  {equipos.map(eq => (
                    <option key={eq.id} value={eq.id}>
                      {eq.numeroSerie} - {eq.marca} {eq.modelo} ({eq.laboratorio})
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>
            </div>

            {/* 2. Tipo */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-800">2. Tipo de Mantenimiento <span className="text-red-500">*</span></label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                </div>
                <select
                  className="w-full pl-10 pr-4 py-3 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none text-slate-700"
                  value={formData.tipo}
                  onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                >
                  <option value="Preventivo">Preventivo</option>
                  <option value="Correctivo">Correctivo</option>
                  <option value="Adaptativo">Adaptativo</option>
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-1">Seleccione el tipo de mantenimiento</p>
            </div>

            {/* 3. Prioridad */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-800">3. Prioridad <span className="text-red-500">*</span></label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  {renderPriorityDot(formData.prioridad)}
                </div>
                <select
                  className="w-full pl-10 pr-4 py-3 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none text-slate-700"
                  value={formData.prioridad}
                  onChange={(e) => setFormData({ ...formData, prioridad: e.target.value })}
                >
                  <option value="Baja">Baja</option>
                  <option value="Media">Media</option>
                  <option value="Alta">Alta</option>
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-1">Seleccione la prioridad del mantenimiento</p>
            </div>

            {/* 4. Técnico Responsable */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-800">4. Técnico Responsable <span className="text-red-500">*</span></label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                </div>
                <select
                  className="w-full pl-10 pr-4 py-3 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none text-slate-700"
                  value={formData.responsable}
                  onChange={(e) => setFormData({ ...formData, responsable: e.target.value })}
                  required
                >
                  {usuarios.length === 0 && <option value="" disabled>Cargando tecnicos...</option>}
                  {usuarios.map(u => (
                    <option key={u.id} value={u.nombre + ' ' + u.apellido}>
                      {u.nombre} {u.apellido}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-1">Seleccione el técnico responsable</p>
            </div>

            {/* 5. Fecha Programada */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-800">5. Fecha Programada <span className="text-red-500">*</span></label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                </div>
                <input
                  type="date"
                  className="w-full pl-10 pr-4 py-3 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-slate-700"
                  value={formData.fechaProgramada || ''}
                  onChange={(e) => setFormData({ ...formData, fechaProgramada: e.target.value })}
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">Fecha sugerida automáticamente (Preventivo)</p>
            </div>

            {/* 6. Observación */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-800">6. Observación (opcional)</label>
              <textarea
                rows={3}
                maxLength={500}
                className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none text-slate-700"
                placeholder="Ingrese una observación adicional..."
                value={formData.observaciones || ''}
                onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
              />
              <p className="text-xs text-slate-500 mt-1 text-right">Máximo 500 caracteres</p>
            </div>

          </div>

          <div className="flex justify-end gap-4 pt-6 border-t border-slate-100">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2.5 text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <span>✕</span> Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-md shadow-blue-600/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <span>+</span> {loading ? 'Guardando...' : 'Crear Mantenimiento'}
            </button>
          </div>
        </form>
      </div>

      {/* Tabla Inferior: Últimos mantenimientos */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 overflow-hidden">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-6">
          <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          Últimos mantenimientos creados
        </h3>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="px-4 py-3 text-sm font-semibold text-primary">ID</th>
                <th className="px-4 py-3 text-sm font-semibold text-primary">Equipo</th>
                <th className="px-4 py-3 text-sm font-semibold text-primary">Fecha</th>
                <th className="px-4 py-3 text-sm font-semibold text-primary">Estado</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recientes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">No hay mantenimientos recientes.</td>
                </tr>
              ) : (
                recientes.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-4 text-sm font-medium text-slate-700">MT-{m.id.toString().padStart(4, '0')}</td>
                    <td className="px-4 py-4 text-sm text-slate-600">{m.equipo.numeroSerie} - {m.equipo.laboratorio}</td>
                    <td className="px-4 py-4 text-sm text-slate-600">{m.fechaProgramada}</td>
                    <td className="px-4 py-4">{getStatusBadge(m.estado)}</td>
                    <td className="px-4 py-4 text-right">
                      <svg className="w-5 h-5 text-slate-400 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <div className="mt-4 text-center">
            <button onClick={onCancel} className="text-sm font-medium text-slate-500 hover:text-primary transition-colors">
              Ver todos los mantenimientos <span>&gt;</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
