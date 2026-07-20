import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { useToast } from '@/shared/context/ToastContext';
import registerImg from '@/assets/images/register-hero.jpg';
import BrandLogo from '@/shared/components/BrandLogo';
import './Register.css';

const initialOptions = {
  clientId: import.meta.env.VITE_PAYPAL_CLIENT_ID,
  currency: 'USD',
  intent: 'capture',
};

function Register() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    nombre: '', apellido: '', email: '', password: '', confirmPassword: ''
  });
  const [errors, setErrors]     = useState({});
  const [loading, setLoading]   = useState(false);
  const [showModal, setShowModal] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: '' });
  };

  const validateForm = () => {
    const e = {};
    if (!formData.nombre.trim())    e.nombre    = 'El nombre es obligatorio';
    if (!formData.apellido.trim())  e.apellido  = 'El apellido es obligatorio';
    if (!formData.email.trim())     e.email     = 'El email es obligatorio';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) e.email = 'Email inválido';
    if (!formData.password)         e.password  = 'La contraseña es obligatoria';
    else if (formData.password.length < 6) e.password = 'Mínimo 6 caracteres';
    if (formData.password !== formData.confirmPassword) e.confirmPassword = 'Las contraseñas no coinciden';
    return e;
  };

  const handleOpenPayment = () => {
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      showToast('Completa todos los campos correctamente antes de continuar.', 'warning');
      return;
    }
    setShowModal(true);
  };

  const handleApprove = async (data, actions) => {
    try {
      setLoading(true);
      const order = await actions.order.capture();
      const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await fetch(`${BASE}/api/auth/register-with-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: formData.nombre, apellido: formData.apellido,
          email: formData.email,   password: formData.password,
          paymentId: order.id,     montoPagado: 4.00
        })
      });
      const result = await response.json();
      if (result.success) {
        setShowModal(false);
        showToast('¡Pago confirmado! Bienvenido a Fintú & Co.', 'success');
        localStorage.setItem('token', result.token);
        localStorage.setItem('user', JSON.stringify(result.user));
        setTimeout(() => { window.location.href = '/dashboard'; }, 1500);
      } else {
        showToast(result.message || 'Error al crear la cuenta.', 'error');
      }
    } catch (error) {
      console.error('Error al procesar:', error);
      showToast('Error al crear tu cuenta. Contacta soporte con tu ID de pago.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PayPalScriptProvider options={initialOptions}>
    <div className="register-page">

      {/* ── PANEL IZQUIERDO — Branding ── */}
      <div className="register-left">
        <div className="register-left-img">
          <img src={registerImg} alt="" aria-hidden="true" />
        </div>
        <div className="register-left-overlay" />

        <div className="register-left-content">
          <BrandLogo size="lg" tagline className="register-brand" />

          <div className="register-hero-text">
            <h2>Empieza hoy.<br/>Un solo pago.</h2>
            <p>Crea tu cuenta y accede de por vida a todas las herramientas para controlar tu crédito en Perú.</p>
          </div>

          <ul className="register-features">
            {[
              'Control total de tus tarjetas de crédito',
              'Alertas de vencimiento y análisis de deuda',
              'Comparador de bancos y educación financiera',
              'Sin pagos mensuales — solo $4 una vez',
            ].map((text, i) => (
              <li key={i}>
                <div className="rf-check">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
                <span>{text}</span>
              </li>
            ))}
          </ul>

          <div className="register-price-badge">
            <div>
              <div className="rpb-amount">$4 USD</div>
              <div className="rpb-label">Pago único<br/>Acceso de por vida</div>
            </div>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{color:'rgba(196,154,60,0.55)'}}>
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              <polyline points="9 12 11 14 15 10"/>
            </svg>
          </div>

          <div className="register-left-footer">© {new Date().getFullYear()} Fintú &amp; Co. PE · Perú 🇵🇪</div>
        </div>
      </div>

      {/* ── PANEL DERECHO — Formulario ── */}
      <div className="register-right">

        {/* ── HERO MOBILE ── */}
        <div className="register-mobile-hero">
          <img src={registerImg} alt="" aria-hidden="true" />
          <div className="register-mobile-hero-overlay" />

          {/* Logo arriba */}
          <BrandLogo size="sm" className="register-mobile-hero-brand" />

          {/* Texto principal */}
          <div className="register-mobile-hero-text">
            <div className="rht-eyebrow">
              <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor"><circle cx="4" cy="4" r="4"/></svg>
              Acceso de por vida
            </div>
            <h2>Empieza hoy.<br/><em>Un solo pago.</em></h2>
            <div className="rht-price">
              $4.00 USD <span>pago único · sin renovaciones</span>
            </div>
          </div>
        </div>

        <div className="register-box">

          <button className="register-back" onClick={() => navigate('/')}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="15,18 9,12 15,6"/>
            </svg>
            Volver al inicio
          </button>

          <div className="register-header">
            <h1>Crea tu cuenta</h1>
            <p>Completa tus datos y realiza el pago único de <strong>$4.00 USD</strong></p>
          </div>

          {/* Trust row — solo visible en mobile */}
          <div className="register-trust-row">
            <div className="register-trust-item">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                <polyline points="9 12 11 14 15 10"/>
              </svg>
              Sin datos bancarios
            </div>
            <div className="register-trust-item">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2"/>
                <path d="M7 11V7a5 5 0 0110 0v4"/>
              </svg>
              Pago seguro PayPal
            </div>
            <div className="register-trust-item">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 12c-2-2.5-4-4-6-4a4 4 0 000 8c2 0 4-1.5 6-4z"/>
                <path d="M12 12c2 2.5 4 4 6 4a4 4 0 000-8c-2 0-4 1.5-6 4z"/>
              </svg>
              Acceso de por vida
            </div>
          </div>

          {/* DATOS PERSONALES */}
          <div className="register-section">
            <div className="register-section-label">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              Tus datos
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Nombre</label>
                <input type="text" name="nombre" value={formData.nombre}
                  onChange={handleChange} placeholder="Juan"
                  className={errors.nombre ? 'error' : ''} autoFocus />
                {errors.nombre && <span className="error-message">{errors.nombre}</span>}
              </div>
              <div className="form-group">
                <label>Apellido</label>
                <input type="text" name="apellido" value={formData.apellido}
                  onChange={handleChange} placeholder="Pérez"
                  className={errors.apellido ? 'error' : ''} />
                {errors.apellido && <span className="error-message">{errors.apellido}</span>}
              </div>
            </div>

            <div className="form-group">
              <label>Correo electrónico</label>
              <div className="input-icon-wrap">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
                <input type="email" name="email" value={formData.email}
                  onChange={handleChange} placeholder="tu@email.com"
                  className={errors.email ? 'error' : ''} />
              </div>
              {errors.email && <span className="error-message">{errors.email}</span>}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Contraseña</label>
                <div className="input-icon-wrap">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2"/>
                    <path d="M7 11V7a5 5 0 0110 0v4"/>
                  </svg>
                  <input type="password" name="password" value={formData.password}
                    onChange={handleChange} placeholder="Mínimo 6 caracteres"
                    className={errors.password ? 'error' : ''} />
                </div>
                {errors.password && <span className="error-message">{errors.password}</span>}
              </div>
              <div className="form-group">
                <label>Confirmar contraseña</label>
                <div className="input-icon-wrap">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2"/>
                    <path d="M7 11V7a5 5 0 0110 0v4"/>
                  </svg>
                  <input type="password" name="confirmPassword" value={formData.confirmPassword}
                    onChange={handleChange} placeholder="Repite tu contraseña"
                    className={errors.confirmPassword ? 'error' : ''} />
                </div>
                {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
              </div>
            </div>
          </div>

          {/* RESUMEN + BOTÓN DE PAGO */}
          <div className="register-section register-section--payment">
            <div className="register-section-label">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="1" y="4" width="22" height="16" rx="2"/>
                <line x1="1" y1="10" x2="23" y2="10"/>
              </svg>
              Pago único
            </div>

            <div className="payment-badge">
              <div>
                <div className="payment-amount">$4.00 USD</div>
                <div className="payment-desc">Acceso de por vida · Sin renovaciones</div>
              </div>
              <div className="payment-badge-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              </div>
            </div>

            <button className="btn-pay" onClick={handleOpenPayment}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="1" y="4" width="22" height="16" rx="2"/>
                <line x1="1" y1="10" x2="23" y2="10"/>
              </svg>
              Continuar al pago
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{marginLeft:'auto'}}>
                <polyline points="9,18 15,12 9,6"/>
              </svg>
            </button>

            <p className="payment-security-note">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2"/>
                <path d="M7 11V7a5 5 0 0110 0v4"/>
              </svg>
              Pago seguro procesado por PayPal
            </p>
          </div>

          <div className="register-footer">
            <div className="register-divider"><span>o</span></div>
            <p>¿Ya tienes cuenta? <a href="/login">Inicia sesión aquí</a></p>
          </div>

        </div>
      </div>

      {/* ── MODAL DE PAGO ── */}
      {showModal && (
        <div className="pay-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="pay-modal">

            {/* Header del modal */}
            <div className="pay-modal-header">
              <div className="pay-modal-header-inner">
                <div className="pay-modal-title">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>
                  </svg>
                  Completa tu pago
                </div>
                <button className="pay-modal-close" onClick={() => setShowModal(false)} aria-label="Cerrar">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
            </div>

            {/* Resumen del pedido */}
            <div className="pay-modal-summary">
              <div className="pay-modal-summary-row">
                <span>Fintú & Co. PE — Acceso de por vida</span>
                <span className="pay-modal-price">$4.00</span>
              </div>
            </div>

            {/* Botones PayPal */}
            <div className="pay-modal-paypal">
              <PayPalButtons
                style={{ layout: 'vertical', shape: 'rect', label: 'pay', height: 46 }}
                createOrder={(data, actions) =>
                  actions.order.create({
                    purchase_units: [{
                      amount: { value: '4.00', currency_code: 'USD' },
                      description: `Fintú & Co. PE - ${formData.email}`
                    }]
                  })
                }
                onApprove={handleApprove}
                onError={() => {
                  showToast('Error al procesar el pago. Intenta de nuevo.', 'error');
                  setShowModal(false);
                }}
                onCancel={() => {
                  showToast('Pago cancelado. Puedes intentar cuando quieras.', 'warning');
                  setShowModal(false);
                }}
              />
            </div>

            {loading && (
              <div className="register-loading">
                <div className="register-spinner" />
                <span>Procesando tu pago y creando tu cuenta...</span>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
    </PayPalScriptProvider>
  );
}

export default Register;
