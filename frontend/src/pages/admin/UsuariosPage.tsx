import { useEffect, useMemo, useState } from 'react';
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

type FiltroEstado = 'todos' | 'activo' | 'inactivo';
type FiltroRol = 'todos' | 'Administrador' | 'Laboratorista';

const dominioInstitucional = '@uta.edu.ec';

const normalizarTexto = (valor: string) => valor.trim().toLowerCase();

const correoInstitucionalValido = (correo: string) =>
  normalizarTexto(correo).endsWith(dominioInstitucional);

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
  const [formEditar, setFormEditar] = useState({
    nombre: '',
    apellido: '',
    correo: '',
    rol: 'Laboratorista',
    activo: true
  });

  const [form, setForm] = useState({
    nombre: '',
    apellido: '',
    correo: '',
    rol: 'Laboratorista'
  });

  const [buscar, setBuscar] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>('todos');
  const [filtroRol, setFiltroRol] = useState<FiltroRol>('todos');
  const [chipAbierto, setChipAbierto] = useState<'estado' | 'rol' | null>(null);
  const [confirmacion, setConfirmacion] = useState<{
    abierta: boolean;
    titulo: string;
    descripcion: string;
    onConfirm: (() => void | Promise<void>) | null;
  }>({
    abierta: false,
    titulo: '',
    descripcion: '',
    onConfirm: null
  });

  const correoDuplicadoLocal = (correo: string, idIgnorado?: number) => {
    const correoNormalizado = normalizarTexto(correo);
    return usuarios.some(u => normalizarTexto(u.correo) === correoNormalizado && u.id !== idIgnorado);
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

  useEffect(() => {
    cargar();
  }, [pagina]);

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

  const cerrarConfirmacion = () => {
    setConfirmacion({
      abierta: false,
      titulo: '',
      descripcion: '',
      onConfirm: null
    });
  };

  const abrirConfirmacion = (
    titulo: string,
    descripcion: string,
    onConfirm: () => void | Promise<void>
  ) => {
    setConfirmacion({
      abierta: true,
      titulo,
      descripcion,
      onConfirm
    });
  };

  const handleCrear = async (e: React.FormEvent) => {
    e.preventDefault();

    const correo = normalizarTexto(form.correo);
    if (!validarCorreoUsuario(correo)) return;

    abrirConfirmacion(
      'Confirmar creación',
      `Vas a crear el usuario ${form.nombre} ${form.apellido} con el correo ${correo}.`,
      async () => {
        try {
          await crearUsuario({ ...form, correo });
          setMensaje('Usuario creado exitosamente');
          setMostrarForm(false);
          setForm({ nombre: '', apellido: '', correo: '', rol: 'Laboratorista' });
          await cargar();
        } catch (error) {
          setMensaje(obtenerMensajeError(error, 'Error al crear usuario'));
        }
      }
    );
  };

  const handleEditarClick = (usuario: Usuario) => {
    setMensaje('');
    setUsuarioEditando(usuario);
    setFormEditar({
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      correo: usuario.correo,
      rol: usuario.rol,
      activo: usuario.activo
    });
    setMostrarEditar(true);
  };

  const cerrarEdicion = () => {
    setMostrarEditar(false);
    setUsuarioEditando(null);
    setMensaje('');
  };

  const handleGuardarEdicion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuarioEditando) return;

    if (!validarCorreoUsuario(formEditar.correo, usuarioEditando.id)) return;

    abrirConfirmacion(
      'Confirmar cambios',
      `Vas a actualizar los datos de ${usuarioEditando.nombre} ${usuarioEditando.apellido}.`,
      async () => {
        setGuardando(true);
        try {
          await actualizarUsuario(usuarioEditando.id, {
            ...formEditar,
            correo: normalizarTexto(formEditar.correo)
          });
          setMensaje('Usuario actualizado correctamente');
          cerrarEdicion();
          await cargar();
        } catch (error) {
          setMensaje(obtenerMensajeError(error, 'Error al actualizar usuario'));
        } finally {
          setGuardando(false);
        }
      }
    );
  };

  const usuariosFiltrados = useMemo(() => {
    const busqueda = normalizarTexto(buscar);

    return usuarios.filter(usuario => {
      const coincideBusqueda =
        !busqueda ||
        normalizarTexto(`${usuario.nombre} ${usuario.apellido}`).includes(busqueda) ||
        normalizarTexto(usuario.correo).includes(busqueda) ||
        normalizarTexto(usuario.rol).includes(busqueda);

      const coincideEstado =
        filtroEstado === 'todos' ||
        (filtroEstado === 'activo' && usuario.activo) ||
        (filtroEstado === 'inactivo' && !usuario.activo);

      const coincideRol = filtroRol === 'todos' || usuario.rol === filtroRol;

      return coincideBusqueda && coincideEstado && coincideRol;
    });
  }, [buscar, filtroEstado, filtroRol, usuarios]);

  const etiquetaEstado = filtroEstado === 'todos' ? 'Estado' : filtroEstado === 'activo' ? 'Activo' : 'Inactivo';
  const etiquetaRol = filtroRol === 'todos' ? 'Rol' : filtroRol;

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
        <form onSubmit={handleCrear} className="card card--padded users-form users-form--compact">
          <div className="section-header users-form__header">
            <div>
              <p className="section-kicker">Nuevo usuario</p>
              <h3 className="section-title users-form__title">Crear cuenta institucional</h3>
            </div>
          </div>
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
            <button type="submit" className="btn btn--primary users-form__submit">
              Crear Usuario
            </button>
          </div>
        </form>
      )}

      <div className="card card--padded mb-20 users-chipbar">
        <div className="users-chipbar__search">
          <input
            id="buscar-usuario"
            className="form-input form-input--compact users-chipbar__input"
            value={buscar}
            onChange={e => setBuscar(e.target.value)}
            placeholder="Buscar usuarios"
          />
        </div>
        <div className="users-chipbar__chips">
          <div className="users-chipbar__chipwrap">
            <button
              type="button"
              className={`users-chip ${chipAbierto === 'estado' ? 'users-chip--active' : ''}`}
              onClick={() => setChipAbierto(chipAbierto === 'estado' ? null : 'estado')}
            >
              {etiquetaEstado}
            </button>
            {chipAbierto === 'estado' && (
              <div className="users-chip__menu">
                {[
                  ['todos', 'Todos'],
                  ['activo', 'Activo'],
                  ['inactivo', 'Inactivo']
                ].map(([valor, texto]) => (
                  <button
                    key={valor}
                    type="button"
                    className={`users-chip__option ${filtroEstado === valor ? 'users-chip__option--active' : ''}`}
                    onClick={() => {
                      setFiltroEstado(valor as FiltroEstado);
                      setChipAbierto(null);
                    }}
                  >
                    {texto}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="users-chipbar__chipwrap">
            <button
              type="button"
              className={`users-chip ${chipAbierto === 'rol' ? 'users-chip--active' : ''}`}
              onClick={() => setChipAbierto(chipAbierto === 'rol' ? null : 'rol')}
            >
              {etiquetaRol}
            </button>
            {chipAbierto === 'rol' && (
              <div className="users-chip__menu">
                {[
                  ['todos', 'Todos'],
                  ['Administrador', 'Administrador'],
                  ['Laboratorista', 'Laboratorista']
                ].map(([valor, texto]) => (
                  <button
                    key={valor}
                    type="button"
                    className={`users-chip__option ${filtroRol === valor ? 'users-chip__option--active' : ''}`}
                    onClick={() => {
                      setFiltroRol(valor as FiltroRol);
                      setChipAbierto(null);
                    }}
                  >
                    {texto}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

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
              <button type="submit" className="btn btn--danger" disabled={guardando}>
                {guardando ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </form>
        </div>
      )}

      {confirmacion.abierta && (
        <div className="modal-backdrop modal-backdrop--top">
          <div className="confirm-modal">
            <h3>{confirmacion.titulo}</h3>
            <p>{confirmacion.descripcion}</p>
            <div className="form-actions">
              <button type="button" onClick={cerrarConfirmacion} className="btn btn--outline">
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn--danger"
                onClick={async () => {
                  const accion = confirmacion.onConfirm;
                  cerrarConfirmacion();
                  if (accion) {
                    await accion();
                  }
                }}
              >
                Confirmar
              </button>
            </div>
          </div>
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
              ) : usuariosFiltrados.length === 0 ? (
                <tr><td colSpan={5} className="state-box">No hay usuarios que coincidan con los filtros.</td></tr>
              ) : (
                usuariosFiltrados.map(u => (
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
                ))
              )}
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
