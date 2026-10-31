import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/modules/auth/context/AuthContext';
import { ToastProvider } from '@/shared/context/ToastContext';
import { DemoEntry, DemoBanner } from '@/shared/demo/DemoMode';
import { DemoGate } from '@/shared/demo/DemoLocked';

import './App.css';

/*
  Carga diferida por ruta: cada página se descarga solo cuando se visita.
  Así el login no arrastra el código de charts, PDF ni PayPal.
  El landing vive aparte, en fintu-landing.
*/

const Register       = lazy(() => import('@/modules/auth/pages/Register'));
const Login          = lazy(() => import('@/modules/auth/pages/Login'));
const ForgotPassword = lazy(() => import('@/modules/auth/pages/ForgotPassword'));
const Profile        = lazy(() => import('@/modules/auth/pages/Profile'));
const Dashboard      = lazy(() => import('@/modules/cards/pages/Dashboard'));
const CardDashboard  = lazy(() => import('@/modules/cards/pages/CardDashboard'));
const Goals          = lazy(() => import('@/modules/goals/pages/Goals'));
const Educacion      = lazy(() => import('@/modules/education/pages/Educacion'));
const Comparador     = lazy(() => import('@/modules/education/pages/Comparador'));
const NotFound       = lazy(() => import('@/shared/pages/NotFound'));

const PageLoader = () => (
  <div className="app-loading"><div className="app-spinner" /></div>
);

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <PageLoader />;
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

// La raíz de la app no tiene pantalla propia: con sesión va al dashboard, sin ella al login.
function RootRedirect() {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <PageLoader />;
  return <Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />;
}

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<RootRedirect />} />
              <Route path="/registro" element={<Register />} />
              <Route path="/login" element={<Login />} />
              <Route path="/recuperar" element={<ForgotPassword />} />
              <Route path="/demo" element={<DemoEntry />} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/tarjeta/:slotNumero" element={<ProtectedRoute><CardDashboard /></ProtectedRoute>} />
              <Route path="/objetivos" element={<ProtectedRoute><DemoGate seccion="objetivos"><Goals /></DemoGate></ProtectedRoute>} />
              <Route path="/educacion" element={<ProtectedRoute><DemoGate seccion="educacion"><Educacion /></DemoGate></ProtectedRoute>} />
              <Route path="/comparador" element={<ProtectedRoute><DemoGate seccion="comparador"><Comparador /></DemoGate></ProtectedRoute>} />
              <Route path="/perfil"    element={<ProtectedRoute><DemoGate seccion="perfil"><Profile /></DemoGate></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
          <DemoBanner />
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
