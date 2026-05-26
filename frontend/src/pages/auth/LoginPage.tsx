import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { login } from '../../services/authService';

export const LoginPage = () => {
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const { guardarSesion } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const correoNormalizado = correo.trim().toLowerCase();
    if (!correoNormalizado.endsWith('@uta.edu.ec')) {
      setError('El correo debe ser institucional (@uta.edu.ec)');
      return;
    }
    setCargando(true);
    try {
      const data = await login({ correo: correoNormalizado, password });
      guardarSesion(data);
      if (data.rol === 'Administrador') navigate('/admin');
      else navigate('/lab');
    } catch (err: any) {
      if (err.response?.data?.mensaje) {
        setError(err.response.data.mensaje);
      } else {
        setError('Credenciales incorrectas');
      }
    } finally {
      setCargando(false);
    }
  };

  return (
    <main className="login-page">
      <section className="login-card" aria-label="Inicio de sesion">
        <div className="login-brand">
          <span className="login-brand__mark">FI</span>
          <h1>FISEI</h1>
          <p>Sistema de Gestion de Mantenimientos</p>
        </div>

        <form onSubmit={handleSubmit} className="form-grid">
          <div className="form-field form-field--full">
            <label className="form-label" htmlFor="correo">Correo institucional</label>
            <input
              id="correo"
              type="email"
              value={correo}
              onChange={e => setCorreo(e.target.value)}
              className="form-input"
              placeholder="usuario@uta.edu.ec"
              required
            />
          </div>

          <div className="form-field form-field--full">
            <label className="form-label" htmlFor="password">Contrasena</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="form-input"
              placeholder="********"
              required
            />
          </div>

          {error && <p className="alert alert--error form-field--full">{error}</p>}

          <div className="form-field--full">
            <button type="submit" disabled={cargando} className="btn btn--primary btn--full">
              {cargando ? 'Ingresando...' : 'Ingresar'}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
};
