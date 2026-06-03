import { authLoginUrl } from '../../services/authService';

export const LoginPage = () => {
  return (
    <main className="login-page">
      <section className="login-panel" aria-label="Inicio de sesion">
        <div className="login-panel__intro">
          <div className="login-brand login-brand--left">
            <span className="login-brand__mark">FI</span>
            <div>
              <h1>FISEI</h1>
              <p>Sistema de Gestion de Mantenimientos</p>
            </div>
          </div>

          <div className="login-hero-copy">
            <span className="login-kicker">Acceso institucional</span>
            <h2>Gestiona laboratorios, equipos y mantenimientos desde un solo lugar.</h2>
            <p>
              Ingresa con tu cuenta Microsoft registrada para acceder al panel segun tu rol.
            </p>
          </div>

          <div className="login-highlights" aria-label="Funciones principales">
            <span>Usuarios autorizados</span>
            <span>Control por roles</span>
            <span>Acceso seguro</span>
          </div>
        </div>

        <div className="login-card">
          <div className="login-card__header">
            <span className="login-card__icon">M</span>
            <div>
              <h2>Iniciar sesion</h2>
              <p>Usa tu correo institucional autorizado.</p>
            </div>
          </div>

          <a href={authLoginUrl} className="btn btn--primary btn--full btn--login">
            <span className="btn__icon">M</span>
            Iniciar sesion con Microsoft
          </a>

          <p className="login-card__note">
            Solo los correos registrados por el administrador pueden entrar al sistema.
          </p>
        </div>
      </section>
    </main>
  );
};
