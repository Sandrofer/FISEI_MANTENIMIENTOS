import { useState, useEffect } from 'react';
import { registrarEquipo } from '../../services/inventarioService';
import type { CrearEquipoDto } from '../../services/inventarioService';
import axios from 'axios';

const API_INVENTARIO = 'http://localhost:5064/api/inventario';

export default function RegistrarEquipoPage() {
  const [categorias, setCategorias] = useState<any[]>([]);
  const [marcas, setMarcas] = useState<any[]>([]);
  const [ubicaciones, setUbicaciones] = useState<any[]>([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('');

  const [form, setForm] = useState<CrearEquipoDto>({
    codigoInventario: '',
    numeroSerie: '',
    nombreModelo: '',
    categoriaId: 0,
    marcaId: 0,
    ubicacionId: 0,
    estado: 'Operativo',
    responsableId: 1,
    especificacionesTecnicas: '{}',
  });

  const [especificaciones, setEspecificaciones] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    axios.get(`${API_INVENTARIO}/categorias`).then(r => setCategorias(r.data)).catch(() => {});
    axios.get(`${API_INVENTARIO}/marcas`).then(r => setMarcas(r.data)).catch(() => {});
    axios.get(`${API_INVENTARIO}/ubicaciones`).then(r => setUbicaciones(r.data)).catch(() => {});
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'categoriaId') {
      const cat = categorias.find(c => c.id == value);
      setCategoriaSeleccionada(cat?.nombre || '');
      setEspecificaciones({});
    }
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleEspecificacionChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEspecificaciones((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMensaje(null);
    try {
      await registrarEquipo({
        ...form,
        categoriaId: Number(form.categoriaId),
        marcaId: Number(form.marcaId),
        ubicacionId: Number(form.ubicacionId),
        responsableId: Number(form.responsableId),
        especificacionesTecnicas: JSON.stringify(especificaciones),
      });
      setMensaje('Equipo registrado correctamente');
      setForm({
        codigoInventario: '', numeroSerie: '', nombreModelo: '',
        categoriaId: 0, marcaId: 0, ubicacionId: 0,
        estado: 'Operativo', responsableId: 1, especificacionesTecnicas: '{}',
      });
      setEspecificaciones({});
      setCategoriaSeleccionada('');
    } catch (err: any) {
      setError(err.response?.data?.mensaje || 'Error al registrar equipo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-shell">
      <div className="register-container">
        <section className="section-header">
          <h1 className="section-title">Registrar Equipo</h1>
          <p className="section-description">Complete los datos del activo tecnológico.</p>
        </section>

        <section className="card register-card">
          <form onSubmit={handleSubmit} className="form-grid">
            {/* CAMPOS GENERALES */}
            <div className="form-field">
              <label className="form-label">Código Inventario</label>
              <input name="codigoInventario" value={form.codigoInventario} onChange={handleChange} className="form-input" required />
            </div>
            <div className="form-field">
              <label className="form-label">Número de Serie</label>
              <input name="numeroSerie" value={form.numeroSerie} onChange={handleChange} className="form-input" required />
            </div>
            <div className="form-field">
              <label className="form-label">Nombre / Modelo</label>
              <input name="nombreModelo" value={form.nombreModelo} onChange={handleChange} className="form-input" required />
            </div>

            {/* CATEGORÍA */}
            <div className="form-field">
              <label className="form-label">Categoría</label>
              <select name="categoriaId" value={form.categoriaId} onChange={handleChange} className="form-select" required>
                <option value="0">Seleccione</option>
                {categorias.map((c: any) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            </div>

            {/* CAMPOS DINÁMICOS POR CATEGORÍA */}
            {categoriaSeleccionada === 'Computadora' && (
              <>
                <div className="form-field">
                  <label className="form-label">Procesador</label>
                  <input name="procesador" value={especificaciones.procesador || ''} onChange={handleEspecificacionChange} className="form-input" placeholder="Ej: Intel Core i7" />
                </div>
                <div className="form-field">
                  <label className="form-label">RAM</label>
                  <input name="ram" value={especificaciones.ram || ''} onChange={handleEspecificacionChange} className="form-input" placeholder="Ej: 16 GB" />
                </div>
                <div className="form-field">
                  <label className="form-label">Almacenamiento</label>
                  <input name="almacenamiento" value={especificaciones.almacenamiento || ''} onChange={handleEspecificacionChange} className="form-input" placeholder="Ej: 512 GB SSD" />
                </div>
                <div className="form-field">
                  <label className="form-label">Sistema Operativo</label>
                  <input name="sistemaOperativo" value={especificaciones.sistemaOperativo || ''} onChange={handleEspecificacionChange} className="form-input" placeholder="Ej: Windows 11" />
                </div>

              </>
            )}

            {categoriaSeleccionada === 'Periférico' && (
              <div className="form-field">
                <label className="form-label">Tipo de Periférico</label>
                <select name="tipoPeriferico" value={especificaciones.tipoPeriferico || ''} onChange={handleEspecificacionChange} className="form-select">
                  <option value="">Seleccione</option>
                  <option value="Teclado">Teclado</option>
                  <option value="Mouse">Mouse</option>
                  <option value="Monitor">Monitor</option>
                  <option value="Impresora">Impresora</option>
                  <option value="Proyector">Proyector</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>
            )}

            {categoriaSeleccionada === 'Red' && (
              <>
                <div className="form-field">
                  <label className="form-label">Tipo de Dispositivo</label>
                  <select name="tipoDispositivoRed" value={especificaciones.tipoDispositivoRed || ''} onChange={handleEspecificacionChange} className="form-select">
                    <option value="">Seleccione</option>
                    <option value="Switch">Switch</option>
                    <option value="Router">Router</option>
                    <option value="Access Point">Access Point</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>
                <div className="form-field">
                  <label className="form-label">Número de Puertos</label>
                  <input name="numeroPuertos" type="number" value={especificaciones.numeroPuertos || ''} onChange={handleEspecificacionChange} className="form-input" placeholder="Ej: 24" />
                </div>
                <div className="form-field">
                  <label className="form-label">Velocidad</label>
                  <input name="velocidadRed" value={especificaciones.velocidadRed || ''} onChange={handleEspecificacionChange} className="form-input" placeholder="Ej: 1 Gbps" />
                </div>
              </>
            )}
                        {(categoriaSeleccionada === 'Impresora' || categoriaSeleccionada === 'Proyector') && (
              <div className="form-field">
                <label className="form-label">Tipo de {categoriaSeleccionada}</label>
                <select name="tipoPeriferico" value={especificaciones.tipoPeriferico || ''} onChange={handleEspecificacionChange} className="form-select">
                  <option value="">Seleccione</option>
                  {categoriaSeleccionada === 'Impresora' && (
                    <>
                      <option value="Láser">Láser</option>
                      <option value="Tinta">Tinta</option>
                      <option value="Multifuncional">Multifuncional</option>
                    </>
                  )}
                  {categoriaSeleccionada === 'Proyector' && (
                    <>
                      <option value="LCD">LCD</option>
                      <option value="DLP">DLP</option>
                      <option value="LED">LED</option>
                    </>
                  )}
                  <option value="Otro">Otro</option>
                </select>
              </div>
            )}

            {/* MARCA Y UBICACIÓN */}
            <div className="form-field">
              <label className="form-label">Marca</label>
              <select name="marcaId" value={form.marcaId} onChange={handleChange} className="form-select" required>
                <option value="0">Seleccione</option>
                {marcas.map((m: any) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
              </select>
            </div>
            <div className="form-field">
              <label className="form-label">Ubicación</label>
              <select name="ubicacionId" value={form.ubicacionId} onChange={handleChange} className="form-select" required>
                <option value="0">Seleccione</option>
                {ubicaciones.map((u: any) => <option key={u.id} value={u.id}>{u.nombre}</option>)}
              </select>
            </div>
            <div className="form-field">
              <label className="form-label">Estado</label>
              <select name="estado" value={form.estado} onChange={handleChange} className="form-select">
                <option value="Operativo">Operativo</option>
                <option value="En reparación">En reparación</option>
                <option value="Dado de baja">Dado de baja</option>
              </select>
            </div>

            <div className="form-actions form-field--full">
              <button type="submit" disabled={loading} className="btn btn--primary">
                {loading ? 'Registrando...' : 'Registrar Equipo'}
              </button>
            </div>
          </form>
          {mensaje && <div className="alert alert--success mt-16">{mensaje}</div>}
          {error && <div className="alert alert--error mt-16">{error}</div>}
        </section>
      </div>
    </div>
  );
}