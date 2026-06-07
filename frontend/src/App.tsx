import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { LoginPage } from './pages/auth/LoginPage';
import { MicrosoftCallbackPage } from './pages/auth/MicrosoftCallbackPage';
import { AdminPage } from './pages/admin/AdminPage';
import { HojaVidaPage } from './pages/admin/HojaVidaPage';
import { ImportarEquipos } from './pages/admin/ImportarEquipos';
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
          <Route path="/admin/inventario/importar" element={
            <ProtectedRoute rolesPermitidos={['Administrador']}>
              <div className="admin-layout">
                <main className="main-panel">
                  <ImportarEquipos />
                </main>
              </div>
            </ProtectedRoute>
          } />
          <Route path="/lab" element={
            <ProtectedRoute rolesPermitidos={['Laboratorista']}>
              <LabPage />
            </ProtectedRoute>
          } />
          <Route path="/mis-mantenimientos" element={
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
            <ProtectedRoute rolesPermitidos={['Administrador', 'Tecnico']}>
              <HojaVidaPage />
            </ProtectedRoute>
          } />
          <Route path="/auth/callback" element={<MicrosoftCallbackPage />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
        <Toaster position="top-right" />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
