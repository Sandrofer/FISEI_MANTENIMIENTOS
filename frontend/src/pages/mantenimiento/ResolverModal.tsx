import React, { useEffect, useState } from 'react';
import { 
  obtenerDiagnosticosPorCategoria, 
  obtenerAccionesPorCategoria, 
  resolverDetalleMantenimiento 
} from '../../services/mantenimientoService';
import type {
  DiagnosticoPredefinido, 
  AccionPredefinida, 
  ResolverDetalleDto, 
  RecursoUtilizadoDto 
} from '../../services/mantenimientoService';
import { obtenerSubcategoriasRecursos } from '../../services/inventarioService';
import type { RecursoSubcategoria } from '../../services/inventarioService';

interface ResolverModalProps {
  ordenId: string;
  detalleId: string;
  categoriaEquipo: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const ResolverModal: React.FC<ResolverModalProps> = ({ 
  ordenId, 
  detalleId, 
  categoriaEquipo, 
  onClose, 
  onSuccess 
}) => {
  const [paso, setPaso] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Catalogos
  const [diagnosticos, setDiagnosticos] = useState<DiagnosticoPredefinido[]>([]);
  const [accionesPredefinidas, setAccionesPredefinidas] = useState<AccionPredefinida[]>([]);
  
  // Seccion 1 State
  const [diagnosticoId, setDiagnosticoId] = useState<number | ''>('');
  const [accionesSeleccionadas, setAccionesSeleccionadas] = useState<number[]>([]);
  const [descripcionDetallada, setDescripcionDetallada] = useState('');

  // Seccion 2 State (Multiple resources)
  const [recursos, setRecursos] = useState<RecursoUtilizadoDto[]>([]);
  const [tipoRecursoPrincipal, setTipoRecursoPrincipal] = useState<'Repuesto' | 'Software' | 'Herramienta' | 'Ninguno'>('Ninguno');
  const [subcategoriaId, setSubcategoriaId] = useState<number | ''>('');
  const [cantidad, setCantidad] = useState<number>(1);
  
  const [subcategoriasDisponibles, setSubcategoriasDisponibles] = useState<RecursoSubcategoria[]>([]);

  useEffect(() => {
    const fetchCatalogos = async () => {
      try {
        const [diags, accs] = await Promise.all([
          obtenerDiagnosticosPorCategoria(categoriaEquipo),
          obtenerAccionesPorCategoria(categoriaEquipo)
        ]);
        setDiagnosticos(diags);
        setAccionesPredefinidas(accs);
      } catch (err) {
        console.error("Error al cargar catálogos", err);
        setError("Error al cargar opciones del formulario.");
      }
    };
    fetchCatalogos();
  }, [categoriaEquipo]);

  useEffect(() => {
    if (tipoRecursoPrincipal !== 'Ninguno') {
      obtenerSubcategoriasRecursos(tipoRecursoPrincipal)
        .then(setSubcategoriasDisponibles)
        .catch(() => setSubcategoriasDisponibles([]));
    } else {
      setSubcategoriasDisponibles([]);
      setSubcategoriaId('');
    }
  }, [tipoRecursoPrincipal]);

  const handleToggleAccion = (id: number) => {
    setAccionesSeleccionadas(prev => 
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  };

  const handleAddRecurso = () => {
    if (tipoRecursoPrincipal === 'Ninguno') {
      setRecursos([...recursos, { tipoRecursoPrincipal: 'Ninguno', cantidadUtilizada: 0 }]);
    } else {
      if (subcategoriaId === '') return;
      if (cantidad <= 0) return;
      
      setRecursos([...recursos, { 
        tipoRecursoPrincipal, 
        recursoSubcategoriaId: Number(subcategoriaId), 
        cantidadUtilizada: cantidad 
      }]);
    }
    // Reset form for next resource
    setTipoRecursoPrincipal('Ninguno');
    setSubcategoriaId('');
    setCantidad(1);
  };

  const handleRemoveRecurso = (index: number) => {
    setRecursos(recursos.filter((_, i) => i !== index));
  };

  const handleSiguiente = () => {
    if (diagnosticoId === '') {
      setError("Debe seleccionar un diagnóstico.");
      return;
    }
    if (descripcionDetallada.trim() === '') {
      setError("La descripción detallada es obligatoria.");
      return;
    }
    setError(null);
    setPaso(2);
  };

  const handleFinalizar = async () => {
    try {
      setLoading(true);
      setError(null);

      const payload: ResolverDetalleDto = {
        diagnosticoPredefinidoId: Number(diagnosticoId),
        descripcionDetallada,
        accionesIds: accionesSeleccionadas,
        recursos: recursos
      };

      await resolverDetalleMantenimiento(ordenId, detalleId, payload);
      onSuccess();
    } catch (err: any) {
      console.error("FULL ERROR RESPONSE:", err.response?.data);
      setError(err.response?.data?.Mensaje || JSON.stringify(err.response?.data) || "Error al finalizar el mantenimiento.");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">
            Resolver Equipo ({categoriaEquipo})
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm border border-red-200">
              {error}
            </div>
          )}

          {paso === 1 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold border-b pb-2">Sección 1: Diagnóstico y Actividades</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Diagnóstico Predefinido *</label>
                <select 
                  className="w-full border border-gray-300 rounded p-2 focus:ring-blue-500 focus:border-blue-500"
                  value={diagnosticoId}
                  onChange={(e) => setDiagnosticoId(e.target.value === '' ? '' : Number(e.target.value))}
                >
                  <option value="">-- Seleccione un diagnóstico --</option>
                  {diagnosticos.map(d => (
                    <option key={d.id} value={d.id}>{d.codigo} - {d.descripcion}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Checklist de Acciones Comunes</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-gray-50 p-4 rounded border">
                  {accionesPredefinidas.length === 0 ? (
                    <p className="text-sm text-gray-500 italic">No hay acciones predefinidas para esta categoría.</p>
                  ) : (
                    accionesPredefinidas.map(a => (
                      <label key={a.id} className="flex items-center space-x-2">
                        <input 
                          type="checkbox" 
                          className="rounded text-blue-600 focus:ring-blue-500"
                          checked={accionesSeleccionadas.includes(a.id)}
                          onChange={() => handleToggleAccion(a.id)}
                        />
                        <span className="text-sm text-gray-700">{a.nombre}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción Detallada *</label>
                <textarea 
                  className="w-full border border-gray-300 rounded p-2 h-32 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Describa el trabajo realizado detalladamente..."
                  value={descripcionDetallada}
                  onChange={(e) => setDescripcionDetallada(e.target.value)}
                />
              </div>
            </div>
          )}

          {paso === 2 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold border-b pb-2">Sección 2: Registro de Recursos Utilizados</h3>
              
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo Recurso *</label>
                    <select 
                      className="w-full border border-gray-300 rounded p-2"
                      value={tipoRecursoPrincipal}
                      onChange={(e) => setTipoRecursoPrincipal(e.target.value as any)}
                    >
                      <option value="Ninguno">Ninguno</option>
                      <option value="Repuesto">Repuesto</option>
                      <option value="Software">Software</option>
                      <option value="Herramienta">Herramienta</option>
                    </select>
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Subcategoría (Específico)</label>
                    <select 
                      className="w-full border border-gray-300 rounded p-2 disabled:bg-gray-100"
                      value={subcategoriaId}
                      onChange={(e) => setSubcategoriaId(Number(e.target.value))}
                      disabled={tipoRecursoPrincipal === 'Ninguno'}
                    >
                      <option value="">-- Seleccione --</option>
                      {subcategoriasDisponibles.map(s => (
                        <option key={s.id} value={s.id}>{s.nombreSubcategoria}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad</label>
                    <div className="flex space-x-2">
                      <input 
                        type="number" 
                        min="1"
                        className="w-full border border-gray-300 rounded p-2 disabled:bg-gray-100"
                        value={cantidad}
                        onChange={(e) => setCantidad(Number(e.target.value))}
                        disabled={tipoRecursoPrincipal === 'Ninguno'}
                      />
                      <button 
                        onClick={handleAddRecurso}
                        disabled={tipoRecursoPrincipal !== 'Ninguno' && (subcategoriaId === '' || cantidad <= 0)}
                        className="bg-blue-600 text-white px-3 rounded hover:bg-blue-700 disabled:bg-blue-300 whitespace-nowrap"
                      >
                        Añadir
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Recursos Agregados:</h4>
                {recursos.length === 0 ? (
                  <p className="text-sm text-gray-500 italic p-4 bg-gray-50 rounded border text-center">No se han registrado recursos adicionales.</p>
                ) : (
                  <ul className="divide-y divide-gray-200 border rounded">
                    {recursos.map((r, idx) => (
                      <li key={idx} className="p-3 flex justify-between items-center bg-white hover:bg-gray-50">
                        <div>
                          <span className="font-medium">{r.tipoRecursoPrincipal}</span>
                          {r.tipoRecursoPrincipal !== 'Ninguno' && (
                            <span className="ml-2 text-gray-600 text-sm">
                              (Subcategoría ID: {r.recursoSubcategoriaId}) x {r.cantidadUtilizada}
                            </span>
                          )}
                        </div>
                        <button 
                          onClick={() => handleRemoveRecurso(idx)}
                          className="text-red-500 hover:text-red-700 text-sm font-medium"
                        >
                          Eliminar
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end space-x-3 rounded-b-lg">
          <button 
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-100 font-medium"
            disabled={loading}
          >
            Cancelar
          </button>
          
          {paso === 1 ? (
            <button 
              onClick={handleSiguiente}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium"
            >
              Siguiente
            </button>
          ) : (
            <div className="space-x-3">
              <button 
                onClick={() => setPaso(1)}
                className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-100 font-medium"
                disabled={loading}
              >
                Atrás
              </button>
              <button 
                onClick={handleFinalizar}
                disabled={loading}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-medium disabled:bg-green-400 flex items-center"
              >
                {loading ? 'Procesando...' : 'Finalizar'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
