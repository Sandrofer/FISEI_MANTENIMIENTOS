import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import portadaUrl from '../../assets/portada.png';
import { FORCE_REAUTH_STORAGE_KEY } from '../../services/authService';

const STORAGE_TOKEN_KEY = 'fisei_token';
const STORAGE_NAME_KEY = 'fisei_nombre';
const STORAGE_ROLE_KEY = 'fisei_rol';

export const MicrosoftCallbackPage = () => {
  const [error, setError] = useState('');

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const urlError = params.get('error');
      const message = params.get('message');
      const token = params.get('token');

      if (urlError) {
        setError(message ?? 'No se pudo completar el inicio de sesion.');
        return;
      }

      if (!token) {
        setError('Token de autenticacion no encontrado en la URL.');
        return;
      }

      const payload = parseJwt(token);
      const fullName = payload.fullName ?? payload.name ?? '';
      const role = payload.role
        ?? payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"]
        ?? '';

      if (!fullName || !role) {
        setError('El token de autenticacion no contiene los datos necesarios.');
        return;
      }

      localStorage.setItem(STORAGE_TOKEN_KEY, token);
      localStorage.setItem(STORAGE_NAME_KEY, fullName);
      localStorage.setItem(STORAGE_ROLE_KEY, role);
      localStorage.removeItem(FORCE_REAUTH_STORAGE_KEY);

      if (role === 'Administrador') {
        window.location.replace('/admin');
        return;
      }

      if (role === 'Laboratorista') {
        window.location.replace('/lab');
        return;
      }

      window.location.replace('/login');
    } catch (err: any) {
      setError(err?.message ?? 'Error procesando el callback de Microsoft');
    }
  }, []);

  return (
    <main
      className="institutional-login-page"
      style={{
        backgroundImage: `url(${portadaUrl})`,
      }}
    >
      <section className="institutional-login-card institutional-login-card--status" aria-label="Autenticacion Microsoft">
        <div className="institutional-login-brand">
          <span className="institutional-login-mark" aria-hidden="true">F</span>
          <div>
            <span>FISEI</span>
            <small>Mantenimientos</small>
          </div>
        </div>

        <h1>{error ? 'Acceso no autorizado' : 'Autenticando con Microsoft'}</h1>

        {error ? (
          <div className="auth-result auth-result--error">
            <span className="auth-result__icon">!</span>
            <p>{error}</p>
            <Link to="/login" className="institutional-microsoft-button institutional-microsoft-button--solid">
              Volver al inicio de sesion
            </Link>
          </div>
        ) : (
          <div className="auth-result">
            <span className="auth-loader" aria-hidden="true" />
            <p>Cargando respuesta de Microsoft y redirigiendo al panel...</p>
          </div>
        )}
      </section>
    </main>
  );
};

const parseJwt = (token: string): Record<string, any> => {
  const [, payload] = token.split('.');
  if (!payload) return {};

  const normalizedPayload = payload.replace(/-/g, '+').replace(/_/g, '/');
  const decoded = atob(normalizedPayload);

  return JSON.parse(decodeURIComponent(
    decoded.split('').map((char) => `%${('00' + char.charCodeAt(0).toString(16)).slice(-2)}`).join('')
  ));
};
