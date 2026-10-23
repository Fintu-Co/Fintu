import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/modules/auth/context/AuthContext';
import { ToastProvider } from '@/shared/context/ToastContext';

import './App.css';

/*
  Carga diferida por ruta: cada página se descarga solo cuando se visita.
  Así el landing no arrastra el código de charts, PDF ni PayPal.
  El landing se importa directo porque es la primera pantalla.
*/
import Landing from '@/modules/landing/pages/Landing';

const Register       = lazy(() => import('@/modules/auth/pages/Register'));
const Login          = lazy(() => import('@/modules/auth/pages/Login'));
const ForgotPassword = lazy(() => import('@/modules/auth/pages/ForgotPassword'));
const Profile        = lazy(() => import('@/modules/auth/pages/Profile'));
const Dashboard      = lazy(() => import('@/modules/cards/pages/Dashboard'));
const CardDashboard  = lazy(() => import('@/modules/cards/pages/CardDashboard'));
const Goals          = lazy(() => import('@/modules/goals/pages/Goals'));
const Educacion      = lazy(() => import('@/modules/education/pages/Educacion'));
const Comparador     = lazy(() => import('@/modules/education/pages/Comparador'));
const NotFound       = lazy(() => import('@/modules/landing/pages/NotFound'));

const PageLoader = () => (
  <div className="app-loading"><div className="app-spinner" /></div>
);

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <PageLoader />;
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/registro" element={<Register />} />
              <Route path="/login" element={<Login />} />
              <Route path="/recuperar" element={<ForgotPassword />} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/tarjeta/:slotNumero" element={<ProtectedRoute><CardDashboard /></ProtectedRoute>} />
              <Route path="/objetivos" element={<ProtectedRoute><Goals /></ProtectedRoute>} />
              <Route path="/educacion" element={<ProtectedRoute><Educacion /></ProtectedRoute>} />
              <Route path="/comparador" element={<ProtectedRoute><Comparador /></ProtectedRoute>} />
              <Route path="/perfil"    element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
