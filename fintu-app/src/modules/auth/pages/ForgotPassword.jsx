import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '@/modules/auth/services/authApi';
import AuthLayout from '@/modules/auth/components/AuthLayout';

const ASIDE = {
  title: 'Vuelve a tus tarjetas.',
  text: 'Te enviamos un código a tu correo y creas una contraseña nueva en un minuto.',
};

const IcBack = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M19 12H5M11 6l-6 6 6 6" />
  </svg>
);

function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: email, 2: code + new pass, 3: success
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const showMsg = (text, type = 'error') => {
    setMessage({ text, type });
    if (type !== 'success') setTimeout(() => setMessage({ text: '', type: '' }), 6000);
  };

  const handleSendCode = async (e) => {
    e.preventDefault();
    if (!email.trim()) return showMsg('Ingresa tu email');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return showMsg('Email inválido');
    setLoading(true);
    try {
      const data = await authApi.forgotPassword({ email });
      if (data.success) {
        showMsg(data.message, 'success');
        setTimeout(() => { setMessage({ text: '', type: '' }); setStep(2); }, 1500);
      } else {
        showMsg(data.message || 'Error al enviar el código');
      }
    } catch {
      showMsg('Error de conexión. Verifica tu internet.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    if (!code.trim()) return showMsg('Ingresa el código');
    if (code.length !== 6) return showMsg('El código debe tener 6 dígitos');
    if (!newPassword) return showMsg('Ingresa tu nueva contraseña');
    if (newPassword.length < 6) return showMsg('La contraseña debe tener al menos 6 caracteres');
    if (newPassword !== confirmPassword) return showMsg('Las contraseñas no coinciden');
    setLoading(true);
    try {
      const data = await authApi.resetPassword({ email, code, newPassword });
      if (data.success) {
        setStep(3);
      } else {
        showMsg(data.message || 'Código incorrecto o expirado');
      }
    } catch {
      showMsg('Error de conexión. Verifica tu internet.');
    } finally {
      setLoading(false);
    }
  };

  const msg = message.text && (
    <div className={`au-msg au-msg--${message.type}`} role="status">{message.text}</div>
  );

  return (
    <AuthLayout aside={ASIDE}>
      {step < 3 && (
        <div className="au-steps" aria-label={`Paso ${step} de 2`}>
          <span className={`au-step is-on${step > 1 ? ' is-done' : ''}`}><b>{step > 1 ? '✓' : '1'}</b> Email</span>
          <i />
          <span className={`au-step${step >= 2 ? ' is-on' : ''}`}><b>2</b> Código</span>
        </div>
      )}

      {step === 1 && (
        <>
          <div className="au-head">
            <h1>Recupera tu contraseña</h1>
            <p>Te enviaremos un código de 6 dígitos a tu correo.</p>
          </div>
          {msg}
          <form onSubmit={handleSendCode} className="au-form" noValidate>
            <div className="au-field">
              <label htmlFor="fp-email">Correo electrónico</label>
              <input
                id="fp-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="tu@email.com"
                autoFocus
              />
            </div>
            <button type="submit" className="au-btn" disabled={loading}>
              {loading ? 'Enviando…' : 'Enviar código'}
            </button>
          </form>
          <button type="button" className="au-ghost" onClick={() => navigate('/login')}>
            <IcBack /> Volver a iniciar sesión
          </button>
        </>
      )}

      {step === 2 && (
        <>
          <div className="au-head">
            <h1>Ingresa el código</h1>
            <p>Lo enviamos a <strong>{email}</strong>. Vence en 15 minutos.</p>
          </div>
          {msg}
          <form onSubmit={handleReset} className="au-form" noValidate>
            <div className="au-field">
              <label htmlFor="fp-code">Código de 6 dígitos</label>
              <input
                id="fp-code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={code}
                onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                className="au-code"
                autoFocus
                maxLength={6}
              />
            </div>
            <div className="au-field">
              <label htmlFor="fp-pass">Nueva contraseña</label>
              <input
                id="fp-pass"
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
              />
            </div>
            <div className="au-field">
              <label htmlFor="fp-pass2">Confirmar contraseña</label>
              <input
                id="fp-pass2"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Repite tu contraseña"
              />
            </div>
            <button type="submit" className="au-btn" disabled={loading}>
              {loading ? 'Verificando…' : 'Cambiar contraseña'}
            </button>
          </form>
          <button
            type="button"
            className="au-ghost"
            onClick={() => { setStep(1); setCode(''); setNewPassword(''); setConfirmPassword(''); setMessage({ text: '', type: '' }); }}
          >
            <IcBack /> Reenviar código
          </button>
        </>
      )}

      {step === 3 && (
        <>
          <div className="au-done-ico" aria-hidden="true">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <div className="au-head">
            <h1>Contraseña actualizada</h1>
            <p>Ya puedes iniciar sesión con tu nueva contraseña.</p>
          </div>
          <button type="button" className="au-btn" onClick={() => navigate('/login')}>
            Iniciar sesión
          </button>
        </>
      )}
    </AuthLayout>
  );
}

export default ForgotPassword;
