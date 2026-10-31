import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '@/shared/components/Sidebar';
import { demoActiva, salirDemo } from './demoApi';
/* Armazón compartido (layout + sidebar) — ver nota en Comparador.jsx. */
import '@/modules/cards/pages/Dashboard.css';
import './DemoMode.css';

/*
  En la demo solo se abre el inicio: muestra cómo se ven tus tarjetas y tus
  pagos. Lo demás (el detalle de cada tarjeta, el plan, la educación
  financiera, el comparador) se ve en el menú, pero su contenido es para
  quien crea su cuenta. Aquí se cuenta qué incluye.
*/
const SECCIONES = {
  tarjeta: {
    titulo: 'El detalle de cada tarjeta',
    texto: 'Todo lo de una tarjeta en una sola pantalla, con tus números reales.',
    incluye: [
      'Cuánto pagar este ciclo: total, uso saludable o mínimo, y lo que cuesta cada uno',
      'En qué se fue tu dinero y si tu deuda sube o baja',
      'Si pagas a tiempo y cuánto te cobran de intereses',
      'Calculadora: en cuánto terminas según lo que pagues',
    ],
  },
  objetivos: {
    titulo: 'Tu plan para salir de deudas',
    texto: 'Con lo que puedes pagar al mes, te dice cuándo quedas en cero con todas tus tarjetas.',
    incluye: [
      'La fecha en que terminas de pagar y cuánto pagas de intereses',
      'Cuánto darle a cada tarjeta este mes, empezando por la que más te cobra',
      'Tu avance real, mes a mes, frente a lo planeado',
    ],
  },
  educacion: {
    titulo: 'Educación financiera',
    texto: 'Lo que los bancos no te explican, en simple y con tus números.',
    incluye: [
      'Simulador: ¿cuánto te cuesta deber?',
      'TEA o TCEA, y cuánto pagar para no pagar de más',
      'Cómo cuidar tu score y experiencias reales para subir tu línea',
      'Las 5 reglas de oro de la tarjeta de crédito',
    ],
  },
  comparador: {
    titulo: 'Comparador de bancos',
    texto: 'Cuánto te cobraría cada banco por tu deuda, y dónde está tu tarjeta frente a las demás.',
    incluye: [
      'Interés aproximado de un mes en cada banco',
      'Cómo se compara la TEA de tu tarjeta',
      'Qué mirar al elegir, según cómo pagas',
    ],
  },
  perfil: {
    titulo: 'Tu cuenta',
    texto: 'Tus datos, tu contraseña y tu acceso de fundador.',
    incluye: [
      'Tus datos y tu contraseña',
      'Tu acceso de por vida como usuario fundador',
      'Ayuda directa por correo',
    ],
  },
};

export const SECCIONES_BLOQUEADAS = Object.keys(SECCIONES);

const IcLock = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 018 0v4" /></svg>);
const IcCheck = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12" /></svg>);
const IcMenu = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><line x1="4" y1="7" x2="20" y2="7" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="17" x2="14" y2="17" /></svg>);

function DemoLocked({ seccion }) {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const s = SECCIONES[seccion];

  return (
    <div className="dashboard-dark">
      <Sidebar active={seccion === 'tarjeta' ? 'dashboard' : seccion} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="dashboard-layout">
        <main className="dl">
          <button className="dl-menu" onClick={() => setSidebarOpen(true)} aria-label="Abrir menú"><IcMenu /></button>
          <section className="dl-card">
            <span className="dl-lock"><IcLock /> Con tu cuenta</span>
            <h1>{s.titulo}</h1>
            <p>{s.texto}</p>
            <ul>
              {s.incluye.map((t) => <li key={t}><span><IcCheck /></span>{t}</li>)}
            </ul>
            <div className="dl-actions">
              <button className="dl-btn dl-btn--green" onClick={() => { salirDemo(); window.location.href = '/registro'; }}>
                Crear mi cuenta por $5
              </button>
              <button className="dl-btn dl-btn--soft" onClick={() => navigate('/dashboard')}>Seguir con la demo</button>
            </div>
            <small>Precio de fundador: pago único y acceso de por vida para los primeros 100 usuarios.</small>
          </section>
        </main>
      </div>
    </div>
  );
}

/* Envuelve una ruta: en la demo muestra qué incluye la sección; con cuenta, la sección */
export function DemoGate({ seccion, children }) {
  return demoActiva() ? <DemoLocked seccion={seccion} /> : children;
}
