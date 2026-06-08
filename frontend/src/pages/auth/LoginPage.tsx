import { useMemo } from 'react';
import portadaUrl from '../../assets/portada.png';
import { FORCE_REAUTH_STORAGE_KEY, getAuthLoginUrl } from '../../services/authService';

export const LoginPage = () => {
  const loginUrl = useMemo(() => {
    const forceReauth = localStorage.getItem(FORCE_REAUTH_STORAGE_KEY) === '1';
    return getAuthLoginUrl(forceReauth);
  }, []);

  const handleMicrosoftLogin = () => {
    localStorage.removeItem(FORCE_REAUTH_STORAGE_KEY);
  };

  return (
    <main
      className="institutional-login-page"
      style={{
        backgroundImage: `url(${portadaUrl})`,
      }}
    >
      <section className="institutional-login-card" aria-label="Inicio de sesion institucional">
        <div className="institutional-login-brand">
          <span className="institutional-login-mark" aria-hidden="true">F</span>
          <div>
            <span>FISEI</span>
            <small>Mantenimientos</small>
          </div>
        </div>

        <h1>Inicio de sesion institucional</h1>
        <p className="institutional-login-subtitle">
          Accede con tu cuenta Microsoft autorizada para gestionar laboratorios, equipos y mantenimientos.
        </p>

        <div className="institutional-login-access">
          <a
            href={loginUrl}
            onClick={handleMicrosoftLogin}
            className="institutional-microsoft-button"
          >
            <span className="microsoft-mark" aria-hidden="true">
              <span />
              <span />
              <span />
              <span />
            </span>
            Microsoft Office 365
          </a>
        </div>

        <p className="institutional-login-note">
          Solo los correos registrados por el administrador pueden entrar al sistema.
        </p>
      </section>
    </main>
  );
};
