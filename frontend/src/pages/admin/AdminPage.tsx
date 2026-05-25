import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { UsuariosPage } from './UsuariosPage';
import { InventarioPage } from './InventarioPage';

export const AdminPage = () => {
  const { usuario, cerrarSesion } = useAuth();
  const navigate = useNavigate();
  const [seccion, setSeccion] = useState('inicio');

  const handleLogout = () => {
    cerrarSesion();
    navigate('/login');
  };

  const userInitial = usuario?.nombre?.charAt(0).toUpperCase() ?? 'A';

  return (
    <div className="admin-layout">
      <aside className="sidebar">
        <div className="sidebar__brand">
          <span className="brand-mark">FI</span>
          <h1 className="sidebar__title">FISEI</h1>
          <p className="sidebar__subtitle">Mantenimientos institucionales</p>
        </div>

        <nav className="sidebar__nav" aria-label="Navegacion principal">
          <button
            onClick={() => setSeccion('inicio')}
            className={`sidebar__link ${seccion === 'inicio' ? 'sidebar__link--active' : ''}`}
          >
            <span className="sidebar__icon">IN</span>
            Inicio
          </button>
          <button
            onClick={() => setSeccion('usuarios')}
            className={`sidebar__link ${seccion === 'usuarios' ? 'sidebar__link--active' : ''}`}
          >
            <span className="sidebar__icon">US</span>
            Usuarios
          </button>
          <button
            onClick={() => setSeccion('inventario')}
            className={`sidebar__link ${seccion === 'inventario' ? 'sidebar__link--active' : ''}`}
          >
            <span className="sidebar__icon">IV</span>
            Inventario
          </button>
          <button
            onClick={() => navigate('/admin/registrar-equipo')}
            className="sidebar__link"
          >
            <span className="sidebar__icon">EQ</span>
            Registrar equipo
          </button>
          <button
            onClick={() => navigate('/admin/mantenimientos')}
            className={`sidebar__link ${location.pathname.includes('/mantenimientos') ? 'sidebar__link--active' : ''}`}
          >
            <span className="sidebar__icon">MT</span>
            Mantenimientos
          </button>
        </nav>

        <div className="sidebar__footer">
          <div className="sidebar__user">
            <span className="sidebar__avatar">{userInitial}</span>
            <div>
              <p className="sidebar__name">{usuario?.nombre}</p>
              <p className="sidebar__role">Administrador</p>
            </div>
          </div>
          <button onClick={handleLogout} className="btn btn--danger btn--full">
            Cerrar sesion
          </button>
        </div>
      </aside>

      <main className="main-panel">
        <header className="topbar">
          <div>
            <p className="topbar__eyebrow">Panel administrativo</p>
            <h2 className="topbar__title">Gestion de mantenimientos FISEI</h2>
          </div>
          <span className="topbar__meta">Universidad Tecnica de Ambato</span>
        </header>

        {seccion === 'inicio' && (
          <section className="page-section">
            <div className="dashboard-hero">
              <div className="hero-panel">
                <div className="hero-panel__content">
                  <h2>Bienvenido, {usuario?.nombre}</h2>
                  <p>
                    Administra usuarios, equipos tecnologicos y hojas de vida desde un panel limpio,
                    ordenado y orientado a la operacion institucional.
                  </p>
                  <div className="hero-actions">
                    <button onClick={() => setSeccion('inventario')} className="btn btn--outline">
                      Revisar inventario
                    </button>
                    <button onClick={() => navigate('/admin/registrar-equipo')} className="btn btn--secondary">
                      Registrar equipo
                    </button>
                  </div>
                </div>
              </div>

              <div className="stat-card">
                <span className="stat-card__label">Modulo activo</span>
                <strong className="stat-card__value">3</strong>
                <span className="stat-card__hint">Areas principales para la gestion del sistema</span>
              </div>
            </div>

            <div className="dashboard-grid">
              <button onClick={() => setSeccion('usuarios')} className="action-card">
                <span className="action-card__icon">US</span>
                <h3>Gestion de Usuarios</h3>
                <p>Crear, revisar y administrar los perfiles autorizados del sistema.</p>
              </button>

              <button onClick={() => setSeccion('inventario')} className="action-card">
                <span className="action-card__icon">IV</span>
                <h3>Inventario</h3>
                <p>Consultar equipos registrados, estados y hojas de vida tecnicas.</p>
              </button>

              <button onClick={() => navigate('/admin/registrar-equipo')} className="action-card">
                <span className="action-card__icon">EQ</span>
                <h3>Registrar Equipo</h3>
                <p>Ingresar un nuevo activo tecnologico con sus datos institucionales.</p>
              </button>

              <button onClick={() => navigate('/admin/mantenimientos')} className="action-card">
                <span className="action-card__icon">MT</span>
                <h3>Mantenimientos</h3>
                <p>Gestionar peticiones de mantenimiento preventivo y correctivo.</p>
              </button>
            </div>
          </section>
        )}

        {seccion === 'usuarios' && <UsuariosPage />}
        {seccion === 'inventario' && <InventarioPage />}
      </main>
    </div>
  );
};
