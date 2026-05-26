import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AxiosError } from 'axios';
import { actualizarEquipo, eliminarEquipo, obtenerEquipos } from '../../services/inventarioService';
import type { ActualizarEquipoDto, Equipo, FiltrosEquipo } from '../../services/inventarioService';

interface InventarioPageProps {
  basePath?: '/admin' | '/lab';
}

export const InventarioPage = ({ basePath = '/admin' }: InventarioPageProps) => {
  const navigate = useNavigate();
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [equipoEditando, setEquipoEditando] = useState<Equipo | null>(null);
  const [formEdicion, setFormEdicion] = useState<ActualizarEquipoDto>({
    numeroSerie: '',
    marca: '',
    modelo: '',
    procesador: '',
    laboratorio: '',
    fechaCompra: '',
    estado: 'Activo'
  });

  // Estados de filtros
  const [estado, setEstado] = useState('');
  const [procesador, setProcesador] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');

  const cargarEquipos = async (filtros?: FiltrosEquipo) => {
    try {
      setLoading(true);
      setError(null);
      setMensaje(null);
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

  const abrirEdicion = (equipo: Equipo) => {
    setError(null);
    setMensaje(null);
    setEquipoEditando(equipo);
    setFormEdicion({
      numeroSerie: equipo.numeroSerie,
      marca: equipo.marca,
      modelo: equipo.modelo,
      procesador: equipo.procesador,
      laboratorio: equipo.laboratorio,
      fechaCompra: equipo.fechaCompra,
      estado: equipo.estado
    });
  };

  const cerrarEdicion = () => {
    setEquipoEditando(null);
    setError(null);
  };

  const handleEditarChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormEdicion({ ...formEdicion, [e.target.name]: e.target.value });
  };

  const handleGuardarEdicion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!equipoEditando) return;

    try {
      setSaving(true);
      setError(null);
      setMensaje(null);
      const actualizado = await actualizarEquipo(equipoEditando.id, formEdicion);
      setEquipos((prev) => prev.map((equipo) => equipo.id === actualizado.id ? actualizado : equipo));
      setEquipoEditando(null);
      setMensaje('Equipo actualizado correctamente.');
    } catch (err: any) {
      const detalle = err.response?.data?.mensaje || err.response?.data?.detalle || err.message;
      setError(`No se pudo actualizar el equipo. ${detalle ?? ''}`.trim());
    } finally {
      setSaving(false);
    }
  };

  const handleEliminar = async (equipo: Equipo) => {
    const confirmado = window.confirm(`Desea eliminar el equipo ${equipo.numeroSerie}?`);
    if (!confirmado) return;

    try {
      setSaving(true);
      setError(null);
      setMensaje(null);
      await eliminarEquipo(equipo.id);
      setEquipos((prev) => prev.filter((item) => item.id !== equipo.id));
      if (equipoEditando?.id === equipo.id) setEquipoEditando(null);
      setMensaje('Equipo eliminado correctamente.');
    } catch (err: any) {
      const detalle = err.response?.data?.mensaje || err.response?.data?.detalle || err.message;
      setError(`No se pudo eliminar el equipo. ${detalle ?? ''}`.trim());
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="state-box card">Cargando inventario...</div>;
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
      {mensaje && (
        <div className="alert alert--success mb-20">
          {mensaje}
        </div>
      )}

      {error && (
        <div className="alert alert--error mb-20">
          {error}
        </div>
      )}

      {equipoEditando && (
        <div className="card card--padded mb-20">
          <div className="section-header">
            <div>
              <p className="section-kicker">Gestion de equipo</p>
              <h3 className="section-title">Editar {equipoEditando.numeroSerie}</h3>
              <p className="section-description">Actualice los datos del activo seleccionado.</p>
            </div>
            <button type="button" onClick={cerrarEdicion} className="btn btn--outline">
              Cancelar
            </button>
          </div>

          <form onSubmit={handleGuardarEdicion} className="form-grid">
            <div className="form-field">
              <label className="form-label" htmlFor="edit-numeroSerie">Numero de Serie</label>
              <input
                id="edit-numeroSerie"
                name="numeroSerie"
                value={formEdicion.numeroSerie}
                onChange={handleEditarChange}
                className="form-input"
                required
              />
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="edit-marca">Marca</label>
              <input
                id="edit-marca"
                name="marca"
                value={formEdicion.marca}
                onChange={handleEditarChange}
                className="form-input"
                required
              />
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="edit-modelo">Modelo</label>
              <input
                id="edit-modelo"
                name="modelo"
                value={formEdicion.modelo}
                onChange={handleEditarChange}
                className="form-input"
                required
              />
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="edit-procesador">Procesador</label>
              <input
                id="edit-procesador"
                name="procesador"
                value={formEdicion.procesador}
                onChange={handleEditarChange}
                className="form-input"
                required
              />
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="edit-laboratorio">Laboratorio</label>
              <select
                id="edit-laboratorio"
                name="laboratorio"
                value={formEdicion.laboratorio}
                onChange={handleEditarChange}
                className="form-select"
                required
              >
                <option value="">Seleccione un laboratorio</option>
                <option value="Laboratorio 1">Laboratorio 1</option>
                <option value="Laboratorio 2">Laboratorio 2</option>
                <option value="Laboratorio 3">Laboratorio 3</option>
                <option value="Laboratorio 4">Laboratorio 4</option>
              </select>
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="edit-estado">Estado</label>
              <select
                id="edit-estado"
                name="estado"
                value={formEdicion.estado}
                onChange={handleEditarChange}
                className="form-select"
                required
              >
                <option value="Activo">Activo</option>
                <option value="Inactivo">Inactivo</option>
                <option value="En reparación">En reparación</option>
              </select>
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="edit-fechaCompra">Fecha de Compra</label>
              <input
                id="edit-fechaCompra"
                name="fechaCompra"
                type="date"
                value={formEdicion.fechaCompra}
                onChange={handleEditarChange}
                className="form-input"
                required
              />
            </div>

            <div className="form-actions form-field--full">
              <button type="button" onClick={cerrarEdicion} className="btn btn--outline">
                Cancelar
              </button>
              <button type="submit" disabled={saving} className="btn btn--primary">
                {saving ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </form>
        </div>
      )}

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
              <option value="Activo">Activo</option>
              <option value="Inactivo">Inactivo</option>
              <option value="En reparación">En reparación</option>
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
                        equipo.estado === 'Activo' ? 'badge--success' :
                        equipo.estado === 'En reparación' ? 'badge--primary' :
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
                      <button
                        type="button"
                        onClick={() => abrirEdicion(equipo)}
                        className="btn btn--outline btn--sm"
                        style={{ marginLeft: '8px' }}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEliminar(equipo)}
                        disabled={saving}
                        className="btn btn--outline btn--sm"
                        style={{ marginLeft: '8px' }}
                      >
                        Eliminar
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
