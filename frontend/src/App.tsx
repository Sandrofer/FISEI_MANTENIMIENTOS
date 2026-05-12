import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { LoginPage } from './pages/auth/LoginPage';
import { AdminPage } from './pages/admin/AdminPage';
import { HojaVidaPage } from './pages/admin/HojaVidaPage';
import RegistrarEquipoPage from './pages/inventario/RegistrarEquipoPage';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/admin" element={
            <ProtectedRoute rolesPermitidos={['Administrador']}>
              <AdminPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/registrar-equipo" element={
            <ProtectedRoute rolesPermitidos={['Administrador']}>
              <RegistrarEquipoPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/inventario/:id/hoja-vida" element={
            <ProtectedRoute rolesPermitidos={['Administrador', 'T\u00e9cnico', 'Tecnico']}>
              <HojaVidaPage />
            </ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
