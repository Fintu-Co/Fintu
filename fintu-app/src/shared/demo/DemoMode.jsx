import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/modules/auth/context/AuthContext';
import { iniciarDemo, salirDemo, demoActiva, DEMO_USER } from './demoApi';
import './DemoMode.css';

/* /demo — entra con datos de ejemplo y lleva al inicio */
export function DemoEntry() {
  const { login } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    iniciarDemo();
    login('demo', DEMO_USER);
    navigate('/dashboard', { replace: true });
  }, []);
  return <div className="app-loading"><div className="app-spinner" /></div>;
}

/* Aviso fijo mientras dura la demo: deja claro que los datos son de ejemplo */
export function DemoBanner() {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated || !demoActiva()) return null;

  // Recarga completa al salir: así no queda nada de la demo en memoria
  const ir = (ruta) => { salirDemo(); window.location.href = ruta; };

  return (
    <div className="demo-bar" role="status">
      <span className="demo-bar-txt">
        <b>Demo</b> con datos de ejemplo<span className="demo-bar-extra">. Nada de lo que hagas se guarda</span>.
      </span>
      <button className="demo-bar-cta" onClick={() => ir('/registro')}>Crear mi cuenta</button>
      <button className="demo-bar-x" onClick={() => ir('/login')} aria-label="Salir de la demo">Salir</button>
    </div>
  );
}
