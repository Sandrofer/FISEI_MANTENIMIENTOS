import { useEffect, useState } from 'react';
import axios from 'axios';
import { getUsuarios, crearUsuario, actualizarUsuario } from '../../services/usuarioService';

interface Usuario {
  id: number;
  nombre: string;
  apellido: string;
  correo: string;
  rol: string;
  activo: boolean;
}

const dominioInstitucional = '@uta.edu.ec';

const normalizarCorreo = (correo: string) => correo.trim().toLowerCase();

const correoInstitucionalValido = (correo: string) =>
  normalizarCorreo(correo).endsWith(dominioInstitucional);

const obtenerMensajeError = (error: unknown, respaldo: string) => {
  if (axios.isAxiosError(error)) {
    const mensaje = error.response?.data?.mensaje;
    if (typeof mensaje === 'string') return mensaje;
  }

  return respaldo;
};

const mensajeEsExito = (mensaje: string) =>
  mensaje.includes('exitosamente') || mensaje.includes('correctamente');

const mensajeEsErrorCorreo = (mensaje: string) => mensaje.startsWith('El correo');

export const UsuariosPage = () => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [usuarioEditando, setUsuarioEditando] = useState<Usuario | null>(null);
  const [mostrarEditar, setMostrarEditar] = useState(false);
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const [passwordConfirmacion, setPasswordConfirmacion] = useState('');
  const [formEditar, setFormEditar] = useState({ nombre: '', apellido: '', correo: '', rol: 'Laboratorista', activo: true });

  const [form, setForm] = useState({
    nombre: '', apellido: '', correo: '', password: '', rol: 'Laboratorista'
  });

  const correoDuplicadoLocal = (correo: string, idIgnorado?: number) => {
    const correoNormalizado = normalizarCorreo(correo);
    return usuarios.some(u => normalizarCorreo(u.correo) === correoNormalizado && u.id !== idIgnorado);
  };

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

  const validarCorreoUsuario = (correo: string, idIgnorado?: number) => {
    if (!correoInstitucionalValido(correo)) {
      setMensaje(`El correo debe ser institucional (${dominioInstitucional})`);
      return false;
    }

    if (correoDuplicadoLocal(correo, idIgnorado)) {
      setMensaje('El correo ya esta registrado');
      return false;
    }

    return true;
  };

  const limpiarErrorCorreoSiYaEsValido = (correo: string, idIgnorado?: number) => {
    if (
      mensajeEsErrorCorreo(mensaje) &&
      correoInstitucionalValido(correo) &&
      !correoDuplicadoLocal(correo, idIgnorado)
    ) {
      setMensaje('');
    }
  };

  const handleCrear = async (e: React.FormEvent) => {
    e.preventDefault();

    const correo = normalizarCorreo(form.correo);
    if (!validarCorreoUsuario(correo)) return;

    try {
      await crearUsuario({ ...form, correo });
      setMensaje('Usuario creado exitosamente');
      setMostrarForm(false);
      setForm({ nombre: '', apellido: '', correo: '', password: '', rol: 'Laboratorista' });
      cargar();
    } catch (error) {
      setMensaje(obtenerMensajeError(error, 'Error al crear usuario'));
    }
  };

  const handleEditarClick = (usuario: Usuario) => {
    setUsuarioEditando(usuario);
    setFormEditar({
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      correo: usuario.correo,
      rol: usuario.rol,
      activo: usuario.activo
    });
    setPasswordConfirmacion('');
    setMostrarConfirmacion(false);
    setMostrarEditar(true);
  };

  const cerrarEdicion = () => {
    setMostrarEditar(false);
    setMostrarConfirmacion(false);
    setUsuarioEditando(null);
    setPasswordConfirmacion('');
  };

  const handleGuardarEdicion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuarioEditando) return;

    if (!validarCorreoUsuario(formEditar.correo, usuarioEditando.id)) return;

    setPasswordConfirmacion('');
    setMostrarConfirmacion(true);
  };

  const confirmarGuardado = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuarioEditando) return;

    if (!passwordConfirmacion.trim()) {
      setMensaje('Ingresa tu contrasena para confirmar los cambios');
      return;
    }

    setGuardando(true);
    try {
      await actualizarUsuario(usuarioEditando.id, {
        ...formEditar,
        correo: normalizarCorreo(formEditar.correo),
        passwordConfirmacion
      });
      setMensaje('Usuario actualizado correctamente');
      cerrarEdicion();
      cargar();
    } catch (error) {
      setMensaje(obtenerMensajeError(error, 'Error al actualizar usuario'));
    } finally {
      setGuardando(false);
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
        <div className={`alert ${mensajeEsExito(mensaje) ? 'alert--success' : 'alert--error'} mb-20`}>
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
              onChange={e => setForm({ ...form, nombre: e.target.value })}
              required
            />
          </div>
          <div className="form-field">
            <label className="form-label" htmlFor="apellido">Apellido</label>
            <input
              id="apellido"
              className="form-input"
              value={form.apellido}
              onChange={e => setForm({ ...form, apellido: e.target.value })}
              required
            />
          </div>
          <div className="form-field form-field--full">
            <label className="form-label" htmlFor="correo">Correo institucional</label>
            <input
              id="correo"
              type="email"
              className="form-input"
              value={form.correo}
              onChange={e => {
                const correo = e.target.value;
                setForm({ ...form, correo });
                limpiarErrorCorreoSiYaEsValido(correo);
              }}
              placeholder="usuario@uta.edu.ec"
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
              onChange={e => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>
          <div className="form-field">
            <label className="form-label" htmlFor="rol">Rol</label>
            <select
              id="rol"
              className="form-select"
              value={form.rol}
              onChange={e => setForm({ ...form, rol: e.target.value })}
            >
              <option value="Laboratorista">Laboratorista</option>
              <option value="Administrador">Administrador</option>
            </select>
          </div>
          <div className="form-actions form-field--full">
            <button type="submit" className="btn btn--primary">
              Crear Usuario
            </button>
          </div>
        </form>
      )}

      {mostrarEditar && usuarioEditando && (
        <div className="modal-backdrop">
          <form onSubmit={handleGuardarEdicion} className="user-modal">
            <div className="user-modal__header">
              <h3>Editar Usuario</h3>
              <button type="button" onClick={cerrarEdicion} className="modal-close" aria-label="Cerrar">
                x
              </button>
            </div>

            {mensaje && mensajeEsErrorCorreo(mensaje) && (
              <div className="alert alert--error user-modal__alert">
                {mensaje}
              </div>
            )}

            <div className="form-grid">
              <div className="form-field">
                <label className="form-label" htmlFor="edit-nombre">Nombre</label>
                <input
                  id="edit-nombre"
                  className="form-input"
                  value={formEditar.nombre}
                  onChange={e => setFormEditar({ ...formEditar, nombre: e.target.value })}
                  required
                />
              </div>
              <div className="form-field">
                <label className="form-label" htmlFor="edit-apellido">Apellido</label>
                <input
                  id="edit-apellido"
                  className="form-input"
                  value={formEditar.apellido}
                  onChange={e => setFormEditar({ ...formEditar, apellido: e.target.value })}
                  required
                />
              </div>
              <div className="form-field form-field--full">
                <label className="form-label" htmlFor="edit-correo">Correo institucional</label>
                <input
                  id="edit-correo"
                  type="email"
                  className="form-input"
                  value={formEditar.correo}
                  onChange={e => {
                    const correo = e.target.value;
                    setFormEditar({ ...formEditar, correo });
                    limpiarErrorCorreoSiYaEsValido(correo, usuarioEditando.id);
                  }}
                  placeholder="usuario@uta.edu.ec"
                  required
                />
              </div>
              <div className="form-field form-field--full">
                <label className="form-label" htmlFor="edit-rol">Rol</label>
                <select
                  id="edit-rol"
                  className="form-select"
                  value={formEditar.rol}
                  onChange={e => setFormEditar({ ...formEditar, rol: e.target.value })}
                >
                  <option value="Administrador">Administrador</option>
                  <option value="Laboratorista">Laboratorista</option>
                </select>
              </div>
            </div>

            <div className="user-modal__footer">
              <button type="button" onClick={cerrarEdicion} className="btn btn--outline">
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => setFormEditar({ ...formEditar, activo: !formEditar.activo })}
                className="btn btn--warning"
              >
                {formEditar.activo ? 'Suspender Usuario' : 'Activar Usuario'}
              </button>
              <button type="submit" className="btn btn--danger">
                Guardar Cambios
              </button>
            </div>
          </form>
        </div>
      )}

      {mostrarConfirmacion && usuarioEditando && (
        <div className="modal-backdrop modal-backdrop--top">
          <form onSubmit={confirmarGuardado} className="confirm-modal">
            <h3>Seguro quieres cambiar?</h3>
            <p>Para generar los cambios de {usuarioEditando.nombre} {usuarioEditando.apellido}, ingresa tu contrasena.</p>
            <div className="form-field">
              <label className="form-label" htmlFor="confirm-password">Contrasena</label>
              <input
                id="confirm-password"
                type="password"
                className="form-input"
                value={passwordConfirmacion}
                onChange={e => setPasswordConfirmacion(e.target.value)}
                autoFocus
                required
              />
            </div>
            <div className="form-actions">
              <button type="button" onClick={() => setMostrarConfirmacion(false)} className="btn btn--outline">
                Cancelar
              </button>
              <button type="submit" className="btn btn--danger" disabled={guardando}>
                {guardando ? 'Guardando...' : 'Confirmar Cambios'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="table-card">
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Correo</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {cargando ? (
                <tr><td colSpan={5} className="state-box">Cargando...</td></tr>
              ) : usuarios.map(u => (
                <tr key={u.id}>
                  <td>
                    <div className="cell-title">{u.nombre} {u.apellido}</div>
                  </td>
                  <td>{u.correo}</td>
                  <td>
                    <span className={`badge ${u.rol === 'Administrador' ? 'badge--primary' : 'badge--success'}`}>
                      {u.rol}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${u.activo ? 'badge--success' : 'badge--error'}`}>
                      {u.activo ? 'Activo' : 'Suspendido'}
                    </span>
                  </td>
                  <td>
                    <button onClick={() => handleEditarClick(u)} className="btn btn--secondary btn--sm">
                      Editar
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
