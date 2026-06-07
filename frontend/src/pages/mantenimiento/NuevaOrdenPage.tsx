import React, { useState, useEffect } from 'react';
import { obtenerEquipos } from '../../services/inventarioService';
import type { Equipo } from '../../services/inventarioService';
import { getUsuarios } from '../../services/usuarioService';
import { crearOrdenMantenimiento } from '../../services/mantenimientoService';
import type { CrearOrdenRequestDto } from '../../services/mantenimientoService';

export const NuevaOrdenPage: React.FC = () => {
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [laboratoristas, setLaboratoristas] = useState<any[]>([]);
  const [laboratoriosUnicos, setLaboratoriosUnicos] = useState<string[]>([]);

  const [laboratorioFiltro, setLaboratorioFiltro] = useState<string>('');
  const [fechaIngreso, setFechaIngreso] = useState<string>(new Date().toISOString().split('T')[0]);
  const [descripcionGeneral, setDescripcionGeneral] = useState<string>('');
  const [tipoMantenimiento, setTipoMantenimiento] = useState<string>('Preventivo');

  const [equipoSeleccionado, setEquipoSeleccionado] = useState<string>('');
  const [laboratoristaSeleccionado, setLaboratoristaSeleccionado] = useState<string>('');

  const [detallesAgregados, setDetallesAgregados] = useState<{ equipo: Equipo, laboratoristaId: string }[]>([]);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const eqs = await obtenerEquipos({ estado: 'Operativo' });
        setEquipos(eqs);

        const labs = Array.from(new Set(eqs.map((e: any) => e.ubicacion || e.laboratorio).filter(Boolean)));
        setLaboratoriosUnicos(labs as string[]);

        const usersRes = await getUsuarios(1, 100);
        // El backend de Auth retorna el array en la propiedad 'datos'
        const usersArray = usersRes.datos || usersRes.items || usersRes.data || usersRes;

        if (Array.isArray(usersArray)) {
          const labsActivos = usersArray.filter((u: any) =>
            u.rol && u.rol.toUpperCase() === 'LABORATORISTA' && u.activo === true
          );
          setLaboratoristas(labsActivos);
        }
      } catch (error) {
        console.error("Error cargando datos:", error);
      }
    };
    fetchData();
  }, []);

  const agregarDetalle = () => {
    if (!equipoSeleccionado || !laboratoristaSeleccionado) return;

    // Evitar duplicados
    if (detallesAgregados.some(d => d.equipo.id.toString() === equipoSeleccionado)) {
      alert("Este equipo ya ha sido agregado a la orden.");
      return;
    }

    const equipoObj = equipos.find(e => e.id.toString() === equipoSeleccionado);
    if (equipoObj) {
      setDetallesAgregados([...detallesAgregados, { equipo: equipoObj, laboratoristaId: laboratoristaSeleccionado }]);
      setEquipoSeleccionado('');
      // No reseteamos el laboratorista por si quiere agregar varios al mismo responsable
    }
  };

  const eliminarDetalle = (equipoId: string) => {
    setDetallesAgregados(detallesAgregados.filter(d => d.equipo.id.toString() !== equipoId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (detallesAgregados.length === 0) {
      alert("Debe agregar al menos un equipo a la orden.");
      return;
    }

    const dto: CrearOrdenRequestDto = {
      fechaIngreso,
      descripcionGeneral,
      tipoMantenimiento,
      equipos: detallesAgregados.map(d => ({
        equipoId: d.equipo.id.toString(),
        laboratoristaAsignadoId: Number(d.laboratoristaId)
      }))
    };

    try {
      await crearOrdenMantenimiento(dto);
      setMensajeExito("Orden de mantenimiento creada con éxito.");
      setDetallesAgregados([]);
      setDescripcionGeneral('');
      setTimeout(() => setMensajeExito(null), 5000);
    } catch (error) {
      console.error("Error al crear la orden:", error);
      alert("Ocurrió un error al crear la orden de mantenimiento.");
    }
  };

  const equiposFiltrados = equipos.filter((e: any) => 
    (!laboratorioFiltro || (e.ubicacion || e.laboratorio) === laboratorioFiltro) &&
    !detallesAgregados.some(d => String(d.equipo.id) === String(e.id))
  );

  return (
    <div className="container mx-auto p-4 bg-gray-50 min-h-screen relative">
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

      <h1 className="text-3xl font-bold text-gray-800 mb-6">Nueva Orden de Mantenimiento</h1>

      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-700 mb-4 border-b pb-2">Datos Generales</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Ingreso</label>
            <input
              type="date"
              value={fechaIngreso}
              onChange={(e) => setFechaIngreso(e.target.value)}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Mantenimiento</label>
            <select
              value={tipoMantenimiento}
              onChange={(e) => setTipoMantenimiento(e.target.value)}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="Preventivo">Preventivo</option>
              <option value="Correctivo">Correctivo</option>
              <option value="Adaptativo">Adaptativo</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción General (Opcional)</label>
            <textarea
              value={descripcionGeneral}
              onChange={(e) => setDescripcionGeneral(e.target.value)}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              rows={3}
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-700 mb-4 border-b pb-2">Agregar Equipos</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Filtrar por Ubicación/Laboratorio</label>
            <select
              value={laboratorioFiltro}
              onChange={(e) => setLaboratorioFiltro(e.target.value)}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todas las ubicaciones</option>
              {laboratoriosUnicos.map(lab => (
                <option key={lab} value={lab}>{lab}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Equipo</label>
            <select
              value={equipoSeleccionado}
              onChange={(e) => setEquipoSeleccionado(e.target.value)}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Seleccione un equipo...</option>
              {equiposFiltrados.map((eq: any) => (
                <option key={eq.id} value={eq.id.toString()}>{eq.numeroSerie} - {eq.nombreModelo || eq.modelo}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Laboratorista Asignado</label>
            <select
              value={laboratoristaSeleccionado}
              onChange={(e) => setLaboratoristaSeleccionado(e.target.value)}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Seleccione laboratorista...</option>
              {laboratoristas.map(lab => (
                <option key={lab.id} value={lab.id.toString()}>{lab.nombre} {lab.apellido}</option>
              ))}
            </select>
          </div>
          <div>
            <button
              type="button"
              onClick={agregarDetalle}
              disabled={!equipoSeleccionado || !laboratoristaSeleccionado}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md shadow disabled:opacity-50 transition-colors"
            >
              Agregar a la lista
            </button>
          </div>
        </div>
      </div>

      {detallesAgregados.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-4 border-b pb-2">Equipos a Mantenimiento</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Equipo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ubicación</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Laboratorista</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {detallesAgregados.map((detalle, index) => {
                  const lab = laboratoristas.find(l => l.id.toString() === detalle.laboratoristaId);
                  return (
                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {detalle.equipo.numeroSerie} - {(detalle.equipo as any).nombreModelo || detalle.equipo.modelo}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {(detalle.equipo as any).ubicacion || detalle.equipo.laboratorio || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {lab ? `${lab.nombre} ${lab.apellido}` : 'Desconocido'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => eliminarDetalle(detalle.equipo.id.toString())}
                          className="text-red-600 hover:text-red-900 font-semibold"
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <button
          onClick={handleSubmit}
          disabled={detallesAgregados.length === 0}
          className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg shadow-md disabled:opacity-50 transform hover:scale-105 transition-all"
        >
          Crear caso de mantenimiento
        </button>
      </div>
    </div>
  );
};
