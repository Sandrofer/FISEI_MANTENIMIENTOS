import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { AxiosError } from 'axios';
import { getHojaVidaEquipo } from '../../services/inventarioService';
import { getUsuarios } from '../../services/usuarioService';
import { generarReporteHojaVida } from '../../utils/pdfGenerator';
import type { HojaVida, Mantenimiento, Equipo } from '../../services/inventarioService';

export const HojaVidaPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const panelPath = location.pathname.startsWith('/lab') ? '/lab' : '/admin';

  const [hojaVida, setHojaVida] = useState<HojaVida | null>(null);
  const [usuariosMap, setUsuariosMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtroTipo, setFiltroTipo] = useState('Todos');

  useEffect(() => {
    const cargarHojaVida = async () => {
      if (!id || id === 'undefined') {
        setError('Identificador de equipo inválido.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const data = await getHojaVidaEquipo(id);
        setHojaVida(data);
        try {
          const resUsuarios = await getUsuarios(1, 100);
          const map: Record<string, string> = {};
          if (resUsuarios && resUsuarios.datos) {
            resUsuarios.datos.forEach((u: any) => {
              map[u.id.toString()] = `${u.nombre} ${u.apellido}`;
            });
          }
          setUsuariosMap(map);
        } catch (e) {
          console.error('Error fetching users', e);
        }
      } catch (err) {
        const axiosError = err as AxiosError<{ message?: string }>;
        if (axiosError.response?.status === 404) {
          setError(axiosError.response.data.message ?? 'Equipo no encontrado');
        } else {
          setError('No se pudo cargar la hoja de vida del equipo.');
        }
      } finally {
        setLoading(false);
      }
    };

    cargarHojaVida();
  }, [id]);

  const formatDate = (value: string | null | undefined): string => {
    if (!value) return '';
    try {
      return new Intl.DateTimeFormat('es-EC', {
        year: 'numeric',
        month: 'long',
        day: '2-digit',
      }).format(new Date(`${value}T00:00:00`)); // appending T00 to avoid timezone shift if only date is passed, though we have DateTime now
    } catch {
      return value;
    }
  };

  const parseDateTime = (value: string | null | undefined): string => {
    if (!value) return '';
    try {
      return new Intl.DateTimeFormat('es-EC', {
        year: 'numeric',
        month: 'long',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      }).format(new Date(value));
    } catch {
      return value;
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-[#f8f5f2] to-[#ebe3df] p-8 flex items-center justify-center">
        <div className="flex flex-col items-center animate-pulse">
          <div className="w-16 h-16 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-lg font-medium text-[var(--color-primary)]">Cargando hoja de vida...</p>
        </div>
      </main>
    );
  }

  if (error || !hojaVida) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-[#f8f5f2] to-[#ebe3df] p-8">
        <div className="max-w-4xl mx-auto">
          <section className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl p-8 border border-white/40 text-center">
            <div className="text-red-500 mb-4 flex justify-center">
              <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <p className="text-xl font-medium text-gray-800 mb-8">{error ?? 'No se encontró información del equipo.'}</p>
            <button onClick={() => navigate(panelPath)} className="px-6 py-3 bg-[var(--color-primary)] text-white font-medium rounded-xl hover:bg-[var(--color-primary-dark)] transition-colors duration-200 shadow-lg shadow-[var(--color-primary)]/30">
              Volver al panel
            </button>
          </section>
        </div>
      </main>
    );
  }

  const { equipo, mantenimientos = [] } = hojaVida;

  const mantenimientosFiltrados = filtroTipo === 'Todos'
    ? mantenimientos
    : mantenimientos.filter(m => m.tipo === filtroTipo);

  const getBadgeColor = (estado: string) => {
    switch(estado) {
      case 'Finalizado': return 'bg-green-100 text-green-800 border-green-200';
      case 'En Proceso': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Pendiente': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'No Reparado (De Baja)': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getTipoColor = (tipo: string | null) => {
    switch(tipo) {
      case 'Preventivo': return 'bg-teal-50 text-teal-700 border-teal-200';
      case 'Correctivo': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'Adaptativo': return 'bg-purple-50 text-purple-700 border-purple-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const CardMantenimiento = ({ m }: { m: Mantenimiento }) => {
    const actividades = m.accionesRealizadas ? m.accionesRealizadas.split('\n').filter(Boolean) : [];

    return (
      <article className="w-full max-w-[460px] bg-white/90 backdrop-blur-sm border border-gray-100 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] group relative overflow-hidden">
        {/* Decorative accent top line */}
        <div className={`absolute top-0 left-0 w-full h-1 ${m.estado === 'Finalizado' ? 'bg-green-500' : m.estado === 'En Proceso' ? 'bg-yellow-400' : 'bg-gray-300'}`}></div>
        
        <div className="flex flex-wrap gap-2 items-center justify-between border-b border-gray-100 pb-4 mb-4">
          <div className="flex items-center gap-2">
            <div className="bg-[var(--color-primary-soft)] p-2 rounded-lg text-[var(--color-primary)]">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-gray-800 text-sm">Caso: {m.codigoCaso || 'N/A'}</span>
              <span className="text-gray-500 text-xs font-medium mt-0.5">Inicio: {parseDateTime(m.fechaInicio || m.fechaProgramada)}</span>
              {m.fechaCierre && <span className="text-gray-500 text-xs font-medium">Cierre: {parseDateTime(m.fechaCierre)}</span>}
            </div>
          </div>
          <div className="flex gap-2 items-center">
            {m.tipo && (
              <span className={`px-2.5 py-1 text-xs font-semibold rounded-md border ${getTipoColor(m.tipo)}`}>
                {m.tipo}
              </span>
            )}
            <span className={`px-2.5 py-1 text-xs font-semibold rounded-md border ${getBadgeColor(m.estado)}`}>
              {m.estado}
            </span>
          </div>
        </div>

        <div className="space-y-4">
          {m.responsable && (
            <div className="flex items-start gap-3 text-sm">
              <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <div>
                <span className="text-gray-500 font-medium block text-xs uppercase tracking-wider mb-0.5">Técnico Asignado</span>
                <span className="text-gray-800 font-medium">{m.responsable ? (usuariosMap[m.responsable] || m.responsable) : 'N/A'}</span>
              </div>
            </div>
          )}

          {m.diagnostico && (
            <div className="flex items-start gap-3 text-sm">
              <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <div>
                <span className="text-gray-500 font-medium block text-xs uppercase tracking-wider mb-0.5">Diagnóstico</span>
                <p className="text-gray-700 leading-relaxed">{m.diagnostico}</p>
              </div>
            </div>
          )}

          {actividades.length > 0 && (
            <div className="flex items-start gap-3 text-sm bg-gray-50/50 p-3 rounded-xl border border-gray-100">
              <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" />
              </svg>
              <div className="w-full">
                <span className="text-gray-500 font-medium block text-xs uppercase tracking-wider mb-1.5">Actividades Realizadas</span>
                <ul className="space-y-1.5 text-gray-700">
                  {actividades.map((act, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-[var(--color-primary)] opacity-60">•</span>
                      <span>{act}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </article>
    );
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#fcfbf9] to-[#f0eae6] text-[var(--color-text)]">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-4">
          <div>
            <button onClick={() => navigate(panelPath)} className="inline-flex items-center gap-2 text-gray-500 hover:text-[var(--color-primary)] transition-colors mb-4 font-medium cursor-pointer bg-transparent border-0 p-0">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              Volver al inventario
            </button>
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 flex items-center gap-3">
                <div className="bg-[var(--color-primary)] text-white p-2.5 rounded-xl shadow-lg shadow-[var(--color-primary)]/20">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                </div>
                Hoja de Vida del Activo
              </h1>
              <button 
                onClick={() => generarReporteHojaVida(equipo, mantenimientos, usuariosMap)} 
                className="mt-2 sm:mt-0 px-4 py-2 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 transition-colors duration-200 shadow-md flex items-center gap-2 text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Exportar a PDF
              </button>
            </div>
          </div>
        </div>

        <section className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 p-8 mb-10 transition-transform duration-500 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-[var(--color-primary-soft)] text-[var(--color-primary)] p-2 rounded-lg">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-sm font-bold text-[var(--color-primary)] tracking-widest uppercase">Información del Equipo</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100 transition-colors hover:bg-[var(--color-primary-soft)] group">
              <div className="bg-white p-3 rounded-xl shadow-sm group-hover:text-[var(--color-primary)] text-gray-500 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 5v14M6 5v14M9 5v14M13 5v14M16 5v14M19 5v14M21 5v14M3 9h18M3 15h18" /></svg>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Código</p>
                <p className="font-bold text-gray-900">{equipo.numeroSerie}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100 transition-colors hover:bg-blue-50 group">
              <div className="bg-white p-3 rounded-xl shadow-sm group-hover:text-blue-600 text-gray-500 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Marca</p>
                <p className="font-bold text-gray-900">{equipo.marca}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100 transition-colors hover:bg-orange-50 group">
              <div className="bg-white p-3 rounded-xl shadow-sm group-hover:text-orange-600 text-gray-500 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 3v2m6-2v2M9 19H5a2 2 0 000 4h14a2 2 0 000-4h-4M9 5h6m-6 0v10.428a4 4 0 01-1.101 2.766L5 21h14l-2.899-2.806A4 4 0 0115 15.427V5H9z" /></svg>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Laboratorio</p>
                <p className="font-bold text-gray-900">{equipo.ubicacion}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100 transition-colors hover:bg-green-50 group">
              <div className="bg-white p-3 rounded-xl shadow-sm group-hover:text-green-600 text-gray-500 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Estado</p>
                <div className="mt-0.5">
                  <span className="px-2.5 py-1 bg-green-100 text-green-800 border border-green-200 text-xs font-bold rounded-md">{equipo.estado}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 p-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-10">
            <div className="flex items-center gap-3">
              <div className="bg-gray-100 text-gray-700 p-2 rounded-lg">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900">Historial de Mantenimientos</h2>
              <span className="bg-gray-200 text-gray-700 text-xs font-bold px-2.5 py-1 rounded-full ml-2">
                {mantenimientosFiltrados.length}
              </span>
            </div>
            
            <div className="flex items-center gap-3 bg-gray-50 p-1.5 rounded-xl border border-gray-200 w-full sm:w-auto">
              <label htmlFor="tipo-filtro" className="text-sm font-semibold text-gray-500 pl-3 hidden sm:block">Filtrar:</label>
              <select
                id="tipo-filtro"
                className="bg-white border-0 text-sm font-medium rounded-lg px-4 py-2 focus:ring-2 focus:ring-[var(--color-primary)]/20 outline-none shadow-sm w-full sm:w-48 cursor-pointer"
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value)}
              >
                <option value="Todos">Todos los tipos</option>
                <option value="Preventivo">Preventivo</option>
                <option value="Correctivo">Correctivo</option>
                <option value="Adaptativo">Adaptativo</option>
              </select>
            </div>
          </div>

          {mantenimientosFiltrados.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-4">
              <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6 shadow-inner border border-gray-100">
                <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Sin mantenimientos registrados</h3>
              <p className="text-gray-500 max-w-md">Aún no se han registrado o completado mantenimientos de tipo {filtroTipo !== 'Todos' ? <span className="font-semibold text-gray-700">'{filtroTipo}'</span> : ''} para este activo.</p>
            </div>
          ) : (
            <div className="relative pt-6 pb-12">
              {/* Contenedor de la línea vertical */}
              <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-0.5 bg-gradient-to-b from-transparent via-[var(--color-primary)]/20 to-transparent"></div>
              
              <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-x-8 gap-y-12 relative">
                {mantenimientosFiltrados.map((m, index) => {
                  const isLeft = index % 2 === 0;
                  return (
                    <React.Fragment key={m.id}>
                      {/* Lado izquierdo */}
                      <div className={`flex justify-end col-span-1 md:col-start-1 md:col-end-2 ${!isLeft ? 'md:invisible md:h-0' : ''}`}>
                        {isLeft && <CardMantenimiento m={m} />}
                      </div>
                      
                      {/* Conector Central (oculto en móviles) */}
                      <div className="hidden md:flex col-span-1 md:col-start-2 md:col-end-3 flex-col items-center justify-start mt-8">
                        <div className="w-4 h-4 rounded-full bg-[var(--color-primary)] shadow-[0_0_0_4px_rgba(123,30,43,0.1)] relative z-10"></div>
                      </div>
                      
                      {/* Lado derecho */}
                      <div className={`flex justify-start col-span-1 md:col-start-3 md:col-end-4 ${isLeft ? 'md:invisible md:h-0' : ''}`}>
                        {!isLeft && <CardMantenimiento m={m} />}
                      </div>

                      {/* Modo móvil (muestra tarjetas una sobre otra, línea a la izquierda o centro) */}
                      <div className="md:hidden col-span-1 flex justify-center w-full relative z-10 mt-[-2rem] mb-4">
                          <div className="w-3 h-3 rounded-full bg-[var(--color-primary)] shadow-[0_0_0_4px_rgba(123,30,43,0.1)]"></div>
                      </div>
                      <div className="md:hidden col-span-1 flex justify-center w-full">
                         {!isLeft ? <CardMantenimiento m={m} /> : null}
                      </div>
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
};