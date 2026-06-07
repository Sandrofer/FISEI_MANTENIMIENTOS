import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { UsuariosPage } from './UsuariosPage';
import { InventarioPage } from './InventarioPage';
import { ImportarEquipos } from './ImportarEquipos';
import RegistrarEquipoPage from '../inventario/RegistrarEquipoPage';
import { MantenimientosDashboard } from '../mantenimiento/MantenimientosDashboard';

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
            <span className="sidebar__icon"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg></span>
            Inicio
          </button>
          <button
            onClick={() => setSeccion('usuarios')}
            className={`sidebar__link ${seccion === 'usuarios' ? 'sidebar__link--active' : ''}`}
          >
            <span className="sidebar__icon"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg></span>
            Usuarios
          </button>
          <button
            onClick={() => setSeccion('inventario')}
            className={`sidebar__link ${seccion === 'inventario' ? 'sidebar__link--active' : ''}`}
          >
            <span className="sidebar__icon"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg></span>
            Inventario
          </button>
          <button
            onClick={() => setSeccion('registrar-equipo')}
            className={`sidebar__link ${seccion === 'registrar-equipo' ? 'sidebar__link--active' : ''}`}
          >
            <span className="sidebar__icon"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg></span>
            Registrar equipo
          </button>
          <button
            onClick={() => setSeccion('importar-equipos')}
            className={`sidebar__link ${seccion === 'importar-equipos' ? 'sidebar__link--active' : ''}`}
          >
            <span className="sidebar__icon"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 16V4m0 12l-4-4m4 4l4-4M4 20h16" /></svg></span>
            Importar equipos
          </button>
          <button
            onClick={() => setSeccion('mantenimientos')}
            className={`sidebar__link ${seccion === 'mantenimientos' ? 'sidebar__link--active' : ''}`}
          >
            <span className="sidebar__icon"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" /></svg></span>
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
                    <button onClick={() => setSeccion('registrar-equipo')} className="btn btn--secondary">
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
                <span className="action-card__icon"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg></span>
                <h3>Gestion de Usuarios</h3>
                <p>Crear, revisar y administrar los perfiles autorizados del sistema.</p>
              </button>

              <button onClick={() => setSeccion('inventario')} className="action-card">
                <span className="action-card__icon"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg></span>
                <h3>Inventario</h3>
                <p>Consultar equipos registrados, estados y hojas de vida tecnicas.</p>
              </button>

              <button onClick={() => setSeccion('registrar-equipo')} className="action-card">
                <span className="action-card__icon"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg></span>
                <h3>Registrar Equipo</h3>
                <p>Ingresar un nuevo activo tecnologico con sus datos institucionales.</p>
              </button>

              <button onClick={() => setSeccion('mantenimientos')} className="action-card">
                <span className="action-card__icon"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" /></svg></span>
                <h3>Mantenimientos</h3>
                <p>Gestionar peticiones de mantenimiento preventivo y correctivo.</p>
              </button>
            </div>
          </section>
        )}

        {seccion === 'usuarios' && <UsuariosPage />}
        {seccion === 'inventario' && <InventarioPage />}
        {seccion === 'registrar-equipo' && <RegistrarEquipoPage />}
        {seccion === 'importar-equipos' && <ImportarEquipos />}
        {seccion === 'mantenimientos' && <MantenimientosDashboard basePath="/admin" />}
      </main>
    </div>
  );
};
