import { useState } from 'react';
import { registrarEquipo } from '../../services/inventarioService';
import type { CrearEquipoDto, EquipoResponse } from '../../services/inventarioService';

export default function RegistrarEquipoPage() {
  const [form, setForm] = useState<CrearEquipoDto>({
    numeroSerie: '',
    marca: '',
    modelo: '',
    procesador: '',
    laboratorio: '',
    fechaCompra: '',
  });

  const [loading, setLoading] = useState(false);
  const [exito, setExito] = useState<EquipoResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setExito(null);

    try {
      const resultado = await registrarEquipo(form);
      setExito(resultado);
    } catch (err: any) {
      if (err.response?.status === 409) {
        setError(`Advertencia: ${err.response.data.mensaje}`);
      } else {
        setError('Error al registrar el equipo. Intente de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-shell">
      <div className="register-container">
        <section className="section-header">
          <div>
            <p className="section-kicker">Inventario institucional</p>
            <h1 className="section-title">Registrar Equipo</h1>
            <p className="section-description">
              Complete la informacion del activo tecnologico para incorporarlo al inventario.
            </p>
          </div>
        </section>

        <section className="card register-card">
          <form onSubmit={handleSubmit} className="form-grid">
            <div className="form-field">
              <label className="form-label" htmlFor="numeroSerie">Numero de Serie</label>
              <input
                id="numeroSerie"
                name="numeroSerie"
                value={form.numeroSerie}
                onChange={handleChange}
                className="form-input"
                placeholder="Ej: DELL-001"
                required
              />
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="marca">Marca</label>
              <input
                id="marca"
                name="marca"
                value={form.marca}
                onChange={handleChange}
                className="form-input"
                placeholder="Ej: Dell"
                required
              />
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="modelo">Modelo</label>
              <input
                id="modelo"
                name="modelo"
                value={form.modelo}
                onChange={handleChange}
                className="form-input"
                placeholder="Ej: Inspiron 15"
                required
              />
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="procesador">Procesador</label>
              <input
                id="procesador"
                name="procesador"
                value={form.procesador}
                onChange={handleChange}
                className="form-input"
                placeholder="Ej: Intel Core i5"
                required
              />
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="laboratorio">Laboratorio</label>
              <select
                id="laboratorio"
                name="laboratorio"
                value={form.laboratorio}
                onChange={handleChange}
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
              <label className="form-label" htmlFor="fechaCompra">Fecha de Compra</label>
              <input
                id="fechaCompra"
                name="fechaCompra"
                type="date"
                value={form.fechaCompra}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>

            <div className="form-actions form-field--full">
              <button type="submit" disabled={loading} className="btn btn--primary">
                {loading ? 'Registrando...' : 'Registrar Equipo'}
              </button>
            </div>
          </form>

          {error && (
            <div className="alert alert--error mt-16">
              {error}
            </div>
          )}

          {exito && (
            <div className="alert alert--success mt-16">
              <p><strong>Equipo registrado exitosamente</strong></p>
              <p>Serie: {exito.numeroSerie} - {exito.marca} {exito.modelo}</p>
              <p><strong>Mantenimientos programados:</strong></p>
              <ul className="result-list">
                {exito.mantenimientos.map(m => (
                  <li key={m.id}>{m.fechaProgramada} - {m.estado}</li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
