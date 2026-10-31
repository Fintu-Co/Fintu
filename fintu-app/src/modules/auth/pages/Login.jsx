import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/modules/auth/context/AuthContext';
import { authApi } from '@/modules/auth/services/authApi';
import AuthLayout from '@/modules/auth/components/AuthLayout';

// ── Íconos inline ──────────────────────────────────────────
const IcMail = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="2" y="4" width="20" height="16" rx="2" /><path d="M22 7l-10 7L2 7" />
  </svg>
);
const IcLock = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const ASIDE = {
  title: 'Tus tarjetas, en orden.',
  text: 'Revisa tu ciclo, tus fechas y cuánto pagar para no pagar intereses.',
};

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
        if (data.requiresPayment) {
          // Plan anual vencido o pago pendiente: a la pantalla de pago
          navigate('/pagar', { state: { userId: data.userId, motivo: data.motivo, precio: data.precio, accesoHasta: data.accesoHasta, email: formData.email } });
        }
        else showMessage(data.message || 'Email o contraseña incorrectos.', 'error');
      }
    } catch {
      showMessage('Error de conexión. Verifica tu internet e intenta de nuevo.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout aside={ASIDE}>
      <div className="au-head">
        <h1>Bienvenido de vuelta</h1>
        <p>Ingresa a tu cuenta para continuar.</p>
      </div>

      {message.text && (
        <div className={`au-msg au-msg--${message.type}`} role="status">{message.text}</div>
      )}

      <form onSubmit={handleSubmit} className="au-form" noValidate>
        <div className="au-field">
          <label htmlFor="login-email">Correo electrónico</label>
          <div className="au-input">
            <IcMail />
            <input
              id="login-email"
              type="email"
              name="email"
              autoComplete="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="tu@email.com"
              className={errors.email ? 'is-error' : ''}
              aria-invalid={!!errors.email}
              autoFocus
            />
          </div>
          {errors.email && <span className="au-error">{errors.email}</span>}
        </div>

        <div className="au-field">
          <div className="au-label-row">
            <label htmlFor="login-password">Contraseña</label>
            <button type="button" className="au-link" onClick={() => navigate('/recuperar')}>
              ¿La olvidaste?
            </button>
          </div>
          <div className="au-input">
            <IcLock />
            <input
              id="login-password"
              type="password"
              name="password"
              autoComplete="current-password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Tu contraseña"
              className={errors.password ? 'is-error' : ''}
              aria-invalid={!!errors.password}
            />
          </div>
          {errors.password && <span className="au-error">{errors.password}</span>}
        </div>

        <button type="submit" className="au-btn" disabled={loading}>
          {loading ? 'Ingresando…' : 'Iniciar sesión'}
        </button>
      </form>

      <p className="au-alt">
        ¿No tienes cuenta? <Link to="/registro">Regístrate por $5</Link>
      </p>
    </AuthLayout>
  );
}

export default Login;
