import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../services/api';
import './ForgotPassword.css';

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

  return (
    <div className="fp-container">
      <div className="fp-glow" />

      <div className="fp-box">

        {/* ── LOGO ── */}
        <div className="fp-logo" onClick={() => navigate('/')}>Fintú & Co.</div>

        {/* ── STEP INDICATOR ── */}
        {step < 3 && (
          <div className="fp-steps">
            <div className={`fp-step ${step >= 1 ? 'active' : ''} ${step > 1 ? 'done' : ''}`}>
              <div className="fp-step-dot">{step > 1 ? '✓' : '1'}</div>
              <span>Email</span>
            </div>
            <div className="fp-step-line" />
            <div className={`fp-step ${step >= 2 ? 'active' : ''}`}>
              <div className="fp-step-dot">2</div>
              <span>Código</span>
            </div>
          </div>
        )}

        {/* ── STEP 1: EMAIL ── */}
        {step === 1 && (
          <>
            <div className="fp-header">
              <div className="fp-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="2" y="4" width="20" height="16" rx="2"/>
                  <path d="M22 7l-10 7L2 7"/>
                </svg>
              </div>
              <h1>Recuperar contraseña</h1>
              <p>Ingresa tu email y te enviaremos un código de 6 dígitos.</p>
            </div>

            {message.text && (
              <div className={`fp-message fp-message--${message.type}`}>{message.text}</div>
            )}

            <form onSubmit={handleSendCode} className="fp-form">
              <div className="fp-field">
                <label>Correo electrónico</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  autoFocus
                />
              </div>
              <button type="submit" className="fp-btn-primary" disabled={loading}>
                {loading ? 'Enviando...' : 'Enviar código'}
              </button>
            </form>

            <button className="fp-btn-back" onClick={() => navigate('/login')}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
              Volver al login
            </button>
          </>
        )}

        {/* ── STEP 2: CODE + NEW PASSWORD ── */}
        {step === 2 && (
          <>
            <div className="fp-header">
              <div className="fp-icon fp-icon--code">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0110 0v4"/>
                </svg>
              </div>
              <h1>Ingresa el código</h1>
              <p>Enviamos un código de 6 dígitos a <strong>{email}</strong>. Expira en 15 minutos.</p>
            </div>

            {message.text && (
              <div className={`fp-message fp-message--${message.type}`}>{message.text}</div>
            )}

            <form onSubmit={handleReset} className="fp-form">
              <div className="fp-field">
                <label>Código de 6 dígitos</label>
                <input
                  type="text"
                  value={code}
                  onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="123456"
                  className="fp-code-input"
                  autoFocus
                  maxLength={6}
                />
              </div>
              <div className="fp-field">
                <label>Nueva contraseña</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                />
              </div>
              <div className="fp-field">
                <label>Confirmar contraseña</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Repite tu contraseña"
                />
              </div>
              <button type="submit" className="fp-btn-primary" disabled={loading}>
                {loading ? 'Verificando...' : 'Restablecer contraseña'}
              </button>
            </form>

            <button className="fp-btn-back" onClick={() => { setStep(1); setCode(''); setNewPassword(''); setConfirmPassword(''); setMessage({ text: '', type: '' }); }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
              Reenviar código
            </button>
          </>
        )}

        {/* ── STEP 3: SUCCESS ── */}
        {step === 3 && (
          <div className="fp-success">
            <div className="fp-success-icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <h1>¡Contraseña actualizada!</h1>
            <p>Tu contraseña fue restablecida exitosamente. Ya puedes iniciar sesión con tu nueva contraseña.</p>
            <button className="fp-btn-primary" onClick={() => navigate('/login')}>
              Ir al login
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

export default ForgotPassword;
