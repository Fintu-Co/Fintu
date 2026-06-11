import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { goalsApi } from '../../services/api';
import './GoalsModal.css';

const GOAL_TYPES = [
  {
    tipo: 'reducir_uso',
    titulo: 'Reducir uso de línea',
    descripcion: 'Baja tu % de uso al objetivo que elijas',
    icono: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
        <polyline points="17 6 23 6 23 12"/>
      </svg>
    ),
    color: 'cyan',
    necesitaMeta: true,
    metaLabel: '¿A qué % quieres llegar?',
    metaPlaceholder: 'Ej: 30',
    metaSufijo: '%',
    necesitaFecha: true,
  },
  {
    tipo: 'reducir_deuda',
    titulo: 'Reducir mi deuda',
    descripcion: 'Lleva tu deuda total a un monto objetivo',
    icono: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="12" y1="1" x2="12" y2="23"/>
        <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
      </svg>
    ),
    color: 'gold',
    necesitaMeta: true,
    metaLabel: '¿A cuánto quieres reducir tu deuda?',
    metaPlaceholder: 'Ej: 500',
    metaSufijo: 'S/',
    necesitaFecha: true,
  },
  {
    tipo: 'pago_total',
    titulo: 'Pagar el total este mes',
    descripcion: 'Liquida toda tu deuda antes del vencimiento',
    icono: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
    ),
    color: 'green',
    necesitaMeta: false,
    necesitaFecha: false,
  },
  {
    tipo: 'no_atrasar',
    titulo: 'No atrasar pagos',
    descripcion: 'Mantén todos tus pagos al día por 3 meses',
    icono: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    ),
    color: 'purple',
    necesitaMeta: false,
    necesitaFecha: false,
  },
  {
    tipo: 'mantener_uso',
    titulo: 'Mantener uso bajo 30%',
    descripcion: 'El rango ideal para tu score crediticio',
    icono: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    ),
    color: 'orange',
    necesitaMeta: false,
    necesitaFecha: true,
  },
];

function GoalsModal({ userId, tarjetas, onClose }) {
  const [tab, setTab] = useState('activos'); // 'activos' | 'nuevo' | 'historial'
  const [goals, setGoals] = useState([]);
  const [completedGoals, setCompletedGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedType, setSelectedType] = useState(null);
  const [metaValor, setMetaValor] = useState('');
  const [fechaLimite, setFechaLimite] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  const tarjetasActivas = tarjetas.filter(t => !t.esta_vacia);
  const totalLinea = tarjetasActivas.reduce((s, t) => s + parseFloat(t.linea_credito || 0), 0);
  const totalDeuda = tarjetasActivas.reduce((s, t) => s + parseFloat(t.deuda_actual || 0), 0);
  const usoActual = totalLinea > 0 ? Math.round((totalDeuda / totalLinea) * 100) : 0;

  useEffect(() => {
    cargarObjetivos();
  }, []);

  const cargarObjetivos = async () => {
    try {
      setLoading(true);
      const data = await goalsApi.getByUser(userId);
      if (data.success) {
        setGoals(data.objetivos);
        setCompletedGoals(data.completados);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGoal = async () => {
    if (!selectedType) return;
    const config = GOAL_TYPES.find(g => g.tipo === selectedType);
    if (config.necesitaMeta && !metaValor) return;

    try {
      setSaving(true);
      const data = await goalsApi.create({
        usuario_id: userId,
        tipo: selectedType,
        descripcion: config.titulo,
        meta_valor: metaValor || null,
        fecha_limite: fechaLimite || null,
      });
      if (data.success) {
        setSuccessMsg('¡Objetivo creado!');
        setTimeout(() => setSuccessMsg(''), 3000);
        setSelectedType(null);
        setMetaValor('');
        setFechaLimite('');
        setTab('activos');
        cargarObjetivos();
      } else {
        setSuccessMsg(data.message);
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (goalId) => {
    try {
      await goalsApi.delete({ objetivo_id: goalId, usuario_id: userId });
      setDeleteConfirm(null);
      cargarObjetivos();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleComplete = async (goalId) => {
    try {
      await goalsApi.complete({ objetivo_id: goalId, usuario_id: userId });
      cargarObjetivos();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const getGoalConfig = (tipo) => GOAL_TYPES.find(g => g.tipo === tipo) || GOAL_TYPES[0];

  const calcularPorcentajeProgreso = (goal) => {
    if (goal.tipo === 'reducir_uso') {
      // Progreso: desde uso inicial hasta meta
      const inicio = goal.progreso_actual > goal.meta_valor ? goal.progreso_actual : usoActual;
      if (usoActual <= goal.meta_valor) return 100;
      const rango = inicio - goal.meta_valor;
      const avance = inicio - usoActual;
      return Math.max(0, Math.min(100, Math.round((avance / rango) * 100)));
    }
    if (goal.tipo === 'reducir_deuda') {
      if (totalDeuda <= goal.meta_valor) return 100;
      const inicio = goal.progreso_actual > goal.meta_valor ? goal.progreso_actual : totalDeuda;
      const rango = inicio - goal.meta_valor;
      const avance = inicio - totalDeuda;
      return Math.max(0, Math.min(100, Math.round((avance / rango) * 100)));
    }
    if (goal.tipo === 'pago_total') return totalDeuda === 0 ? 100 : 0;
    if (goal.tipo === 'mantener_uso' || goal.tipo === 'no_atrasar') {
      // Basado en tiempo transcurrido
      if (!goal.fecha_limite) return 50;
      const inicio = new Date(goal.fecha_inicio);
      const fin = new Date(goal.fecha_limite);
      const ahora = new Date();
      const total = fin - inicio;
      const transcurrido = ahora - inicio;
      return Math.max(0, Math.min(100, Math.round((transcurrido / total) * 100)));
    }
    return 0;
  };

  const getColorClass = (color) => {
    const map = { cyan: 'cyan', gold: 'gold', green: 'green', purple: 'purple', orange: 'orange' };
    return map[color] || 'gold';
  };

  const formatearFecha = (fechaISO) => {
    if (!fechaISO) return null;
    const fecha = new Date(fechaISO);
    const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    return `${fecha.getDate()} ${meses[fecha.getMonth()]} ${fecha.getFullYear()}`;
  };

  const diasRestantes = (fechaISO) => {
    if (!fechaISO) return null;
    const dias = Math.ceil((new Date(fechaISO) - new Date()) / (1000 * 60 * 60 * 24));
    if (dias < 0) return 'Vencido';
    if (dias === 0) return 'Hoy';
    return `${dias} días`;
  };

  return createPortal(
    <div className="goals-overlay" onClick={onClose}>
      <div className="goals-modal" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="goals-header">
          <div className="goals-header-left">
            <div className="goals-header-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <circle cx="12" cy="12" r="6"/>
                <circle cx="12" cy="12" r="2"/>
              </svg>
            </div>
            <div>
              <h2>Mis Objetivos</h2>
              <span className="goals-header-sub">
                {goals.length}/3 objetivos activos
              </span>
            </div>
          </div>
          <button className="goals-close" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="goals-tabs">
          <button className={`goals-tab ${tab === 'activos' ? 'active' : ''}`} onClick={() => setTab('activos')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            Activos ({goals.length})
          </button>
          <button className={`goals-tab ${tab === 'nuevo' ? 'active' : ''}`} onClick={() => setTab('nuevo')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
            Nuevo objetivo
          </button>
          <button className={`goals-tab ${tab === 'historial' ? 'active' : ''}`} onClick={() => setTab('historial')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
            Historial ({completedGoals.length})
          </button>
        </div>

        {/* Mensaje de éxito/error */}
        {successMsg && (
          <div className={`goals-message ${successMsg.includes('!') ? 'success' : 'error'}`}>
            {successMsg}
          </div>
        )}

        <div className="goals-content">

          {/* ===== TAB: ACTIVOS ===== */}
          {tab === 'activos' && (
            <>
              {loading ? (
                <div className="goals-loading">
                  <div className="goals-spinner"></div>
                  <p>Cargando objetivos...</p>
                </div>
              ) : goals.length === 0 ? (
                <div className="goals-empty">
                  <div className="goals-empty-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <circle cx="12" cy="12" r="10"/>
                      <circle cx="12" cy="12" r="6"/>
                      <circle cx="12" cy="12" r="2"/>
                    </svg>
                  </div>
                  <h3>Sin objetivos activos</h3>
                  <p>Define una meta financiera y la app hará seguimiento automático de tu progreso.</p>
                  <button className="goals-btn-primary" onClick={() => setTab('nuevo')}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    Crear mi primer objetivo
                  </button>
                </div>
              ) : (
                <div className="goals-list">
                  {goals.map(goal => {
                    const config = getGoalConfig(goal.tipo);
                    const pct = calcularPorcentajeProgreso(goal);
                    const colorClass = getColorClass(config.color);
                    const dias = diasRestantes(goal.fecha_limite);

                    return (
                      <div key={goal.id} className={`goal-card ${colorClass}`}>
                        <div className="goal-card-header">
                          <div className="goal-card-left">
                            <div className={`goal-icon ${colorClass}`}>{config.icono}</div>
                            <div>
                              <h3>{goal.descripcion}</h3>
                              {goal.meta_valor && (
                                <span className="goal-meta-text">
                                  Meta: {config.metaSufijo === '%' ? `${goal.meta_valor}%` : `S/ ${parseFloat(goal.meta_valor).toLocaleString('es-PE')}`}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="goal-card-right">
                            <span className={`goal-pct ${pct >= 100 ? 'complete' : ''}`}>{pct}%</span>
                            {dias && (
                              <span className={`goal-dias ${dias === 'Vencido' ? 'vencido' : dias === 'Hoy' ? 'urgente' : ''}`}>
                                {dias}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Barra de progreso */}
                        <div className="goal-progress-wrap">
                          <div className="goal-progress-track">
                            <div
                              className={`goal-progress-fill ${colorClass} ${pct >= 100 ? 'complete' : ''}`}
                              style={{ width: `${Math.min(pct, 100)}%` }}
                            ></div>
                          </div>
                        </div>

                        {/* Contexto educativo */}
                        <div className="goal-context">
                          {goal.tipo === 'reducir_uso' && (
                            <span>Uso actual: <strong>{usoActual}%</strong> → Meta: <strong>{goal.meta_valor}%</strong></span>
                          )}
                          {goal.tipo === 'reducir_deuda' && (
                            <span>Deuda actual: <strong>S/ {totalDeuda.toLocaleString('es-PE')}</strong> → Meta: <strong>S/ {parseFloat(goal.meta_valor).toLocaleString('es-PE')}</strong></span>
                          )}
                          {goal.tipo === 'pago_total' && (
                            <span>{totalDeuda === 0 ? '✅ ¡Sin deuda! Objetivo cumplido' : `Deuda pendiente: S/ ${totalDeuda.toLocaleString('es-PE')}`}</span>
                          )}
                          {(goal.tipo === 'mantener_uso' || goal.tipo === 'no_atrasar') && (
                            <span>Iniciado: {formatearFecha(goal.fecha_inicio)}</span>
                          )}
                          {goal.fecha_limite && (
                            <span className="goal-fecha">· Vence: {formatearFecha(goal.fecha_limite)}</span>
                          )}
                        </div>

                        {/* Acciones */}
                        <div className="goal-actions">
                          {pct >= 100 && (
                            <button className="goal-btn-complete" onClick={() => handleComplete(goal.id)}>
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                              Marcar completado
                            </button>
                          )}
                          <button className="goal-btn-delete" onClick={() => setDeleteConfirm(goal.id)}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>
                            Abandonar
                          </button>
                        </div>

                        {/* Confirmar eliminar */}
                        {deleteConfirm === goal.id && (
                          <div className="goal-delete-confirm">
                            <p>¿Abandonar este objetivo?</p>
                            <div className="goal-delete-btns">
                              <button onClick={() => setDeleteConfirm(null)}>Cancelar</button>
                              <button className="danger" onClick={() => handleDelete(goal.id)}>Sí, abandonar</button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {goals.length < 3 && (
                    <button className="goals-btn-add-more" onClick={() => setTab('nuevo')}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
                      Agregar otro objetivo ({3 - goals.length} disponible{3 - goals.length !== 1 ? 's' : ''})
                    </button>
                  )}
                </div>
              )}
            </>
          )}

          {/* ===== TAB: NUEVO OBJETIVO ===== */}
          {tab === 'nuevo' && (
            <div className="goals-new">

              {goals.length >= 3 ? (
                <div className="goals-limit-msg">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  <div>
                    <strong>Límite alcanzado</strong>
                    <p>Ya tienes 3 objetivos activos. Completa o abandona uno para crear otro.</p>
                  </div>
                </div>
              ) : (
                <>
                  <p className="goals-new-intro">Elige el tipo de objetivo que quieres lograr:</p>

                  <div className="goal-types-grid">
                    {GOAL_TYPES.map(type => (
                      <div
                        key={type.tipo}
                        className={`goal-type-card ${type.color} ${selectedType === type.tipo ? 'selected' : ''}`}
                        onClick={() => { setSelectedType(type.tipo); setMetaValor(''); setFechaLimite(''); }}
                      >
                        <div className={`goal-type-icon ${type.color}`}>{type.icono}</div>
                        <div className="goal-type-content">
                          <h4>{type.titulo}</h4>
                          <p>{type.descripcion}</p>
                        </div>
                        {selectedType === type.tipo && (
                          <div className="goal-type-check">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Configuración del objetivo seleccionado */}
                  {selectedType && (() => {
                    const config = GOAL_TYPES.find(g => g.tipo === selectedType);
                    return (
                      <div className="goal-config">
                        <div className="goal-config-header">
                          <h4>Configura tu objetivo</h4>
                        </div>

                        {/* Contexto actual */}
                        <div className="goal-config-context">
                          {selectedType === 'reducir_uso' && (
                            <p>Tu uso actual es <strong>{usoActual}%</strong>. El ideal es <strong>30% o menos</strong>.</p>
                          )}
                          {selectedType === 'reducir_deuda' && (
                            <p>Tu deuda actual es <strong>S/ {totalDeuda.toLocaleString('es-PE')}</strong>. Define a cuánto quieres reducirla.</p>
                          )}
                          {selectedType === 'pago_total' && (
                            <p>Tienes <strong>S/ {totalDeuda.toLocaleString('es-PE')}</strong> de deuda total. ¿Puedes pagarlo todo este mes?</p>
                          )}
                          {selectedType === 'mantener_uso' && (
                            <p>Mantener el uso bajo <strong>30%</strong> durante un período mejora tu historial crediticio.</p>
                          )}
                          {selectedType === 'no_atrasar' && (
                            <p>Pagar a tiempo por 3 meses seguidos construye un historial crediticio sólido.</p>
                          )}
                        </div>

                        {config.necesitaMeta && (
                          <div className="goal-config-field">
                            <label>{config.metaLabel}</label>
                            <div className="goal-config-input-wrap">
                              {config.metaSufijo !== '%' && <span className="goal-config-prefix">S/</span>}
                              <input
                                type="number"
                                placeholder={config.metaPlaceholder}
                                value={metaValor}
                                onChange={e => setMetaValor(e.target.value)}
                                className="goal-config-input"
                                min="0"
                              />
                              {config.metaSufijo === '%' && <span className="goal-config-suffix">%</span>}
                            </div>
                          </div>
                        )}

                        {config.necesitaFecha && (
                          <div className="goal-config-field">
                            <label>Fecha límite (opcional)</label>
                            <input
                              type="date"
                              value={fechaLimite}
                              onChange={e => setFechaLimite(e.target.value)}
                              className="goal-config-input"
                              min={new Date().toISOString().split('T')[0]}
                            />
                          </div>
                        )}

                        <button
                          className="goals-btn-primary"
                          onClick={handleCreateGoal}
                          disabled={saving || (config.necesitaMeta && !metaValor)}
                        >
                          {saving ? (
                            <div className="goals-spinner small"></div>
                          ) : (
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                          )}
                          {saving ? 'Guardando...' : 'Crear objetivo'}
                        </button>
                      </div>
                    );
                  })()}
                </>
              )}
            </div>
          )}

          {/* ===== TAB: HISTORIAL ===== */}
          {tab === 'historial' && (
            <div className="goals-history">
              {completedGoals.length === 0 ? (
                <div className="goals-empty">
                  <div className="goals-empty-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                  </div>
                  <h3>Sin historial aún</h3>
                  <p>Aquí aparecerán los objetivos que hayas completado.</p>
                </div>
              ) : (
                completedGoals.map(goal => {
                  const config = getGoalConfig(goal.tipo);
                  return (
                    <div key={goal.id} className="goal-history-card">
                      <div className={`goal-icon small ${getColorClass(config.color)}`}>{config.icono}</div>
                      <div className="goal-history-content">
                        <h4>{goal.descripcion}</h4>
                        <span className="goal-history-date">
                          Completado: {formatearFecha(goal.fecha_completado)}
                        </span>
                      </div>
                      <div className="goal-history-badge">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                        Logrado
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="goals-footer">
          <p className="goals-footer-note">El progreso se actualiza automáticamente con tus movimientos</p>
          <button className="goals-btn-close" onClick={onClose}>Cerrar ✓</button>
        </div>

      </div>
    </div>,
    document.body
  );
}

export default GoalsModal;