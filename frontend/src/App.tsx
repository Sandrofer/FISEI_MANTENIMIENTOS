import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { LoginPage } from './pages/auth/LoginPage';
import { AdminPage } from './pages/admin/AdminPage';
import { HojaVidaPage } from './pages/admin/HojaVidaPage';
import { LabPage } from './pages/lab/LabPage';
import RegistrarEquipoPage from './pages/inventario/RegistrarEquipoPage';
import { MantenimientosPage } from './pages/mantenimiento/MantenimientosPage';
import { MantenimientoForm } from './pages/mantenimiento/MantenimientoForm';
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
          <Route path="/lab" element={
            <ProtectedRoute rolesPermitidos={['Laboratorista']}>
              <LabPage />
            </ProtectedRoute>
          } />
          <Route path="/lab/registrar-equipo" element={
            <ProtectedRoute rolesPermitidos={['Laboratorista']}>
              <RegistrarEquipoPage />
            </ProtectedRoute>
          } />
          <Route path="/lab/inventario/:id/hoja-vida" element={
            <ProtectedRoute rolesPermitidos={['Laboratorista']}>
              <HojaVidaPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/registrar-equipo" element={
            <ProtectedRoute rolesPermitidos={['Administrador']}>
              <RegistrarEquipoPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/inventario/:id/hoja-vida" element={
            <ProtectedRoute rolesPermitidos={['Administrador', 'Técnico', 'Tecnico']}>
              <HojaVidaPage />
            </ProtectedRoute>
          } />
          
          {/* Mantenimientos Lab */}
          <Route path="/lab/mantenimientos" element={
            <ProtectedRoute rolesPermitidos={['Laboratorista']}>
              <MantenimientosPage basePath="/lab" />
            </ProtectedRoute>
          } />
          <Route path="/lab/mantenimientos/nuevo" element={
            <ProtectedRoute rolesPermitidos={['Laboratorista']}>
              <MantenimientoForm />
            </ProtectedRoute>
          } />

          {/* Mantenimientos Admin */}
          <Route path="/admin/mantenimientos" element={
            <ProtectedRoute rolesPermitidos={['Administrador']}>
              <MantenimientosPage basePath="/admin" />
            </ProtectedRoute>
          } />
          <Route path="/admin/mantenimientos/nuevo" element={
            <ProtectedRoute rolesPermitidos={['Administrador']}>
              <MantenimientoForm />
            </ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
