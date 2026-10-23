import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/modules/auth/context/AuthContext';
import { authApi } from '@/modules/auth/services/authApi';
import { useToast } from '@/shared/context/ToastContext';
import AppFooter from '@/shared/components/AppFooter';
import Sidebar from '@/shared/components/Sidebar';
/* Armazón compartido — ver nota en Comparador.jsx. */
import '@/modules/cards/pages/Dashboard.css';
import './Profile.css';

function Profile() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [profile, setProfile]       = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Datos personales
  const [nombre, setNombre]         = useState('');
  const [apellido, setApellido]     = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Contraseña
  const [pwActual, setPwActual]     = useState('');
  const [pwNueva, setPwNueva]       = useState('');
  const [pwConfirm, setPwConfirm]   = useState('');
  const [savingPw, setSavingPw]     = useState(false);
  const [showPwSection, setShowPwSection] = useState(false);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    authApi.getProfile(user.id).then(data => {
      if (data.success) {
        setProfile(data.user);
        setNombre(data.user.nombre);
        setApellido(data.user.apellido);
      }
    }).finally(() => setLoadingProfile(false));
  }, [user, navigate]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!nombre.trim() || !apellido.trim()) {
      showToast('Nombre y apellido son obligatorios', 'warning'); return;
    }
    setSavingProfile(true);
    try {
      const res = await authApi.updateProfile({ userId: user.id, nombre, apellido });
      if (res.success) {
        setProfile(res.user);
        // Actualizar localStorage
        const stored = JSON.parse(localStorage.getItem('user') || '{}');
        localStorage.setItem('user', JSON.stringify({ ...stored, nombre, apellido }));
        showToast('Perfil actualizado correctamente', 'success');
      } else {
        showToast(res.message || 'Error al actualizar', 'error');
      }
    } catch { showToast('Error de conexión', 'error'); }
    finally   { setSavingProfile(false); }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!pwActual || !pwNueva || !pwConfirm) {
      showToast('Completa todos los campos', 'warning'); return;
    }
    if (pwNueva.length < 6) {
      showToast('La nueva contraseña debe tener al menos 6 caracteres', 'warning'); return;
    }
    if (pwNueva !== pwConfirm) {
      showToast('Las contraseñas no coinciden', 'warning'); return;
    }
    setSavingPw(true);
    try {
      const res = await authApi.changePassword({ userId: user.id, currentPassword: pwActual, newPassword: pwNueva });
      if (res.success) {
        showToast('Contraseña actualizada correctamente', 'success');
        setPwActual(''); setPwNueva(''); setPwConfirm('');
        setShowPwSection(false);
      } else {
        showToast(res.message || 'Error al cambiar contraseña', 'error');
      }
    } catch { showToast('Error de conexión', 'error'); }
    finally   { setSavingPw(false); }
  };

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const initials = profile
    ? `${profile.nombre?.charAt(0)}${profile.apellido?.charAt(0)}`.toUpperCase()
    : '??';

  if (!user) return null;

  return (
    <div className="profile-page">

      <Sidebar active="perfil" open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* ── LAYOUT ── */}
      <div className="profile-layout">

        {/* Header */}
        <header className="dashboard-header">
          <div className="header-left">
            <button className="menu-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="15" y2="18"/>
              </svg>
            </button>
            <h1 className="header-title">Mi Perfil</h1>
          </div>
          <div className="header-right">
            <div className="header-avatar" title={`${user.nombre} ${user.apellido}`}>
              {initials}
            </div>
          </div>
        </header>

        <main className="profile-main">
        {loadingProfile ? (
          <div className="profile-loading">
            <div className="profile-spinner" />
          </div>
        ) : (
          <div className="profile-content">

            {/* ── AVATAR CARD ── */}
            <div className="profile-hero">
              <div className="profile-avatar">{initials}</div>
              <div className="profile-hero-info">
                <h1>{profile?.nombre} {profile?.apellido}</h1>
                <p className="profile-email">{profile?.email}</p>
                <div className="profile-badges">
                  <span className="profile-badge profile-badge--gold">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    </svg>
                    Acceso de por vida
                  </span>
                  <span className="profile-badge profile-badge--dim">
                    Miembro desde {formatDate(profile?.fecha_registro)}
                  </span>
                </div>
              </div>
            </div>

            {/* ── DATOS PERSONALES ── */}
            <div className="profile-card">
              <div className="profile-card-header">
                <div className="profile-card-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                </div>
                <div>
                  <h2>Datos personales</h2>
                  <p>Actualiza tu nombre y apellido</p>
                </div>
              </div>

              <form onSubmit={handleSaveProfile} className="profile-form">
                <div className="pf-row">
                  <div className="pf-group">
                    <label>Nombre</label>
                    <input type="text" value={nombre}
                      onChange={e => setNombre(e.target.value)} placeholder="Juan" />
                  </div>
                  <div className="pf-group">
                    <label>Apellido</label>
                    <input type="text" value={apellido}
                      onChange={e => setApellido(e.target.value)} placeholder="Pérez" />
                  </div>
                </div>
                <div className="pf-group">
                  <label>Correo electrónico</label>
                  <input type="email" value={profile?.email || ''} disabled
                    className="pf-input--readonly" />
                  <span className="pf-hint">El email no puede modificarse</span>
                </div>
                <button type="submit" className="pf-btn-save" disabled={savingProfile}>
                  {savingProfile ? (
                    <><div className="pf-spinner" /> Guardando...</>
                  ) : (
                    <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg> Guardar cambios</>
                  )}
                </button>
              </form>
            </div>

            {/* ── SEGURIDAD ── */}
            <div className="profile-card">
              <div className="profile-card-header profile-card-header--clickable"
                onClick={() => setShowPwSection(p => !p)}>
                <div className="profile-card-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <rect x="3" y="11" width="18" height="11" rx="2"/>
                    <path d="M7 11V7a5 5 0 0110 0v4"/>
                  </svg>
                </div>
                <div>
                  <h2>Seguridad</h2>
                  <p>Cambia tu contraseña de acceso</p>
                </div>
                <svg className={`profile-chevron ${showPwSection ? 'open' : ''}`}
                  viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="6,9 12,15 18,9"/>
                </svg>
              </div>

              {showPwSection && (
                <form onSubmit={handleChangePassword} className="profile-form profile-form--animate">
                  <div className="pf-group">
                    <label>Contraseña actual</label>
                    <input type="password" value={pwActual}
                      onChange={e => setPwActual(e.target.value)}
                      placeholder="Tu contraseña actual" autoFocus />
                  </div>
                  <div className="pf-row">
                    <div className="pf-group">
                      <label>Nueva contraseña</label>
                      <input type="password" value={pwNueva}
                        onChange={e => setPwNueva(e.target.value)}
                        placeholder="Mínimo 6 caracteres" />
                    </div>
                    <div className="pf-group">
                      <label>Confirmar contraseña</label>
                      <input type="password" value={pwConfirm}
                        onChange={e => setPwConfirm(e.target.value)}
                        placeholder="Repite la nueva" />
                    </div>
                  </div>
                  <button type="submit" className="pf-btn-save" disabled={savingPw}>
                    {savingPw ? (
                      <><div className="pf-spinner" /> Actualizando...</>
                    ) : (
                      <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg> Actualizar contraseña</>
                    )}
                  </button>
                </form>
              )}
            </div>

            {/* ── MI PLAN ── */}
            <div className="profile-card profile-card--plan">
              <div className="profile-card-header">
                <div className="profile-card-icon profile-card-icon--gold">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <rect x="1" y="4" width="22" height="16" rx="2"/>
                    <line x1="1" y1="10" x2="23" y2="10"/>
                  </svg>
                </div>
                <div>
                  <h2>Mi plan</h2>
                  <p>Información de tu pago único</p>
                </div>
              </div>

              <div className="plan-grid">
                <div className="plan-item">
                  <span className="plan-label">Plan</span>
                  <span className="plan-value plan-value--gold">Acceso de por vida ✓</span>
                </div>
                <div className="plan-item">
                  <span className="plan-label">Monto pagado</span>
                  <span className="plan-value">
                    {profile?.monto_pagado ? `$${parseFloat(profile.monto_pagado).toFixed(2)} USD` : '—'}
                  </span>
                </div>
                <div className="plan-item">
                  <span className="plan-label">Fecha de pago</span>
                  <span className="plan-value">{formatDate(profile?.fecha_pago)}</span>
                </div>
                <div className="plan-item plan-item--full">
                  <span className="plan-label">ID de pago PayPal</span>
                  <span className="plan-value plan-value--mono">
                    {profile?.paypal_payment_id || '—'}
                  </span>
                </div>
              </div>
            </div>

          </div>
        )}
      </main>

      <div className="profile-footer-full">
        <AppFooter variant="light" />
      </div>

      </div>{/* /profile-layout */}
    </div>
  );
}

export default Profile;
