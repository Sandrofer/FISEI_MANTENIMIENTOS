import { useEffect, useState } from 'react';
import { getUsuarios, crearUsuario, actualizarRol } from '../../services/usuarioService';

interface Usuario {
  id: number;
  nombre: string;
  apellido: string;
  correo: string;
  rol: string;
  activo: boolean;
}

export const UsuariosPage = () => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [cargando, setCargando] = useState(false);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [mensaje, setMensaje] = useState('');

  const [form, setForm] = useState({
    nombre: '', apellido: '', correo: '', password: '', rol: 'Laboratorista'
  });

  const cargar = async () => {
    setCargando(true);
    try {
      const data = await getUsuarios(pagina);
      setUsuarios(data.datos);
      setTotal(data.total);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargar(); }, [pagina]);

  const handleCrear = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await crearUsuario(form);
      setMensaje('Usuario creado exitosamente');
      setMostrarForm(false);
      setForm({ nombre: '', apellido: '', correo: '', password: '', rol: 'Laboratorista' });
      cargar();
    } catch {
      setMensaje('Error al crear usuario');
    }
  };

  const handleRol = async (id: number, rolActual: string) => {
    const nuevoRol = rolActual === 'Administrador' ? 'Laboratorista' : 'Administrador';
    try {
      await actualizarRol(id, nuevoRol);
      setMensaje('Rol actualizado correctamente');
      cargar();
    } catch {
      setMensaje('Error al actualizar rol');
    }
  };

  return (
    <section className="page-section">
      <div className="section-header">
        <div>
          <p className="section-kicker">Administracion</p>
          <h2 className="section-title">Gestion de Usuarios</h2>
          <p className="section-description">Control de perfiles, roles y accesos del sistema.</p>
        </div>
        <button onClick={() => setMostrarForm(!mostrarForm)} className="btn btn--primary">
          {mostrarForm ? 'Cancelar' : '+ Nuevo Usuario'}
        </button>
      </div>

      {mensaje && (
        <div className={`alert ${mensaje.startsWith('Error') ? 'alert--error' : 'alert--success'} mb-20`}>
          {mensaje}
        </div>
      )}

      {mostrarForm && (
        <form onSubmit={handleCrear} className="card card--padded form-grid users-form">
          <div className="form-field">
            <label className="form-label" htmlFor="nombre">Nombre</label>
            <input
              id="nombre"
              className="form-input"
              value={form.nombre}
              onChange={e => setForm({...form, nombre: e.target.value})}
              required
            />
          </div>
          <div className="form-field">
            <label className="form-label" htmlFor="apellido">Apellido</label>
            <input
              id="apellido"
              className="form-input"
              value={form.apellido}
              onChange={e => setForm({...form, apellido: e.target.value})}
              required
            />
          </div>
          <div className="form-field">
            <label className="form-label" htmlFor="correo">Correo</label>
            <input
              id="correo"
              type="email"
              className="form-input"
              value={form.correo}
              onChange={e => setForm({...form, correo: e.target.value})}
              required
            />
          </div>
          <div className="form-field">
            <label className="form-label" htmlFor="password">Contrasena</label>
            <input
              id="password"
              type="password"
              className="form-input"
              value={form.password}
              onChange={e => setForm({...form, password: e.target.value})}
              required
            />
          </div>
          <div className="form-field">
            <label className="form-label" htmlFor="rol">Rol</label>
            <select
              id="rol"
              className="form-select"
              value={form.rol}
              onChange={e => setForm({...form, rol: e.target.value})}
            >
              <option value="Laboratorista">Laboratorista</option>
              <option value="Administrador">Administrador</option>
            </select>
          </div>
          <div className="form-field">
            <label className="form-label">&nbsp;</label>
            <button type="submit" className="btn btn--primary btn--full">
              Crear Usuario
            </button>
          </div>
        </form>
      )}

      <div className="table-card">
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Correo</th>
                <th>Rol</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {cargando ? (
                <tr><td colSpan={4} className="state-box">Cargando...</td></tr>
              ) : usuarios.map(u => (
                <tr key={u.id}>
                  <td>
                    <div className="cell-title">{u.nombre} {u.apellido}</div>
                    <div className="cell-subtitle">{u.activo ? 'Usuario activo' : 'Usuario inactivo'}</div>
                  </td>
                  <td>{u.correo}</td>
                  <td>
                    <span className={`badge ${u.rol === 'Administrador' ? 'badge--primary' : 'badge--success'}`}>
                      {u.rol}
                    </span>
                  </td>
                  <td>
                    <button onClick={() => handleRol(u.id, u.rol)} className="btn btn--secondary btn--sm">
                      Cambiar a {u.rol === 'Administrador' ? 'Laboratorista' : 'Administrador'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="pagination">
          <span className="pagination__page">Total: {total} usuarios</span>
          <div className="pagination__controls">
            <button
              onClick={() => setPagina(p => Math.max(1, p - 1))}
              disabled={pagina === 1}
              className="btn btn--outline btn--sm"
            >
              Anterior
            </button>
            <span className="pagination__page">Pagina {pagina}</span>
            <button
              onClick={() => setPagina(p => p + 1)}
              disabled={pagina * 10 >= total}
              className="btn btn--outline btn--sm"
            >
              Siguiente
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
