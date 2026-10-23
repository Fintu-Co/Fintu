// El landing público vive en otro dominio (fintu-landing): "Volver al inicio" sale de la app.
export const LANDING_URL = import.meta.env.VITE_LANDING_URL || 'http://localhost:5174';

export const goToLanding = () => { window.location.href = LANDING_URL; };
