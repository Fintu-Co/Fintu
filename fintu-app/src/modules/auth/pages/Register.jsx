import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { useToast } from '@/shared/context/ToastContext';
import AuthLayout from '@/modules/auth/components/AuthLayout';

const initialOptions = {
  clientId: import.meta.env.VITE_PAYPAL_CLIENT_ID,
  currency: 'USD',
  intent: 'capture',
};

const ASIDE = {
  title: 'Un pago. Para siempre.',
  text: 'Crea tu cuenta y empieza a pagar tus tarjetas a tiempo.',
  points: [
    'Ciclos y fechas calculados solos',
    'El interés, antes de que llegue',
    'Hasta 4 tarjetas de cualquier banco',
  ],
};

const IcShield = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6z" />
  </svg>
);
const IcArrow = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

function Field({ id, label, error, ...input }) {
  return (
    <div className="au-field">
      <label htmlFor={id}>{label}</label>
      <input id={id} className={error ? 'is-error' : ''} aria-invalid={!!error} {...input} />
      {error && <span className="au-error">{error}</span>}
    </div>
  );
}

function Register() {
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

  const handleOpenPayment = (ev) => {
    ev.preventDefault();
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
      <AuthLayout aside={ASIDE}>
        <div className="au-head">
          <h1>Crea tu cuenta</h1>
          <p>Tus datos y un pago único de <strong>$4 USD</strong>. Nada más.</p>
        </div>

        <form className="au-form" onSubmit={handleOpenPayment} noValidate>
          <div className="au-row">
            <Field id="reg-nombre" label="Nombre" name="nombre" autoComplete="given-name"
              value={formData.nombre} onChange={handleChange} placeholder="Juan"
              error={errors.nombre} autoFocus />
            <Field id="reg-apellido" label="Apellido" name="apellido" autoComplete="family-name"
              value={formData.apellido} onChange={handleChange} placeholder="Pérez"
              error={errors.apellido} />
          </div>
          <Field id="reg-email" label="Correo electrónico" type="email" name="email" autoComplete="email"
            value={formData.email} onChange={handleChange} placeholder="tu@email.com"
            error={errors.email} />
          <div className="au-row">
            <Field id="reg-pass" label="Contraseña" type="password" name="password" autoComplete="new-password"
              value={formData.password} onChange={handleChange} placeholder="Mínimo 6 caracteres"
              error={errors.password} />
            <Field id="reg-pass2" label="Confirmar contraseña" type="password" name="confirmPassword" autoComplete="new-password"
              value={formData.confirmPassword} onChange={handleChange} placeholder="Repite tu contraseña"
              error={errors.confirmPassword} />
          </div>

          <div className="au-pay">
            <div>
              <strong>$4 USD</strong>
              <span>Pago único · acceso de por vida</span>
            </div>
            <span className="au-pay-tag">Sin renovaciones</span>
          </div>

          <button type="submit" className="au-btn">
            Continuar al pago <IcArrow />
          </button>

          <div className="au-trust">
            <span><IcShield /> Pago seguro con PayPal</span>
            <span><IcShield /> Sin datos bancarios</span>
          </div>
        </form>

        <p className="au-alt">
          ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
        </p>
      </AuthLayout>

      {/* ── MODAL DE PAGO ── */}
      {showModal && (
        <div className="au-modal-ov" onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="au-modal" role="dialog" aria-modal="true" aria-label="Completa tu pago">
            <div className="au-modal-head">
              <h2>Completa tu pago</h2>
              <button className="au-modal-x" onClick={() => setShowModal(false)} aria-label="Cerrar">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="au-modal-sum">
              <span>Fintú &amp; Co. · acceso de por vida</span>
              <b>$4.00</b>
            </div>

            <PayPalButtons
              style={{ layout: 'vertical', shape: 'pill', label: 'pay', height: 48 }}
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

            {loading && (
              <div className="au-loading" role="status">
                <div className="au-spinner" />
                <span>Procesando tu pago y creando tu cuenta…</span>
              </div>
            )}
          </div>
        </div>
      )}
    </PayPalScriptProvider>
  );
}

export default Register;
