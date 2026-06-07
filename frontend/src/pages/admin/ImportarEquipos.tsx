import { useState, useRef, useMemo } from 'react';
import { descargarPlantillaEquipos, importarEquipos, validarImportacionExcel } from '../../services/inventarioApi';
import type { ErrorImportacion, ImportacionEquiposResponse, ResumenValidacion } from '../../services/inventarioApi';

export const ImportarEquipos = () => {
  const [paso, setPaso] = useState<1 | 2>(1);
  const [archivo, setArchivo] = useState<File | null>(null);
  
  // Estados de carga
  const [validando, setValidando] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const [descargando, setDescargando] = useState(false);
  
  // Resultados
  const [resumen, setResumen] = useState<ResumenValidacion | null>(null);
  const [resultadoFinal, setResultadoFinal] = useState<ImportacionEquiposResponse | null>(null);
  const [errorGlobal, setErrorGlobal] = useState<string | null>(null);
  
  // Opciones
  const [importacionParcial, setImportacionParcial] = useState(false);
  const [autoCrear, setAutoCrear] = useState(false);
  
  // Drag & Drop
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filtro de Errores y Previsualización
  const [filtroCampo, setFiltroCampo] = useState<string>('Todos');
  const [filtroPreview, setFiltroPreview] = useState<string>('');

  const faltantes = useMemo(() => {
    if (!resumen) return 0;
    return resumen.categoriasFaltantes.length + resumen.marcasFaltantes.length + resumen.ubicacionesFaltantes.length;
  }, [resumen]);

  const erroresActivos = useMemo(() => {
    if (!resumen) return [];
    if (!autoCrear) return resumen.errores;
    
    // Si autoCrear está activo, ignoramos los errores de catálogos faltantes
    return resumen.errores.filter(e => {
      const isMissingCatalogError = 
        (e.campo === 'Categoria' && e.mensaje === 'La categoria no existe.') ||
        (e.campo === 'Marca' && e.mensaje === 'La marca no existe.') ||
        (e.campo === 'Ubicacion' && e.mensaje === 'La ubicacion no existe.');
        
      return !isMissingCatalogError;
    });
  }, [resumen, autoCrear]);

  const previewFiltrada = useMemo(() => {
    if (!resumen) return [];
    if (!filtroPreview.trim()) return resumen.previsualizacion;
    
    const term = filtroPreview.toLowerCase();
    return resumen.previsualizacion.filter(p => 
      (p.codigoInventario && p.codigoInventario.toLowerCase().includes(term)) ||
      (p.numeroSerie && p.numeroSerie.toLowerCase().includes(term)) ||
      (p.nombreModelo && p.nombreModelo.toLowerCase().includes(term)) ||
      (p.marca && p.marca.toLowerCase().includes(term)) ||
      (p.categoria && p.categoria.toLowerCase().includes(term))
    );
  }, [resumen, filtroPreview]);

  const statsActivos = useMemo(() => {
    if (!resumen) return { total: 0, conErrores: 0, validas: 0 };
    
    const filasConError = new Set(erroresActivos.map(e => e.fila));
    const conErrores = filasConError.size;
    const validas = resumen.totalFilas - conErrores;
    
    return {
      total: resumen.totalFilas,
      conErrores,
      validas
    };
  }, [resumen, erroresActivos]);

  const erroresFiltrados = useMemo(() => {
    if (!resumen) return [];
    if (filtroCampo === 'Todos') return erroresActivos;
    return erroresActivos.filter(e => e.campo === filtroCampo);
  }, [erroresActivos, filtroCampo]);

  const camposConErrores = useMemo(() => {
    if (!resumen) return [];
    const campos = new Set(erroresActivos.map(e => e.campo));
    return Array.from(campos).sort();
  }, [erroresActivos]);

  const handleDescargarPlantilla = async () => {
    try {
      setDescargando(true);
      setErrorGlobal(null);
      await descargarPlantillaEquipos();
    } catch {
      setErrorGlobal('No se pudo descargar la plantilla.');
    } finally {
      setDescargando(false);
    }
  };

  const handleFile = async (file: File | null) => {
    setResultadoFinal(null);
    setErrorGlobal(null);
    setResumen(null);
    setImportacionParcial(false);
    setAutoCrear(false);

    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.xlsx')) {
      setArchivo(null);
      setErrorGlobal('Seleccione un archivo con extensión .xlsx.');
      return;
    }

    setArchivo(file);
    await procesarValidacion(file);
  };

  const procesarValidacion = async (file: File) => {
    try {
      setValidando(true);
      setErrorGlobal(null);
      const data = await validarImportacionExcel(file);
      
      if (!data.success && data.mensaje) {
        setErrorGlobal(data.mensaje);
        setArchivo(null);
      } else {
        setResumen(data);
        setPaso(2);
      }
    } catch (e: any) {
       setErrorGlobal('Ocurrió un error inesperado al validar el archivo.');
       setArchivo(null);
    } finally {
      setValidando(false);
    }
  };

  const handleArchivoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleFile(event.target.files?.[0] ?? null);
    if (event.target.value) event.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); setIsDragging(false);
    handleFile(e.dataTransfer.files?.[0] ?? null);
  };

  const handleConfirmarImportacion = async () => {
    if (!archivo) return;
    try {
      setProcesando(true);
      setErrorGlobal(null);
      const data = await importarEquipos(archivo, importacionParcial, autoCrear);
      setResultadoFinal(data);
      setPaso(1); // Volvemos al paso 1 pero mostramos el resultado
      setArchivo(null);
    } catch (e: any) {
       setErrorGlobal('Ocurrió un error inesperado al procesar el archivo final.');
    } finally {
      setProcesando(false);
    }
  };

  return (
    <section className="page-section">
      <div className="section-header">
        <div>
          <p className="section-kicker">Carga masiva</p>
          <h2 className="section-title">Importar equipos</h2>
          <p className="section-description">
            Cargue activos desde una plantilla Excel y conserve la trazabilidad por lote.
          </p>
        </div>
        <button type="button" onClick={handleDescargarPlantilla} disabled={descargando} className="btn btn--outline">
          {descargando ? 'Descargando...' : 'Descargar plantilla'}
        </button>
      </div>

      {errorGlobal && <div className="alert alert--error mb-20">{errorGlobal}</div>}

      {/* RESULTADO FINAL (Aparece tras confirmar en el paso 2) */}
      {resultadoFinal?.success && (
        <div className="alert alert--success mb-20">
          <strong>¡Éxito!</strong> Se importaron {resultadoFinal.totalImportados} equipos correctamente.
        </div>
      )}

      {resultadoFinal && !resultadoFinal.success && (
         <div className="alert alert--error mb-20">
           <strong>No se pudo importar el archivo.</strong>
           {resultadoFinal.errores && resultadoFinal.errores.length > 0 ? (
             <div style={{ marginTop: '10px' }}>
               <p style={{ margin: '0 0 8px 0' }}>Errores encontrados por el servidor:</p>
               <ul style={{ margin: 0, paddingLeft: '20px' }}>
                 {resultadoFinal.errores.map((err, i) => (
                   <li key={i}>
                     {err.fila > 0 && <><strong>Fila {err.fila}</strong> — </>}
                     <strong>{err.campo}:</strong> {err.mensaje}
                   </li>
                 ))}
               </ul>
             </div>
           ) : (
             <p style={{ margin: '5px 0 0 0' }}>La importación parcial estaba desactivada y se encontraron errores de validación.</p>
           )}
         </div>
      )}

      {/* PASO 1: SUBIR ARCHIVO */}
      {paso === 1 && (
        <div className="card card--padded mb-20">
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: '#0f172a' }}>Paso 1: Seleccione su archivo Excel</h3>
          <div 
            className={`dropzone ${isDragging ? 'dropzone--active' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: '2px dashed #cbd5e1',
              borderRadius: '8px',
              padding: '3rem',
              textAlign: 'center',
              cursor: validando ? 'wait' : 'pointer',
              backgroundColor: isDragging ? '#f1f5f9' : '#fff',
              transition: 'all 0.2s ease',
              opacity: validando ? 0.6 : 1
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              onChange={handleArchivoChange}
              style={{ display: 'none' }}
              disabled={validando}
            />
            
            {validando ? (
              <div>
                 <div className="spinner" style={{ margin: '0 auto 15px', borderTopColor: '#3b82f6', width: '30px', height: '30px', borderWidth: '3px' }}></div>
                 <p style={{ color: '#0f172a', fontWeight: '500', margin: 0 }}>Analizando archivo...</p>
                 <p style={{ color: '#64748b', fontSize: '14px', marginTop: '5px' }}>Validando columnas y catálogos</p>
              </div>
            ) : (
              <div>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 15px' }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                <p style={{ color: '#0f172a', fontWeight: '500', fontSize: '16px', margin: 0 }}>Arrastra tu archivo .xlsx aquí</p>
                <p style={{ color: '#64748b', fontSize: '14px', marginTop: '5px' }}>o haz clic para explorar tus carpetas</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* PASO 2: VALIDACIÓN Y CONFIRMACIÓN */}
      {paso === 2 && resumen && archivo && (
        <div className="card card--padded mb-20" style={{ animation: 'fadeIn 0.3s ease-in' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
             <div>
               <h3 style={{ fontSize: '1.1rem', margin: '0 0 5px 0', color: '#0f172a' }}>Paso 2: Confirmación</h3>
               <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>Archivo: <strong>{archivo.name}</strong> ({(archivo.size / 1024).toFixed(1)} KB)</p>
             </div>
             <button type="button" onClick={() => setPaso(1)} className="btn btn--outline" disabled={procesando}>
                Elegir otro archivo
             </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
             <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', transition: 'all 0.3s' }}>
                <p style={{ margin: '0 0 5px', color: '#64748b', fontSize: '13px', textTransform: 'uppercase', fontWeight: 600 }}>Total Filas</p>
                <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>{statsActivos.total}</p>
             </div>
             <div style={{ backgroundColor: '#ecfdf5', padding: '1rem', borderRadius: '8px', border: '1px solid #a7f3d0', transition: 'all 0.3s' }}>
                <p style={{ margin: '0 0 5px', color: '#047857', fontSize: '13px', textTransform: 'uppercase', fontWeight: 600 }}>Listos para importar</p>
                <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#059669' }}>{statsActivos.validas}</p>
             </div>
             <div style={{ backgroundColor: statsActivos.conErrores > 0 ? '#fef2f2' : '#f8fafc', padding: '1rem', borderRadius: '8px', border: `1px solid ${statsActivos.conErrores > 0 ? '#fecaca' : '#e2e8f0'}`, transition: 'all 0.3s' }}>
                <p style={{ margin: '0 0 5px', color: statsActivos.conErrores > 0 ? '#b91c1c' : '#64748b', fontSize: '13px', textTransform: 'uppercase', fontWeight: 600 }}>Con Errores</p>
                <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: statsActivos.conErrores > 0 ? '#dc2626' : '#0f172a' }}>{statsActivos.conErrores}</p>
             </div>
          </div>

          {/* ALERTAS INTELIGENTES */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
            
            {faltantes > 0 && (
              <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '1rem 1.5rem', display: 'flex', alignItems: 'flex-start', gap: '15px' }}>
                 <div style={{ marginTop: '2px', color: '#d97706' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                 </div>
                 <div style={{ flex: 1 }}>
                    <h4 style={{ margin: '0 0 5px 0', color: '#92400e', fontSize: '15px' }}>Catálogos no encontrados</h4>
                    <p style={{ margin: '0 0 10px 0', color: '#b45309', fontSize: '14px' }}>
                      Se detectaron los siguientes elementos en el Excel que aún no existen en el sistema:
                    </p>
                    <ul style={{ margin: '0 0 15px 0', paddingLeft: '20px', color: '#92400e', fontSize: '14px', lineHeight: '1.6' }}>
                      {resumen.marcasFaltantes.length > 0 && (
                        <li><strong>Marcas:</strong> {resumen.marcasFaltantes.join(', ')}</li>
                      )}
                      {resumen.categoriasFaltantes.length > 0 && (
                        <li><strong>Categorías:</strong> {resumen.categoriasFaltantes.join(', ')}</li>
                      )}
                      {resumen.ubicacionesFaltantes.length > 0 && (
                        <li><strong>Ubicaciones:</strong> {resumen.ubicacionesFaltantes.join(', ')}</li>
                      )}
                    </ul>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 500, color: '#92400e', backgroundColor: '#fef3c7', padding: '8px 12px', borderRadius: '6px', border: '1px solid #fde68a', width: 'fit-content' }}>
                      <input 
                        type="checkbox" 
                        checked={autoCrear} 
                        onChange={(e) => setAutoCrear(e.target.checked)} 
                        style={{ width: '18px', height: '18px', accentColor: '#d97706' }}
                      />
                      Crear automáticamente estos {faltantes} catálogos
                    </label>
                 </div>
              </div>
            )}

            {statsActivos.conErrores > 0 && (
              <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '1rem 1.5rem', display: 'flex', alignItems: 'flex-start', gap: '15px' }}>
                 <div style={{ marginTop: '2px', color: '#ef4444' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
                 </div>
                 <div style={{ flex: 1 }}>
                    <h4 style={{ margin: '0 0 5px 0', color: '#991b1b', fontSize: '15px' }}>Errores de Validación</h4>
                    <p style={{ margin: '0 0 10px 0', color: '#b91c1c', fontSize: '14px' }}>
                      Encontramos {statsActivos.conErrores} fila(s) con errores (campos vacíos, series duplicadas, etc). Por defecto, toda la importación será rechazada.
                    </p>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 500, color: '#991b1b' }}>
                      <input 
                        type="checkbox" 
                        checked={importacionParcial} 
                        onChange={(e) => setImportacionParcial(e.target.checked)} 
                        style={{ width: '18px', height: '18px', accentColor: '#dc2626' }}
                      />
                      Omitir las filas erróneas e importar solo los {statsActivos.validas} equipos correctos
                    </label>
                 </div>
              </div>
            )}

          </div>

          {/* PREVISUALIZACIÓN COMPLETA */}
          <div style={{ marginBottom: '2rem' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h4 style={{ margin: 0, color: '#0f172a' }}>Previsualización Completa del Archivo</h4>
                <input 
                  type="text" 
                  placeholder="Buscar equipo, marca, serie..." 
                  value={filtroPreview}
                  onChange={(e) => setFiltroPreview(e.target.value)}
                  className="form-input"
                  style={{ width: '250px', padding: '0.4rem', fontSize: '14px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
             </div>
             <div className="table-responsive" style={{ border: '1px solid #e2e8f0', borderRadius: '8px', maxHeight: '400px', overflowY: 'auto' }}>
               <table className="data-table" style={{ margin: 0 }}>
                 <thead style={{ backgroundColor: '#f8fafc', position: 'sticky', top: 0, zIndex: 1 }}>
                   <tr>
                     <th>Fila</th>
                     <th>Código</th>
                     <th>Serie</th>
                     <th>Modelo</th>
                     <th>Marca</th>
                     <th>Categoría</th>
                     <th>Estado</th>
                   </tr>
                 </thead>
                 <tbody>
                   {previewFiltrada.map(p => {
                     const isError = erroresActivos.some(e => e.fila === p.fila);
                     return (
                       <tr key={p.fila} style={{ backgroundColor: isError ? '#fef2f2' : 'transparent' }}>
                         <td style={{ color: isError ? '#dc2626' : '#64748b', fontWeight: isError ? 600 : 'normal' }}>
                           {p.fila} {isError && '⚠️'}
                         </td>
                         <td style={{ fontWeight: 500 }}>{p.codigoInventario || '-'}</td>
                         <td>{p.numeroSerie || '-'}</td>
                         <td>{p.nombreModelo || '-'}</td>
                         <td>
                           {p.marca || '-'}
                           {resumen.marcasFaltantes.includes(p.marca) && <span style={{ marginLeft: '5px', color: autoCrear ? '#059669' : '#d97706', fontSize: '12px' }}>{autoCrear ? '(Se creará)' : '(Nueva)'}</span>}
                         </td>
                         <td>
                           {p.categoria || '-'}
                           {resumen.categoriasFaltantes.includes(p.categoria) && <span style={{ marginLeft: '5px', color: autoCrear ? '#059669' : '#d97706', fontSize: '12px' }}>{autoCrear ? '(Se creará)' : '(Nueva)'}</span>}
                         </td>
                         <td>
                            <span className={`status-badge status-badge--${p.estado.toLowerCase() === 'operativo' ? 'active' : 'inactive'}`}>
                              {p.estado || '-'}
                            </span>
                         </td>
                       </tr>
                     );
                   })}
                   {previewFiltrada.length === 0 && (
                     <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>No se encontraron filas que coincidan con la búsqueda</td></tr>
                   )}
                 </tbody>
               </table>
             </div>
          </div>

          {/* TABLA DE ERRORES CON COMBO BOX */}
          {erroresActivos.length > 0 && (
             <div style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <h4 style={{ margin: 0, color: '#0f172a' }}>Detalle de Errores de Validación</h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <label style={{ fontSize: '14px', color: '#64748b', fontWeight: 500 }}>Filtrar por campo:</label>
                    <select 
                      value={filtroCampo} 
                      onChange={(e) => setFiltroCampo(e.target.value)}
                      className="form-input"
                      style={{ width: '200px', padding: '0.4rem', fontSize: '14px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    >
                      <option value="Todos">Todos los campos</option>
                      {camposConErrores.map(campo => (
                        <option key={campo} value={campo}>{campo}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="table-responsive" style={{ border: '1px solid #fecaca', borderRadius: '8px' }}>
                  <table className="data-table" style={{ margin: 0 }}>
                    <thead style={{ backgroundColor: '#fef2f2' }}>
                      <tr>
                        <th style={{ width: '80px', color: '#991b1b' }}>Fila</th>
                        <th style={{ width: '150px', color: '#991b1b' }}>Campo Afectado</th>
                        <th style={{ color: '#991b1b' }}>Descripción del Problema</th>
                      </tr>
                    </thead>
                    <tbody>
                      {erroresFiltrados.length === 0 ? (
                        <tr><td colSpan={3} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>No hay errores en el campo seleccionado</td></tr>
                      ) : (
                        erroresFiltrados.map((item, index) => (
                          <tr key={`${item.fila}-${item.campo}-${index}`}>
                            <td style={{ fontWeight: 500, color: '#64748b' }}>{item.fila}</td>
                            <td><span style={{ color: '#ef4444', fontWeight: 500 }}>{item.campo}</span></td>
                            <td style={{ color: '#475569' }}>{item.mensaje}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
             </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', borderTop: '1px solid #e2e8f0', paddingTop: '1.5rem' }}>
            <button type="button" onClick={() => setPaso(1)} className="btn btn--outline" disabled={procesando}>
               Cancelar
            </button>
            <button 
               type="button" 
               onClick={handleConfirmarImportacion} 
               disabled={procesando || (statsActivos.conErrores > 0 && !importacionParcial && statsActivos.validas > 0) || (statsActivos.validas === 0)} 
               className="btn btn--primary"
            >
              {procesando ? 'Importando...' : 'Confirmar e Importar'}
            </button>
          </div>
        </div>
      )}
    </section>
  );
};
