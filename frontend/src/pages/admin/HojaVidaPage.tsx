import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { AxiosError } from 'axios';
import { getHojaVidaEquipo } from '../../services/inventarioService';
import type { HojaVida, Mantenimiento } from '../../services/inventarioService';

export const HojaVidaPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const panelPath = location.pathname.startsWith('/lab') ? '/lab' : '/admin';

  // Estados existentes — NO eliminar
  const [hojaVida, setHojaVida] = useState<HojaVida | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Nuevo estado para filtro
  const [filtroTipo, setFiltroTipo] = useState('Todos');

  // Lógica de carga existente — NO modificar
  useEffect(() => {
    const cargarHojaVida = async () => {
      const equipoId = Number(id);

      if (!id || Number.isNaN(equipoId)) {
        setError('Identificador de equipo invalido.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const data = await getHojaVidaEquipo(equipoId);
        setHojaVida(data);
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

  // Formateo de fecha existente — NO modificar
  const formatDate = (value: string | null | undefined): string => {
    if (!value) return '';
    try {
      return new Intl.DateTimeFormat('es-EC', {
        year: 'numeric',
        month: 'long',
        day: '2-digit',
      }).format(new Date(`${value}T00:00:00`));
    } catch {
      return value;
    }
  };

  if (loading) {
    return (
      <main className="resource-page">
        <div className="resource-container">
          <div className="state-box card">Cargando hoja de vida...</div>
        </div>
      </main>
    );
  }

  if (error || !hojaVida) {
    return (
      <main className="resource-page">
        <div className="resource-container">
          <section className="card card--padded">
            <p className="alert alert--error">{error ?? 'No se encontro informacion del equipo.'}</p>
            <button onClick={() => navigate(panelPath)} className="btn btn--primary mt-16">
              Volver
            </button>
          </section>
        </div>
      </main>
    );
  }

  const { equipo, mantenimientos } = hojaVida;

  // Filtrado en cliente
  const mantenimientosFiltrados = filtroTipo === 'Todos'
    ? mantenimientos ?? []
    : (mantenimientos ?? []).filter(m => m.tipo === filtroTipo);

  // Card de Mantenimiento Interno
  const CardMantenimiento = ({ m }: { m: Mantenimiento }) => {
    const lineas = m.accionesRealizadas 
      ? m.accionesRealizadas.includes('\n') 
        ? m.accionesRealizadas.split('\n') 
        : m.accionesRealizadas.split(',') 
      : [];
    const actividades = lineas.map(line => line.trim()).filter(Boolean);

    return (
      <article className="timeline-item" style={{ maxWidth: '420px', width: '100%', textAlign: 'left' }}>
        {/* Header */}
        <div className="timeline-item__header" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <svg style={{ width: '14px', height: '14px', color: 'var(--color-primary)', marginRight: '6px', flexShrink: 0 }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="cell-title" style={{ fontWeight: 'bold' }}>{formatDate(m.fechaProgramada)}</span>
          </div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
            {m.tipo && (
              <span className={`badge ${m.tipo === 'Preventivo' ? 'badge--success' : m.tipo === 'Correctivo' ? 'badge--primary' : 'badge--neutral'}`}>
                {m.tipo}
              </span>
            )}
            <span 
              className={`badge ${m.estado === 'Completado' ? 'badge--success' : (m.estado === 'Pendiente' || m.estado === 'Cancelado') ? 'badge--neutral' : ''}`}
              style={m.estado === 'EnProceso' ? { backgroundColor: '#fef08a', color: '#854d0e', border: '1px solid #fef08a' } : undefined}
            >
              {m.estado}
            </span>
          </div>
        </div>

        {/* Detalles */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {m.responsable && (
            <div style={{ display: 'flex', alignItems: 'flex-start' }}>
              <svg style={{ width: '16px', height: '16px', color: 'var(--color-muted)', marginRight: '6px', marginTop: '2px', flexShrink: 0 }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: '4px' }}>
                <span className="info-item__label" style={{ margin: 0, fontWeight: '500', color: 'var(--color-muted)' }}>Técnico:</span>
                <span className="cell-title" style={{ margin: 0, fontWeight: 'bold' }}>{m.responsable}</span>
              </div>
            </div>
          )}

          {m.diagnostico && (
            <div style={{ display: 'flex', alignItems: 'flex-start' }}>
              <svg style={{ width: '16px', height: '16px', color: 'var(--color-muted)', marginRight: '6px', marginTop: '2px', flexShrink: 0 }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                <span className="info-item__label" style={{ margin: 0, fontWeight: '500', color: 'var(--color-muted)' }}>Diagnóstico:</span>
                <p className="timeline-item__text" style={{ margin: '4px 0 0 0', color: 'var(--color-text)' }}>{m.diagnostico}</p>
              </div>
            </div>
          )}

          {actividades.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'flex-start' }}>
              <svg style={{ width: '16px', height: '16px', color: 'var(--color-muted)', marginRight: '6px', marginTop: '2px', flexShrink: 0 }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" />
              </svg>
              <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                <span className="info-item__label" style={{ margin: 0, fontWeight: '500', color: 'var(--color-muted)' }}>Actividades:</span>
                <ul style={{ margin: '6px 0 0 0', paddingLeft: '16px', color: 'var(--color-text)', listStyleType: 'disc' }}>
                  {actividades.map((act, i) => (
                    <li key={i} style={{ marginBottom: '4px', fontSize: '0.9rem' }}>{act}</li>
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
    <main className="resource-page">
      <div className="resource-container">
        {/* Sección 1 — Header de página */}
        <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px' }}>
          <div>
            <Link to={panelPath} className="back-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}>
              ← Volver al inventario
            </Link>
            <h1 className="section-title mt-16" style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '8px 0 0 0' }}>
              <svg style={{ width: '28px', height: '28px', color: 'var(--color-primary)' }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              Hoja de Vida del Activo
            </h1>
          </div>
          <div>
            <button onClick={() => navigate(panelPath)} className="btn btn--outline" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              ← Volver al Inventario
            </button>
          </div>
        </div>

        {/* Sección 2 — Tarjeta "INFORMACIÓN DEL EQUIPO" */}
        <section className="card card--padded mb-20">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <svg style={{ width: '20px', height: '20px', color: 'var(--color-primary)' }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <p className="section-kicker" style={{ margin: 0 }}>INFORMACIÓN DEL EQUIPO</p>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0', borderTop: '1px solid var(--color-border)', marginTop: '16px', paddingTop: '20px' }}>
            <div className="info-item" style={{ borderRight: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '10px' }}>
              <svg style={{ width: '24px', height: '24px', color: 'var(--color-danger)', marginBottom: '8px' }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 5v14M6 5v14M9 5v14M13 5v14M16 5v14M19 5v14M21 5v14M3 9h18M3 15h18" />
              </svg>
              <p className="info-item__label" style={{ margin: '0 0 4px 0' }}>Código</p>
              <p className="info-item__value" style={{ margin: 0, fontWeight: 'bold' }}>{equipo.numeroSerie}</p>
            </div>
            <div className="info-item" style={{ borderRight: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '10px' }}>
              <svg style={{ width: '24px', height: '24px', color: '#1d4ed8', marginBottom: '8px' }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="info-item__label" style={{ margin: '0 0 4px 0' }}>Marca</p>
              <p className="info-item__value" style={{ margin: 0, fontWeight: 'bold' }}>{equipo.marca}</p>
            </div>
            <div className="info-item" style={{ borderRight: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '10px' }}>
              <svg style={{ width: '24px', height: '24px', color: '#c2410c', marginBottom: '8px' }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 3v2m6-2v2M9 19H5a2 2 0 000 4h14a2 2 0 000-4h-4M9 5h6m-6 0v10.428a4 4 0 01-1.101 2.766L5 21h14l-2.899-2.806A4 4 0 0115 15.427V5H9z" />
              </svg>
              <p className="info-item__label" style={{ margin: '0 0 4px 0' }}>Laboratorio</p>
              <p className="info-item__value" style={{ margin: 0, fontWeight: 'bold' }}>{equipo.laboratorio}</p>
            </div>
            <div className="info-item" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '10px' }}>
              <svg style={{ width: '24px', height: '24px', color: '#16a34a', marginBottom: '8px' }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="info-item__label" style={{ margin: '0 0 4px 0' }}>Estado actual</p>
              <div style={{ marginTop: '2px' }}>
                <span className="badge badge--success">{equipo.estado}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Sección 3 — Filtro por tipo */}
        <section className="card card--padded mb-20" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <svg style={{ width: '20px', height: '20px', color: 'var(--color-primary)' }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          <label htmlFor="tipo-filtro" className="form-label" style={{ margin: 0, fontWeight: 'bold' }}>Filtrar por tipo:</label>
          <select
            id="tipo-filtro"
            className="form-select"
            style={{ maxWidth: '220px', minHeight: '38px', padding: '6px 12px' }}
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
          >
            <option value="Todos">Todos</option>
            <option value="Preventivo">Preventivo</option>
            <option value="Correctivo">Correctivo</option>
            <option value="Adaptativo">Adaptativo</option>
          </select>
        </section>

        {/* Sección 4 — Timeline de mantenimientos */}
        {mantenimientosFiltrados.length === 0 ? (
          /* Sección 6 — Estado vacío */
          <div className="empty-panel" style={{ display: 'flex', flexDirection: 'row', gap: '12px', alignItems: 'flex-start', background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: 'var(--radius-md)', padding: '24px', textAlign: 'left', width: '100%' }}>
            <svg style={{ width: '24px', height: '24px', color: 'var(--color-primary)', flexShrink: 0, marginTop: '2px' }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <h3 className="cell-title" style={{ margin: 0, fontWeight: 'bold', color: 'var(--color-text)' }}>Sin mantenimientos registrados</h3>
              <p className="cell-subtitle" style={{ margin: 0, color: 'var(--color-muted)', fontSize: '0.9rem' }}>Aún no se han registrado mantenimientos para este activo.</p>
            </div>
          </div>
        ) : (
          <div className="timeline" style={{ display: 'grid', gridTemplateColumns: '1fr 32px 1fr', gap: '20px 0', position: 'relative' }}>
            {mantenimientosFiltrados.map((m, index) => {
              const esIzquierda = index % 2 === 0;
              return (
                <React.Fragment key={m.id}>
                  {/* columna izquierda */}
                  <div style={{ gridColumn: '1', display: 'flex', justifyContent: 'flex-end' }}>
                    {esIzquierda && <CardMantenimiento m={m} />}
                  </div>
                  {/* columna central: línea + nodo */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ flex: 1, width: 2, background: 'var(--color-border)' }} />
                    <div style={{ width: 16, height: 16, borderRadius: '50%', background: 'var(--color-primary)', flexShrink: 0 }} />
                    <div style={{ flex: 1, width: 2, background: 'var(--color-border)' }} />
                  </div>
                  {/* columna derecha */}
                  <div style={{ gridColumn: '3' }}>
                    {!esIzquierda && <CardMantenimiento m={m} />}
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
};
