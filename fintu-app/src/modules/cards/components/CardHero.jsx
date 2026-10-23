import { useState, useEffect, useRef } from 'react';
import "./CardHero.css";

function CardHero({ tarjeta, simboloMoneda }) {
  const [displayValue, setDisplayValue] = useState(0);
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  const lineaTotal = parseFloat(tarjeta.linea_credito);
  const deudaActual = parseFloat(tarjeta.deuda_actual || 0);
  const disponible = lineaTotal - deudaActual;
  const porcentajeUso = (deudaActual / lineaTotal) * 100;

  const diasAlCierre = tarjeta.dias_al_cierre ?? null;
  const diasAlPago   = tarjeta.dias_al_pago   ?? null;

  const fmtFecha = (iso) => {
    if (!iso) return '—';
    const d = new Date(iso);
    const m = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    return `${d.getDate()} ${m[d.getMonth()]}`;
  };

  // Count-up animation for available amount
  useEffect(() => {
    let start = 0;
    const end = disponible;
    const duration = 1500;
    const increment = end / (duration / 16);

    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setDisplayValue(end);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(start));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [disponible]);

  // Canvas animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = 85;
    let rotation = 0;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Background ring
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.strokeStyle = 'rgba(30, 45, 100, 0.08)';
      ctx.lineWidth = 12;
      ctx.stroke();

      // Progress arc
      const startAngle = -Math.PI / 2;
      const endAngle = startAngle + (2 * Math.PI * porcentajeUso / 100);

      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, '#dbb96a');
      gradient.addColorStop(0.5, '#c49a3c');
      gradient.addColorStop(1, '#9a7628');

      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 12;
      ctx.lineCap = 'round';
      ctx.shadowColor = 'rgba(196, 154, 60, 0.35)';
      ctx.shadowBlur = 12;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Rotating decorative ticks
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(rotation);
      ctx.translate(-centerX, -centerY);

      for (let i = 0; i < 4; i++) {
        const angle = (i * Math.PI / 2) + rotation;
        const x1 = centerX + (radius + 45) * Math.cos(angle);
        const y1 = centerY + (radius + 45) * Math.sin(angle);
        const x2 = centerX + (radius + 50) * Math.cos(angle);
        const y2 = centerY + (radius + 50) * Math.sin(angle);

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = 'rgba(196, 154, 60, 0.45)';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.stroke();
      }
      ctx.restore();

      // 12 pulsing dots
      const totalPoints = 12;
      const pointRadius = 5;
      const pointDistance = radius + 38;
      const pulseTime = Date.now() * 0.002;

      for (let i = 0; i < totalPoints; i++) {
        const angle = (i * (2 * Math.PI / totalPoints)) - Math.PI / 2;
        const x = centerX + pointDistance * Math.cos(angle);
        const y = centerY + pointDistance * Math.sin(angle);

        const pointPercentage = (i / totalPoints) * 100;
        const isActive = pointPercentage <= porcentajeUso;
        const pulse = isActive ? 1 + Math.sin(pulseTime + i) * 0.3 : 1;

        ctx.beginPath();
        ctx.arc(x, y, pointRadius * pulse, 0, 2 * Math.PI);

        if (isActive) {
          const dotGradient = ctx.createRadialGradient(x, y, 0, x, y, pointRadius * pulse);
          dotGradient.addColorStop(0, '#f4e3bd');
          dotGradient.addColorStop(0.4, '#c49a3c');
          dotGradient.addColorStop(1, '#9a7628');
          ctx.fillStyle = dotGradient;
          ctx.shadowColor = 'rgba(196, 154, 60, 0.45)';
          ctx.shadowBlur = 8;
          ctx.fill();
          ctx.shadowBlur = 0;

          ctx.beginPath();
          ctx.arc(x, y, (pointRadius + 4) * pulse, 0, 2 * Math.PI);
          ctx.strokeStyle = `rgba(196, 154, 60, ${0.5 - pulse * 0.2})`;
          ctx.lineWidth = 2;
          ctx.stroke();
        } else {
          ctx.fillStyle = 'rgba(30, 45, 100, 0.10)';
          ctx.fill();
        }
      }

      // Floating particles
      const particleTime = Date.now() * 0.001;
      for (let i = 0; i < 6; i++) {
        const particleAngle = (i * Math.PI / 3) + particleTime;
        const particleRadius = radius + 20 + Math.sin(particleTime + i) * 8;
        const px = centerX + particleRadius * Math.cos(particleAngle);
        const py = centerY + particleRadius * Math.sin(particleAngle);

        ctx.beginPath();
        ctx.arc(px, py, 2, 0, 2 * Math.PI);
        ctx.fillStyle = `rgba(196, 154, 60, ${0.35 + Math.sin(particleTime + i) * 0.2})`;
        ctx.shadowColor = 'rgba(196, 154, 60, 0.5)';
        ctx.shadowBlur = 6;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      rotation += 0.005;
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [porcentajeUso]);

  const cierreUrgente = diasAlCierre !== null && diasAlCierre <= 3;
  const pagoUrgente   = diasAlPago   !== null && diasAlPago   <= 5;

  return (
    <div className="card-block hero-block">
      <div className="block-header">
        <h3>LÍNEA DE CRÉDITO</h3>
      </div>

      <div className="hero-circle-container">
        <canvas
          ref={canvasRef}
          width="280"
          height="280"
          className="hero-canvas"
        />

        <div className="hero-glow-bg"></div>
        <div className="hero-glow-pulse"></div>

        <div className="hero-circle-center">
          <div className="hero-amount-wrapper">
            <span className="hero-currency">{simboloMoneda}</span>
            <span className="hero-amount">
              {displayValue.toLocaleString("es-PE")}
            </span>
          </div>
          <div className="hero-label">Disponible</div>
        </div>

        <div className="hero-ring-rotating ring-1"></div>
        <div className="hero-ring-rotating ring-2"></div>
      </div>

      {/* Cycle info — not duplicated anywhere else */}
      <div className="hero-cycle-info">
        <div className={`hero-cycle-item ${cierreUrgente ? 'urgent' : ''}`}>
          <div className="hero-cycle-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </div>
          <div className="hero-cycle-content">
            <span className="hero-cycle-label">Cierre de ciclo</span>
            <span className="hero-cycle-date">{fmtFecha(tarjeta.fecha_cierre)}</span>
          </div>
          <div className={`hero-cycle-days ${cierreUrgente ? 'days-urgent' : ''}`}>
            {diasAlCierre === 0 ? '¡Hoy!' : diasAlCierre !== null ? `${diasAlCierre}d` : '—'}
          </div>
        </div>

        <div className={`hero-cycle-item ${pagoUrgente ? 'urgent' : ''}`}>
          <div className="hero-cycle-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="1" x2="12" y2="23"/>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
          </div>
          <div className="hero-cycle-content">
            <span className="hero-cycle-label">Fecha de pago</span>
            <span className="hero-cycle-date">{fmtFecha(tarjeta.fecha_pago)}</span>
          </div>
          <div className={`hero-cycle-days ${pagoUrgente ? 'days-urgent' : ''}`}>
            {diasAlPago === 0 ? '¡Hoy!' : diasAlPago !== null ? `${diasAlPago}d` : '—'}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CardHero;
