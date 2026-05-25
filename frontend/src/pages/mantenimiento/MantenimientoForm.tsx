import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { crearMantenimiento, type CrearMantenimientoDto } from '../../services/mantenimientoService';
import { obtenerEquipos, type Equipo } from '../../services/inventarioService';
import { getUsuarios } from '../../services/usuarioService';

export const MantenimientoForm = () => {
  const navigate = useNavigate();
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [usuarios, setUsuarios] = useState<any[]>([]);
  
  const [formData, setFormData] = useState<CrearMantenimientoDto>({
    equipoId: 0,
    tipo: 'Preventivo',
    prioridad: 'Media',
    responsable: '',
    observaciones: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      await crearMantenimiento(formData);
      navigate(-1); // Regresa a la vista anterior (listado de mantenimientos)
    } catch (err: any) {
      console.error(err.response?.data);
      const errorMsg = err.response?.data?.mensaje || JSON.stringify(err.response?.data?.errors || err.response?.data || err.message);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-lg mt-10 border border-slate-100">
      <div className="mb-8 border-b border-slate-100 pb-4">
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Nuevo Mantenimiento</h2>
        <p className="text-slate-500 mt-1">Registre una peticion de mantenimiento seleccionando los campos correspondientes.</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-3 border border-red-100">
          <span className="font-semibold text-lg">!</span>
          <p>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">Equipo Afectado</label>
          <select
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 outline-none hover:bg-white"
            value={formData.equipoId}
            onChange={(e) => setFormData({ ...formData, equipoId: Number(e.target.value) })}
            required
          >
            <option value={0} disabled>-- Seleccione un equipo --</option>
            {equipos.map(eq => (
              <option key={eq.id} value={eq.id}>
                {eq.numeroSerie} - {eq.marca} {eq.modelo} ({eq.laboratorio})
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">Tipo de Mantenimiento</label>
            <select
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 outline-none hover:bg-white"
              value={formData.tipo}
              onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
            >
              <option value="Preventivo">Preventivo</option>
              <option value="Correctivo">Correctivo</option>
              <option value="Adaptativo">Adaptativo</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">Prioridad</label>
            <select
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 outline-none hover:bg-white"
              value={formData.prioridad}
              onChange={(e) => setFormData({ ...formData, prioridad: e.target.value })}
            >
              <option value="Baja">Baja</option>
              <option value="Media">Media</option>
              <option value="Alta">Alta</option>
              <option value="Urgente">Urgente</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">Técnico Responsable</label>
          <select
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 outline-none hover:bg-white"
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
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">Observaciones Iniciales (Opcional)</label>
          <textarea
            rows={3}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 outline-none hover:bg-white resize-none"
            placeholder="Describa el problema reportado de forma breve..."
            value={formData.observaciones || ''}
            onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
          />
        </div>

        <div className="flex justify-end gap-4 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-6 py-2.5 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-lg font-medium shadow-md shadow-primary/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? 'Guardando...' : 'Crear Peticion'}
          </button>
        </div>
      </form>
    </div>
  );
};
