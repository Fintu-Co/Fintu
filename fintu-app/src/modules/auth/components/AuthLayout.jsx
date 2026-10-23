import BrandLogo, { BrandSymbol } from '@/shared/components/BrandLogo';
import { goToLanding } from '@/shared/config';
import './auth.css';

const IcBack = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M19 12H5M11 6l-6 6 6 6" />
  </svg>
);

/*
  Marco común de login, registro y recuperar contraseña:
  panel chocolate con la marca y una vista previa de la app (solo escritorio)
  + columna crema con el formulario.
  `aside` = { title, text, points? } cambia el mensaje del panel por pantalla.
*/
function AuthLayout({ aside, children }) {
  return (
    <div className="au">
      <aside className="au-aside" aria-hidden="true">
        <BrandLogo size="md" className="au-aside-logo" />

        <div className="au-aside-copy">
          <h2>{aside.title}</h2>
          <p>{aside.text}</p>
          {aside.points && (
            <ul>
              {aside.points.map((t) => <li key={t}><span /> {t}</li>)}
            </ul>
          )}
        </div>

        {/* Vista previa con datos de ejemplo */}
        <div className="au-preview">
          <div className="au-card">
            <span className="au-card-label">Próximo pago · Visa</span>
            <div className="au-card-row">
              <strong>S/ 1,240.00</strong>
              <span className="au-card-date">15 nov</span>
            </div>
          </div>
          <div className="au-card au-card--dark">
            <div className="au-card-row au-card-row--top">
              <span className="au-card-label">Ciclo actual</span>
              <span className="au-card-label">Día 18 de 30</span>
            </div>
            <div className="au-cycle">
              <BrandSymbol />
              <div className="au-cycle-fill" />
            </div>
          </div>
        </div>
      </aside>

      <main className="au-main">
        <div className="au-top">
          <BrandLogo size="sm" className="au-top-logo" />
          <button type="button" className="au-back" onClick={goToLanding}>
            <IcBack /> Volver al inicio
          </button>
        </div>
        <div className="au-box">{children}</div>
      </main>
    </div>
  );
}

export default AuthLayout;
