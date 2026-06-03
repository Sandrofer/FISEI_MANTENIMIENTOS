import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { LoginPage } from './pages/auth/LoginPage';
import { MicrosoftCallbackPage } from './pages/auth/MicrosoftCallbackPage';
import { AdminPage } from './pages/admin/AdminPage';
import { HojaVidaPage } from './pages/admin/HojaVidaPage';
import { LabPage } from './pages/lab/LabPage';
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
          <Route path="/lab/inventario/:id/hoja-vida" element={
            <ProtectedRoute rolesPermitidos={['Laboratorista']}>
              <HojaVidaPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/inventario/:id/hoja-vida" element={
            <ProtectedRoute rolesPermitidos={['Administrador', 'Técnico', 'Tecnico']}>
              <HojaVidaPage />
            </ProtectedRoute>
          } />
          <Route path="/auth/callback" element={<MicrosoftCallbackPage />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
