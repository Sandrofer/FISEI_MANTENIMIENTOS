import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AxiosError } from 'axios';
import { obtenerEquipos } from '../../services/inventarioService';
import type { Equipo } from '../../services/inventarioService';

interface InventarioPageProps {
  basePath?: '/admin' | '/lab';
}

export const InventarioPage = ({ basePath = '/admin' }: InventarioPageProps) => {
  const navigate = useNavigate();
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cargarEquipos = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await obtenerEquipos();
        setEquipos(data);
      } catch (err) {
        const axiosError = err as AxiosError;
        setError(axiosError.response ? 'No se pudo cargar el inventario.' : 'No hay conexion con el servicio de inventario.');
      } finally {
        setLoading(false);
      }
    };

    cargarEquipos();
  }, []);

  if (loading) {
    return <div className="state-box card">Cargando inventario...</div>;
  }

  if (error) {
    return <div className="alert alert--error">{error}</div>;
  }

  return (
    <section className="page-section">
      <div className="section-header">
        <div>
          <p className="section-kicker">Activos tecnologicos</p>
          <h2 className="section-title">Inventario</h2>
          <p className="section-description">Equipos registrados en el sistema y acceso a sus hojas de vida.</p>
        </div>
        <button onClick={() => navigate(`${basePath}/registrar-equipo`)} className="btn btn--primary">
          Registrar equipo
        </button>
      </div>

      <div className="table-card">
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Serie</th>
                <th>Equipo</th>
                <th>Laboratorio</th>
                <th>Estado</th>
                <th className="data-table__right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {equipos.length === 0 ? (
                <tr>
                  <td colSpan={5} className="state-box">
                    No hay equipos registrados.
                  </td>
                </tr>
              ) : (
                equipos.map((equipo) => (
                  <tr key={equipo.id}>
                    <td>
                      <span className="cell-title">{equipo.numeroSerie}</span>
                    </td>
                    <td>
                      <div className="cell-title">{equipo.marca} {equipo.modelo}</div>
                      <div className="cell-subtitle">{equipo.procesador}</div>
                    </td>
                    <td>{equipo.laboratorio}</td>
                    <td>
                      <span className="badge badge--success">{equipo.estado}</span>
                    </td>
                    <td className="data-table__right">
                      <button
                        onClick={() => navigate(`${basePath}/inventario/${equipo.id}/hoja-vida`)}
                        className="btn btn--outline btn--sm"
                      >
                        Ver hoja de vida
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};
