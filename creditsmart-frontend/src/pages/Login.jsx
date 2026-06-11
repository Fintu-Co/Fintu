import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../services/api';
import './Login.css';

// ── Íconos inline ──────────────────────────────────────────
const IcMail = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
    <polyline points="22,6 12,13 2,6"/>
  </svg>
);
const IcLock = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2"/>
    <path d="M7 11V7a5 5 0 0110 0v4"/>
  </svg>
);
const IcCard = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="4" width="22" height="16" rx="3"/>
    <line x1="1" y1="10" x2="23" y2="10"/>
    <line x1="5" y1="15" x2="9" y2="15"/>
    <line x1="12" y1="15" x2="15" y2="15"/>
  </svg>
);
const IcCheck = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const IcBack = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15,18 9,12 15,6"/>
  </svg>
);
const IcShield = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    <polyline points="9 12 11 14 15 10"/>
  </svg>
);

// ── Canvas de partículas doradas ─────────────────────────
function LoginCanvas() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let raf;

    // Paleta: mayoría dorados, algunos azul-navy y un toque cyan
    const PALETTE = [
      [200, 168, 112],  // gold (peso alto)
      [200, 168, 112],
      [200, 168, 112],
      [30,  80, 160],   // navy-blue
      [29, 200, 240],   // cyan muy escaso
    ];

    const NODES = Array.from({ length: 55 }, () => ({
      x:     Math.random(),
      y:     Math.random(),
      vx:    (Math.random() - 0.5) * 0.00022,
      vy:    (Math.random() - 0.5) * 0.00022,
      size:  Math.random() * 1.6 + 0.7,
      col:   PALETTE[Math.floor(Math.random() * PALETTE.length)],
      phase: Math.random() * Math.PI * 2,
      op:    Math.random() * 0.30 + 0.12,
    }));

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width  = canvas.offsetWidth  * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      ctx.scale(dpr, dpr);
    }
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    function draw() {
      const W = canvas.offsetWidth, H = canvas.offsetHeight;
      ctx.clearRect(0, 0, W, H);

      // Líneas de conexión (solo doradas, muy sutiles)
      const maxD = Math.min(W, H) * 0.22;
      for (let i = 0; i < NODES.length; i++) {
        for (let j = i + 1; j < NODES.length; j++) {
          const a = NODES[i], b = NODES[j];
          const dx = (a.x - b.x) * W, dy = (a.y - b.y) * H;
          const d  = Math.sqrt(dx * dx + dy * dy);
          if (d < maxD) {
            ctx.beginPath();
            ctx.moveTo(a.x * W, a.y * H);
            ctx.lineTo(b.x * W, b.y * H);
            ctx.strokeStyle = `rgba(200,168,112,${(1 - d / maxD) * 0.09})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      // Nodos
      NODES.forEach(n => {
        n.x += n.vx; n.y += n.vy; n.phase += 0.013;
        if (n.x < 0.02) n.vx =  Math.abs(n.vx);
        if (n.x > 0.98) n.vx = -Math.abs(n.vx);
        if (n.y < 0.02) n.vy =  Math.abs(n.vy);
        if (n.y > 0.98) n.vy = -Math.abs(n.vy);

        const px  = n.x * W, py = n.y * H;
        const sz  = n.size * (0.82 + 0.18 * Math.sin(n.phase));
        const al  = n.op   * (0.75 + 0.25 * Math.sin(n.phase + 1));
        const [r, g, b] = n.col;

        // Glow suave
        const grd = ctx.createRadialGradient(px, py, 0, px, py, sz * 11);
        grd.addColorStop(0,   `rgba(${r},${g},${b},${al * 0.50})`);
        grd.addColorStop(0.4, `rgba(${r},${g},${b},${al * 0.07})`);
        grd.addColorStop(1,   'rgba(0,0,0,0)');
        ctx.beginPath(); ctx.arc(px, py, sz * 11, 0, Math.PI * 2);
        ctx.fillStyle = grd; ctx.fill();

        // Core
        ctx.beginPath(); ctx.arc(px, py, sz, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r},${g},${b},${al})`; ctx.fill();
      });

      raf = requestAnimationFrame(draw);
    }
    draw();
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, []);
  return <canvas ref={canvasRef} className="login-canvas" />;
}

// ── Score widget panel izquierdo ──────────────────────────
function ScoreWidget() {
  return (
    <div className="login-score-widget">
      <div className="lsw-header">
        <div className="lsw-dot" />
        Score financiero
      </div>
      <div className="lsw-score">82<span>/100</span></div>
      <div className="lsw-status">Muy bueno</div>
      <div className="lsw-bar">
        <div className="lsw-fill" />
      </div>
      <div className="lsw-meta">Actualizado hoy</div>
    </div>
  );
}

// ── Componente principal ──────────────────────────────────
function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors,   setErrors]   = useState({});
  const [loading,  setLoading]  = useState(false);
  const [message,  setMessage]  = useState({ text: '', type: '' });

  const showMessage = (text, type = 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 7000);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: '' });
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email.trim()) newErrors.email = 'El email es obligatorio';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Email inválido';
    if (!formData.password) newErrors.password = 'La contraseña es obligatoria';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    try {
      const data = await authApi.login({ email: formData.email, password: formData.password });
      if (data.success) {
        login(data.token, data.user);
        showMessage('Acceso exitoso. Redirigiendo…', 'success');
        setTimeout(() => navigate('/dashboard'), 1000);
      } else {
        if (data.requiresPayment) showMessage('Debes completar el pago de $4 para acceder.', 'warning');
        else showMessage(data.message || 'Email o contraseña incorrectos.', 'error');
      }
    } catch {
      showMessage('Error de conexión. Verifica tu internet e intenta de nuevo.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">

      {/* ════════════════════════════════
          PANEL IZQUIERDO — Branding
      ════════════════════════════════ */}
      <div className="login-left">
        <LoginCanvas />
        <div className="login-left-overlay" />

        {/* Widget flotante */}
        <ScoreWidget />

        <div className="login-left-content">

          {/* Marca */}
          <div className="login-brand">
            <div className="login-brand-icon"><IcCard /></div>
            <span>Fintú &amp; Co.</span>
          </div>

          {/* Titular */}
          <div className="login-hero-text">
            <h2>
              Domina tus finanzas.<br />
              <em>Toma el control.</em>
            </h2>
            <p>
              La plataforma inteligente para peruanos que quieren organizar, optimizar y entender sus tarjetas de crédito.
            </p>
          </div>

          {/* Features */}
          <ul className="login-features">
            {[
              'Control total de tus tarjetas de crédito',
              'Alertas antes de cada fecha de vencimiento',
              'Análisis de intereses y comparador de bancos',
            ].map((text, i) => (
              <li key={i}>
                <div className="lf-check"><IcCheck /></div>
                <span>{text}</span>
              </li>
            ))}
          </ul>

          <div className="login-left-footer">
            © {new Date().getFullYear()} Fintú &amp; Co. PE · Hecho en Perú 🇵🇪
          </div>
        </div>
      </div>

      {/* ════════════════════════════════
          PANEL DERECHO — Formulario
      ════════════════════════════════ */}
      <div className="login-right">
        <div className="login-box">

          {/* Brand header — solo visible en móvil */}
          <div className="login-mobile-brand">
            <div className="login-brand-icon"><IcCard /></div>
            <span>Fintú &amp; Co.</span>
          </div>

          {/* Volver */}
          <button className="login-back" onClick={() => navigate('/')}>
            <IcBack />
            Volver al inicio
          </button>

          {/* Header */}
          <div className="login-header">
            <h1>Bienvenido de vuelta</h1>
            <p>Ingresa a tu cuenta para continuar</p>
          </div>

          {/* Trust badge */}
          <div className="login-trust-badge">
            <IcShield />
            Sin datos bancarios requeridos
          </div>

          {/* Mensaje de estado */}
          {message.text && (
            <div className={`message message--${message.type}`}>
              <span className="message-text">{message.text}</span>
              <div className="message-bar" />
            </div>
          )}

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="login-form">

            {/* Email */}
            <div className="form-group">
              <label>Correo electrónico</label>
              <div className="input-icon-wrap">
                <IcMail />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="tu@email.com"
                  className={errors.email ? 'error' : ''}
                  autoFocus
                />
              </div>
              {errors.email && <span className="error-message">{errors.email}</span>}
            </div>

            {/* Contraseña */}
            <div className="form-group">
              <div className="form-label-row">
                <label>Contraseña</label>
                <button
                  type="button"
                  className="form-label-link"
                  onClick={() => navigate('/recuperar')}
                >
                  ¿Olvidaste la tuya?
                </button>
              </div>
              <div className="input-icon-wrap">
                <IcLock />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Tu contraseña"
                  className={errors.password ? 'error' : ''}
                />
              </div>
              {errors.password && <span className="error-message">{errors.password}</span>}
            </div>

            <button
              type="submit"
              className={`btn-submit${loading ? ' loading' : ''}`}
              disabled={loading}
            >
              {loading ? 'Ingresando…' : 'Iniciar sesión'}
            </button>

          </form>

          {/* Footer */}
          <div className="login-footer">
            <div className="login-divider"><span>o</span></div>
            <p className="login-footer-link">
              ¿No tienes cuenta?&nbsp;
              <a href="/registro">Regístrate — solo $4 USD</a>
            </p>
          </div>

        </div>
      </div>

    </div>
  );
}

export default Login;
