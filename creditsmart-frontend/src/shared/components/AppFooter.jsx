import { useNavigate } from 'react-router-dom';
import BrandLogo from '@/shared/components/BrandLogo';
import './AppFooter.css';

/*
  Footer compartido de la app.
  · variant: 'light' (fondo claro, texto oscuro) | 'navy' (sobre lienzo navy)
  · fabStop: marca el footer con [data-fab-stop] para que el botón flotante
             de movimientos aparque encima (solo lo usa CardDashboard).
*/
function AppFooter({ variant = 'light', fabStop = false }) {
  const navigate = useNavigate();
  const stopProps = fabStop ? { 'data-fab-stop': true } : {};

  return (
    <footer className={`app-footer app-footer--${variant}`} {...stopProps}>
      <div className="app-footer-line" />

      <div className="app-footer-main">
        <div className="app-footer-brand">
          <BrandLogo size="md" tagline className="app-footer-logo" />
        </div>

        <div className="app-footer-links">
          <button onClick={() => navigate('/dashboard')}>Dashboard</button>
          <span className="app-footer-dot" />
          <button onClick={() => navigate('/objetivos')}>Objetivos</button>
          <span className="app-footer-dot" />
          <button onClick={() => navigate('/educacion')}>Educación</button>
          <span className="app-footer-dot" />
          <button onClick={() => navigate('/comparador')}>Comparador</button>
        </div>
      </div>

      <div className="app-footer-note">
        Los cálculos mostrados son referenciales y no reemplazan el estado de cuenta oficial de tu banco.
        Fintú &amp; Co. no está afiliada, patrocinada ni respaldada por ninguna entidad financiera;
        las marcas mencionadas pertenecen a sus respectivos titulares.
      </div>

      <div className="app-footer-bottom">
        <span>© {new Date().getFullYear()} Fintú &amp; Co.</span>
        <span className="app-footer-dot" />
        <span>Hecho en Perú 🇵🇪</span>
      </div>
    </footer>
  );
}

export default AppFooter;
