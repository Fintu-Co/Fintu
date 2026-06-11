import { useNavigate } from 'react-router-dom';
import './NotFound.css';

function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="notfound-container">
      <div className="notfound-glow" />

      <div className="notfound-content">
        <div className="notfound-code">404</div>
        <h1 className="notfound-title">Página no encontrada</h1>
        <p className="notfound-desc">
          La URL que escribiste no existe o fue movida.<br />
          Verifica la dirección o regresa al inicio.
        </p>

        <div className="notfound-actions">
          <button className="notfound-btn primary" onClick={() => navigate('/dashboard')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            Ir al Dashboard
          </button>
          <button className="notfound-btn secondary" onClick={() => navigate(-1)}>
            Volver atrás
          </button>
        </div>
      </div>
    </div>
  );
}

export default NotFound;
