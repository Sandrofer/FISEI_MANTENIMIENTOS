import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AxiosError } from 'axios';
import { obtenerEquipos } from '../../services/inventarioService';
import type { Equipo, FiltrosEquipo } from '../../services/inventarioService';

interface InventarioPageProps {
  basePath?: '/admin' | '/lab';
}

export const InventarioPage = ({ basePath = '/admin' }: InventarioPageProps) => {
  const navigate = useNavigate();
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados de filtros
  const [estado, setEstado] = useState('');
  const [procesador, setProcesador] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');

  const cargarEquipos = async (filtros?: FiltrosEquipo) => {
    try {
      setLoading(true);
      setError(null);
      const data = await obtenerEquipos(filtros);
      setEquipos(data);
    } catch (err) {
      const axiosError = err as AxiosError;
      setError(axiosError.response ? 'No se pudo cargar el inventario.' : 'No hay conexion con el servicio de inventario.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarEquipos();
  }, []);

  const handleBuscar = (e: React.FormEvent) => {
    e.preventDefault();
    const filtros: FiltrosEquipo = {};
    if (estado) filtros.estado = estado;
    if (procesador) filtros.procesador = procesador;
    if (fechaDesde) filtros.fechaDesde = fechaDesde;
    if (fechaHasta) filtros.fechaHasta = fechaHasta;
    cargarEquipos(filtros);
  };

  const handleLimpiar = () => {
    setEstado('');
    setProcesador('');
    setFechaDesde('');
    setFechaHasta('');
    cargarEquipos();
  };

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

      {/* Barra de Filtros de Búsqueda Avanzada */}
      <div className="card card--padded mb-20">
        <form onSubmit={handleBuscar} className="form-grid">
          <div className="form-field">
            <label className="form-label" htmlFor="estado-filter">Estado</label>
            <select
              id="estado-filter"
              className="form-select"
              value={estado}
              onChange={(e) => setEstado(e.target.value)}
            >
              <option value="">Todos</option>
              <option value="Operativo">Operativo</option>
              <option value="En mantenimiento">En mantenimiento</option>
              <option value="Dado de baja">Dado de baja</option>
            </select>
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor="procesador-filter">Procesador</label>
            <select
              id="procesador-filter"
              className="form-select"
              value={procesador}
              onChange={(e) => setProcesador(e.target.value)}
            >
              <option value="">Todos</option>
              <option value="Intel Core i3">Intel Core i3</option>
              <option value="Intel Core i5">Intel Core i5</option>
              <option value="Intel Core i7">Intel Core i7</option>
              <option value="Intel Core i9">Intel Core i9</option>
              <option value="AMD Ryzen 5">AMD Ryzen 5</option>
              <option value="AMD Ryzen 7">AMD Ryzen 7</option>
              <option value="Otro">Otro</option>
            </select>
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor="fecha-desde-filter">Comprado desde</label>
            <input
              id="fecha-desde-filter"
              type="date"
              className="form-input"
              value={fechaDesde}
              onChange={(e) => setFechaDesde(e.target.value)}
            />
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor="fecha-hasta-filter">Comprado hasta</label>
            <input
              id="fecha-hasta-filter"
              type="date"
              className="form-input"
              value={fechaHasta}
              onChange={(e) => setFechaHasta(e.target.value)}
            />
          </div>

          <div className="form-field form-field--full form-actions" style={{ marginTop: '8px' }}>
            <button type="button" onClick={handleLimpiar} className="btn btn--outline">
              Limpiar filtros
            </button>
            <button type="submit" className="btn btn--primary">
              Buscar
            </button>
          </div>
        </form>
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
                    No se encontraron equipos con los filtros seleccionados.
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
                      <span className={`badge ${
                        equipo.estado === 'Operativo' ? 'badge--success' :
                        equipo.estado === 'En mantenimiento' ? 'badge--primary' :
                        'badge--neutral'
                      }`}>{equipo.estado}</span>
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
