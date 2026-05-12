import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AxiosError } from 'axios';
import { getHojaVidaEquipo } from '../../services/inventarioService';
import type { HojaVida } from '../../services/inventarioService';

export const HojaVidaPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [hojaVida, setHojaVida] = useState<HojaVida | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const formatDate = (value: string) => new Intl.DateTimeFormat('es-EC', {
    year: 'numeric',
    month: 'long',
    day: '2-digit',
  }).format(new Date(`${value}T00:00:00`));

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
            <button onClick={() => navigate('/admin')} className="btn btn--primary mt-16">
              Volver
            </button>
          </section>
        </div>
      </main>
    );
  }

  const { equipo, mantenimientos } = hojaVida;

  return (
    <main className="resource-page">
      <div className="resource-container">
        <div className="section-header">
          <div>
            <Link to="/admin" className="back-link">Volver al panel</Link>
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
          <div className="section-header">
            <div>
              <p className="section-kicker">Historial</p>
              <h2 className="section-title">Mantenimientos</h2>
            </div>
          </div>

          {mantenimientos.length === 0 ? (
            <div className="empty-panel">Sin mantenimientos registrados</div>
          ) : (
            <div className="timeline">
              {mantenimientos.map((mantenimiento) => (
                <article key={mantenimiento.id} className="timeline-item">
                  <div className="timeline-item__header">
                    <h3 className="timeline-item__title">{formatDate(mantenimiento.fechaProgramada)}</h3>
                    <span className="badge badge--primary">{mantenimiento.estado}</span>
                  </div>
                  <p className="timeline-item__text">
                    {mantenimiento.observaciones?.trim() || 'Sin observaciones'}
                  </p>
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
