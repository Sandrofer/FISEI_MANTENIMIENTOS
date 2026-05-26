import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { AxiosError } from 'axios';
import { getHojaVidaEquipo } from '../../services/inventarioService';
import type { HojaVida } from '../../services/inventarioService';

export const HojaVidaPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [hojaVida, setHojaVida] = useState<HojaVida | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const panelPath = location.pathname.startsWith('/lab') ? '/lab' : '/admin';

  const [filtroTipo, setFiltroTipo] = useState('');

  const getTipoStyle = (tipo: string | null) => {
    if (!tipo) return {};
    const norm = tipo.toLowerCase();
    if (norm === 'preventivo') {
      return { color: '#17633c', backgroundColor: '#e9f7ef', border: '1px solid #bce8cc' };
    }
    if (norm === 'correctivo') {
      return { color: '#9f1d2f', backgroundColor: '#fff1f2', border: '1px solid #fecdd3' };
    }
    if (norm === 'adaptativo') {
      return { color: '#1d4ed8', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe' };
    }
    return { color: '#475569', backgroundColor: '#eef2f6', border: '1px solid #cbd5e1' };
  };

  const getPrioridadStyle = (prioridad: string | null) => {
    if (!prioridad) return {};
    const norm = prioridad.toLowerCase();
    if (norm === 'baja') {
      return { color: '#475569', backgroundColor: '#eef2f6', border: '1px solid #cbd5e1' };
    }
    if (norm === 'media') {
      return { color: '#1d4ed8', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe' };
    }
    if (norm === 'alta') {
      return { color: '#c2410c', backgroundColor: '#fff7ed', border: '1px solid #fed7aa' };
    }
    if (norm === 'urgente') {
      return { color: '#9f1d2f', backgroundColor: '#fff1f2', border: '1px solid #fecdd3' };
    }
    return { color: '#475569', backgroundColor: '#eef2f6' };
  };

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

  const mantenimientosFiltrados = mantenimientos.filter((m) => {
    if (!filtroTipo) return true;
    return m.tipo?.toLowerCase() === filtroTipo.toLowerCase();
  });

  return (
    <main className="resource-page">
      <div className="resource-container">
        <div className="section-header">
          <div>
            <Link to={panelPath} className="back-link">Volver al panel</Link>
            <h1 className="section-title mt-16">Hoja de vida del activo</h1>
            <p className="section-description">{equipo.marca} {equipo.modelo} - {equipo.numeroSerie}</p>
          </div>
          <span className="badge badge--success">{equipo.estado}</span>
        </div>

        <section className="card card--padded mb-20">
          <div className="section-header">
            <div>
              <p className="section-kicker">Ficha tecnica</p>
              <h2 className="section-title">Informacion del equipo</h2>
            </div>
          </div>
          <div className="info-grid">
            <InfoItem label="Marca" value={equipo.marca} />
            <InfoItem label="Modelo" value={equipo.modelo} />
            <InfoItem label="Procesador" value={equipo.procesador} />
            <InfoItem label="Laboratorio" value={equipo.laboratorio} />
            <InfoItem label="Estado" value={equipo.estado} />
            <InfoItem label="Numero de serie" value={equipo.numeroSerie} />
            <InfoItem label="Fecha de compra" value={formatDate(equipo.fechaCompra)} />
          </div>
        </section>

        <section className="card card--padded">
          <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <p className="section-kicker">Historial</p>
              <h2 className="section-title">Mantenimientos</h2>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label htmlFor="tipo-filtro" className="form-label" style={{ margin: 0, whiteSpace: 'nowrap' }}>Filtrar por tipo:</label>
              <select
                id="tipo-filtro"
                className="form-select"
                style={{ minHeight: '38px', padding: '6px 12px', width: '180px' }}
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value)}
              >
                <option value="">Todos</option>
                <option value="Preventivo">Preventivo</option>
                <option value="Correctivo">Correctivo</option>
                <option value="Adaptativo">Adaptativo</option>
              </select>
            </div>
          </div>

          {mantenimientosFiltrados.length === 0 ? (
            <div className="empty-panel">Sin mantenimientos registrados</div>
          ) : (
            <div className="timeline">
              {mantenimientosFiltrados.map((mantenimiento) => (
                <article key={mantenimiento.id} className="timeline-item">
                  <div className="timeline-item__header" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <h3 className="timeline-item__title" style={{ display: 'inline-block', marginRight: '10px' }}>
                        {formatDate(mantenimiento.fechaProgramada)}
                      </h3>
                      {mantenimiento.fechaRealizada && (
                        <span style={{ fontSize: '0.85rem', color: 'var(--color-muted)' }}>
                          (Realizado: {formatDate(mantenimiento.fechaRealizada)})
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                      <span className="badge badge--primary">{mantenimiento.estado}</span>
                      {mantenimiento.tipo && (
                        <span className="badge" style={getTipoStyle(mantenimiento.tipo)}>
                          {mantenimiento.tipo}
                        </span>
                      )}
                      {mantenimiento.prioridad && (
                        <span className="badge" style={getPrioridadStyle(mantenimiento.prioridad)}>
                          Prioridad: {mantenimiento.prioridad}
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {mantenimiento.responsable && (
                      <div style={{ fontSize: '0.9rem', fontWeight: 650, color: 'var(--color-text)' }}>
                        <span style={{ color: 'var(--color-muted)', fontWeight: 550 }}>Responsable:</span> {mantenimiento.responsable}
                      </div>
                    )}

                    <div>
                      <span style={{ fontSize: '0.82rem', color: 'var(--color-muted)', fontWeight: 750, display: 'block', marginBottom: '2px' }}>Observaciones:</span>
                      <p style={{ margin: 0, color: 'var(--color-text)' }}>
                        {mantenimiento.observaciones?.trim() || 'Sin observaciones'}
                      </p>
                    </div>

                    {mantenimiento.diagnostico?.trim() && (
                      <div style={{ padding: '12px 14px', background: '#f8fafc', borderLeft: '4px solid #64748b', borderRadius: '4px', marginTop: '4px' }}>
                        <span style={{ fontSize: '0.8rem', color: '#475569', fontWeight: 700, display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Diagnóstico:</span>
                        <p style={{ margin: 0, color: '#334155', fontSize: '0.92rem', lineHeight: '1.4' }}>{mantenimiento.diagnostico}</p>
                      </div>
                    )}

                    {mantenimiento.accionesRealizadas?.trim() && (
                      <div style={{ padding: '12px 14px', background: '#f0fdf4', borderLeft: '4px solid #16a34a', borderRadius: '4px', marginTop: '4px' }}>
                        <span style={{ fontSize: '0.8rem', color: '#166534', fontWeight: 700, display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Acciones Realizadas:</span>
                        <p style={{ margin: 0, color: '#14532d', fontSize: '0.92rem', lineHeight: '1.4' }}>{mantenimiento.accionesRealizadas}</p>
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
};

interface InfoItemProps {
  label: string;
  value: string;
}

const InfoItem = ({ label, value }: InfoItemProps) => (
  <div className="info-item">
    <p className="info-item__label">{label}</p>
    <p className="info-item__value">{value}</p>
  </div>
);
