import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/modules/auth/context/AuthContext';
import { authApi } from '@/modules/auth/services/authApi';
import { useToast } from '@/shared/context/ToastContext';
import Sidebar from '@/shared/components/Sidebar';
/* Armazón compartido (layout + sidebar) — ver nota en Comparador.jsx. */
import '@/modules/cards/pages/Dashboard.css';
import './Profile.css';

const IcMenu  = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><line x1="4" y1="7" x2="20" y2="7" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="17" x2="14" y2="17" /></svg>);
const IcCheck = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12" /></svg>);
const IcOut   = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>);
const IcMail  = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M22 7l-10 7L2 7" /></svg>);
const IcCopy  = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" /></svg>);

const formatDate = (dateStr) => (dateStr
  ? new Date(dateStr).toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' })
  : '—');

function Profile() {
  const navigate = useNavigate();
  const { user, token, login, logout } = useAuth();
  const { showToast } = useToast();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  const [pwActual, setPwActual] = useState('');
  const [pwNueva, setPwNueva] = useState('');
  const [pwConfirm, setPwConfirm] = useState('');
  const [savingPw, setSavingPw] = useState(false);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    authApi.getProfile(user.id).then(data => {
      if (data.success) {
        setProfile(data.user);
        setNombre(data.user.nombre);
        setApellido(data.user.apellido);
      }
    }).finally(() => setLoadingProfile(false));
    // Solo al cambiar de usuario: al guardar el nombre se actualiza `user` y no hace falta recargar
  }, [user?.id, navigate]); // eslint-disable-line react-hooks/exhaustive-deps

  const cambios = profile && (nombre.trim() !== profile.nombre || apellido.trim() !== profile.apellido);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!nombre.trim() || !apellido.trim()) { showToast('Nombre y apellido son obligatorios', 'warning'); return; }
    setSavingProfile(true);
    try {
      const res = await authApi.updateProfile({ userId: user.id, nombre: nombre.trim(), apellido: apellido.trim() });
      if (res.success) {
        setProfile(p => ({ ...p, ...(res.user || {}), nombre: nombre.trim(), apellido: apellido.trim() }));
        // Actualiza la sesión para que el menú y los saludos muestren el nombre nuevo sin recargar
        login(token, { ...user, nombre: nombre.trim(), apellido: apellido.trim() });
        showToast('Datos actualizados', 'success');
      } else {
        showToast(res.message || 'Error al actualizar', 'error');
      }
    } catch { showToast('Error de conexión', 'error'); }
    finally { setSavingProfile(false); }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!pwActual || !pwNueva || !pwConfirm) { showToast('Completa los tres campos', 'warning'); return; }
    if (pwNueva.length < 6) { showToast('La nueva contraseña debe tener al menos 6 caracteres', 'warning'); return; }
    if (pwNueva !== pwConfirm) { showToast('Las contraseñas nuevas no coinciden', 'warning'); return; }
    setSavingPw(true);
    try {
      const res = await authApi.changePassword({ userId: user.id, currentPassword: pwActual, newPassword: pwNueva });
      if (res.success) {
        showToast('Contraseña actualizada', 'success');
        setPwActual(''); setPwNueva(''); setPwConfirm('');
      } else {
        showToast(res.message || 'Error al cambiar contraseña', 'error');
      }
    } catch { showToast('Error de conexión', 'error'); }
    finally { setSavingPw(false); }
  };

  const copiarId = async () => {
    try {
      await navigator.clipboard.writeText(profile.paypal_payment_id);
      showToast('ID de pago copiado', 'success');
    } catch { showToast('No se pudo copiar', 'error'); }
  };

  if (!user) return null;

  const initials = `${(profile?.nombre || user.nombre || '').charAt(0)}${(profile?.apellido || user.apellido || '').charAt(0)}`.toUpperCase();

  return (
    <div className="dashboard-dark">
      <Sidebar active="perfil" open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="dashboard-layout">
        <main className="pf">

          <header className="pf-top">
            <button className="pf-icon-btn" onClick={() => setSidebarOpen(true)} aria-label="Abrir menú"><IcMenu /></button>
            <div className="pf-title">
              <h1>Mi perfil</h1>
              <p>Tu cuenta, tu acceso y tu seguridad.</p>
            </div>
          </header>

          {loadingProfile ? (
            <div className="pf-loading"><div className="spinner"></div></div>
          ) : (
            <>
              {/* ── TU CUENTA ── */}
              <section className="pf-hero" aria-label="Tu cuenta">
                <span className="pf-avatar" aria-hidden="true">{initials}</span>
                <div className="pf-hero-info">
                  <h2>{profile?.nombre} {profile?.apellido}</h2>
                  <p>{profile?.email}</p>
                  <div className="pf-chips">
                    <span className="pf-chip pf-chip--peach"><IcCheck /> Acceso de por vida</span>
                    <span className="pf-chip">Miembro desde {formatDate(profile?.fecha_registro)}</span>
                  </div>
                </div>
                <button className="pf-btn pf-btn--ghost-light" onClick={logout}><IcOut /> Cerrar sesión</button>
              </section>

              <div className="pf-grid">
                <div className="pf-col">
                  {/* ── DATOS ── */}
                  <section className="pf-card" aria-labelledby="pf-datos-t">
                    <span className="pf-tag">Datos</span>
                    <h2 id="pf-datos-t">¿Tus datos están bien?</h2>
                    <form onSubmit={handleSaveProfile} className="pf-form" noValidate>
                      <div className="pf-row">
                        <label className="pf-field">
                          <span>Nombre</span>
                          <input type="text" autoComplete="given-name" value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Juan" />
                        </label>
                        <label className="pf-field">
                          <span>Apellido</span>
                          <input type="text" autoComplete="family-name" value={apellido} onChange={e => setApellido(e.target.value)} placeholder="Pérez" />
                        </label>
                      </div>
                      <label className="pf-field">
                        <span>Correo electrónico</span>
                        <input type="email" value={profile?.email || ''} disabled />
                        <small>Es tu usuario para entrar; no se puede cambiar.</small>
                      </label>
                      <button type="submit" className="pf-btn pf-btn--green" disabled={savingProfile || !cambios}>
                        {savingProfile ? 'Guardando…' : 'Guardar cambios'}
                      </button>
                    </form>
                  </section>

                  {/* ── SEGURIDAD ── */}
                  <section className="pf-card" aria-labelledby="pf-seg-t">
                    <span className="pf-tag">Seguridad</span>
                    <h2 id="pf-seg-t">Cambia tu contraseña</h2>
                    <form onSubmit={handleChangePassword} className="pf-form" noValidate>
                      <label className="pf-field">
                        <span>Contraseña actual</span>
                        <input type="password" autoComplete="current-password" value={pwActual} onChange={e => setPwActual(e.target.value)} placeholder="Tu contraseña actual" />
                      </label>
                      <div className="pf-row">
                        <label className="pf-field">
                          <span>Nueva contraseña</span>
                          <input type="password" autoComplete="new-password" value={pwNueva} onChange={e => setPwNueva(e.target.value)} placeholder="Mínimo 6 caracteres" />
                        </label>
                        <label className="pf-field">
                          <span>Repite la nueva</span>
                          <input type="password" autoComplete="new-password" value={pwConfirm} onChange={e => setPwConfirm(e.target.value)} placeholder="Igual a la anterior" />
                        </label>
                      </div>
                      <button type="submit" className="pf-btn pf-btn--green" disabled={savingPw || !pwActual || !pwNueva || !pwConfirm}>
                        {savingPw ? 'Actualizando…' : 'Cambiar contraseña'}
                      </button>
                    </form>
                  </section>
                </div>

                <div className="pf-col">
                  {/* ── PLAN ── */}
                  <section className="pf-card" aria-labelledby="pf-plan-t">
                    <span className="pf-tag">Pago</span>
                    <h2 id="pf-plan-t">Tu plan</h2>
                    <dl className="pf-facts">
                      <div><dt>Plan</dt><dd className="pf-good">Acceso de por vida</dd></div>
                      <div><dt>Pagaste</dt><dd>{profile?.monto_pagado ? `$${parseFloat(profile.monto_pagado).toFixed(2)} USD` : '—'}</dd></div>
                      <div><dt>Fecha de pago</dt><dd>{formatDate(profile?.fecha_pago)}</dd></div>
                      <div><dt>Renovación</dt><dd>Ninguna, es un pago único</dd></div>
                    </dl>
                    {profile?.paypal_payment_id && (
                      <div className="pf-payid">
                        <div>
                          <span>ID de pago PayPal</span>
                          <code>{profile.paypal_payment_id}</code>
                        </div>
                        <button type="button" className="pf-copy" onClick={copiarId} aria-label="Copiar ID de pago"><IcCopy /></button>
                      </div>
                    )}
                    <p className="pf-hint">Tenlo a mano si escribes a soporte por tu pago.</p>
                  </section>

                  {/* ── AYUDA ── */}
                  <section className="pf-card pf-card--help" aria-labelledby="pf-ayuda-t">
                    <h2 id="pf-ayuda-t">¿Necesitas ayuda?</h2>
                    <p>Escríbenos y te respondemos lo antes posible.</p>
                    <a className="pf-btn pf-btn--outline" href="mailto:soporte@fintu.pe"><IcMail /> soporte@fintu.pe</a>
                  </section>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default Profile;
