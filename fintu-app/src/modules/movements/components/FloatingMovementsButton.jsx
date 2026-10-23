import { useState, useEffect } from 'react';
import './FloatingMovementsButton.css';

/*
  Cuando el elemento marcado con [data-fab-stop] (el footer) entra en pantalla,
  el botón se eleva para aparcar justo encima y no taparlo.

  Se usa IntersectionObserver en vez del evento `scroll`: así funciona aunque
  quien desplace sea un contenedor y no la ventana. Mientras el footer está
  visible, un bucle de rAF mide su posición exacta para un movimiento fluido.
*/
function useParkAboveFooter() {
  const [lift, setLift] = useState(0);

  useEffect(() => {
    const stop = document.querySelector('[data-fab-stop]');
    if (!stop) return;

    let raf = 0;
    let visible = false;

    const apply = () => {
      const invasion = window.innerHeight - stop.getBoundingClientRect().top;
      setLift(invasion > 0 ? Math.round(invasion) : 0);
    };

    const measure = () => {
      apply();
      raf = visible ? requestAnimationFrame(measure) : 0;
    };

    apply(); // posición correcta si se entra con la página ya desplazada

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) {
        if (!raf) raf = requestAnimationFrame(measure);
      } else {
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
        setLift(0);
      }
    }, { threshold: 0 });

    io.observe(stop);
    return () => {
      io.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return lift;
}

function FloatingMovementsButton({ onOpen }) {
  const lift = useParkAboveFooter();

  return (
    <button
      className="fab-btn"
      style={{ '--fab-lift': `${lift}px` }}
      onClick={onOpen}
      title="Ver movimientos"
    >
      <svg className="fab-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="8" y1="6" x2="21" y2="6"/>
        <line x1="8" y1="12" x2="21" y2="12"/>
        <line x1="8" y1="18" x2="21" y2="18"/>
        <circle cx="3" cy="6"  r="1" fill="currentColor" stroke="none"/>
        <circle cx="3" cy="12" r="1" fill="currentColor" stroke="none"/>
        <circle cx="3" cy="18" r="1" fill="currentColor" stroke="none"/>
      </svg>
      <span className="fab-label">Movimientos</span>
    </button>
  );
}

export default FloatingMovementsButton;
