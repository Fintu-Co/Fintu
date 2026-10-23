import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/modules/auth/context/AuthContext';
import BrandLogo from '@/shared/components/BrandLogo';
import './Sidebar.css';

/*
  Sidebar compartido de la app (estilos propios en Sidebar.css).
  `active`: 'dashboard' | 'objetivos' | 'educacion' | 'comparador' | 'perfil'
*/
function Sidebar({ active, open, onClose }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const go = (path) => { navigate(path); onClose?.(); };

  if (!user) return null;

  return (
    <>
      {open && <div className="sidebar-overlay" onClick={onClose}></div>}

      <aside className={`sidebar ${open ? 'open' : ''}`}>

        {/* ── Brand header ── */}
        <div className="sidebar-header">
          <BrandLogo size="sm" className="sidebar-brand" onClick={() => go('/dashboard')} role="button" tabIndex={0} />

          <button className="sidebar-close" onClick={onClose} aria-label="Cerrar menú">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <nav className="sidebar-nav">

          {/* ── Principal ── */}
          <button className={`nav-item${active === 'dashboard' ? ' active' : ''}`} onClick={() => go('/dashboard')}>
            <svg className="nav-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            <span className="nav-label">Dashboard</span>
          </button>

          <button className={`nav-item${active === 'objetivos' ? ' active' : ''}`} onClick={() => go('/objetivos')}>
            <svg className="nav-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
            </svg>
            <span className="nav-label">Mis Objetivos</span>
          </button>

          {/* ── Herramientas ── */}
          <div className="nav-divider"><span>Herramientas</span></div>

          <button className={`nav-item${active === 'educacion' ? ' active' : ''}`} onClick={() => go('/educacion')}>
            <svg className="nav-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/>
            </svg>
            <span className="nav-label">Educación Financiera</span>
          </button>

          <button className={`nav-item${active === 'comparador' ? ' active' : ''}`} onClick={() => go('/comparador')}>
            <svg className="nav-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/>
              <polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/>
            </svg>
            <span className="nav-label">Comparador de Bancos</span>
          </button>

          {/* ── Cuenta ── */}
          <div className="nav-divider"><span>Cuenta</span></div>

          <button className={`nav-item${active === 'perfil' ? ' active' : ''}`} onClick={() => go('/perfil')}>
            <svg className="nav-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
            <span className="nav-label">Mi Perfil</span>
          </button>

        </nav>

        {/* ── Bloque inferior: usuario + logout ── */}
        <div className="sidebar-bottom">
          <div className="sidebar-user" onClick={() => go('/perfil')} role="button" tabIndex={0} title="Ver mi perfil">
            <div className="sidebar-user-avatar">
              {user.nombre?.charAt(0).toUpperCase()}{user.apellido?.charAt(0).toUpperCase()}
            </div>
            <div className="sidebar-user-info">
              <span className="sidebar-user-name">{user.nombre} {user.apellido}</span>
              <span className="sidebar-user-plan">Acceso completo</span>
            </div>
            <button
              className="sidebar-logout"
              onClick={(e) => { e.stopPropagation(); logout(); }}
              title="Cerrar sesión"
              aria-label="Cerrar sesión"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
                <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </button>
          </div>
        </div>

        {/* ── Footer del sidebar ── */}
        <div className="sidebar-footer">
          <span>© {new Date().getFullYear()} Fintú &amp; Co.</span>
          <span className="sidebar-footer-dot" />
          <span>Perú 🇵🇪</span>
        </div>

      </aside>
    </>
  );
}

export default Sidebar;
