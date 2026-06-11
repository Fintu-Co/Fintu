import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Toast from '../ui/Toast';
import { cardsApi } from '../../services/api';
import './AddCardModal.css';

const MONEDAS_PRESET = [
  { nombre: 'Soles',   simbolo: 'S/' },
  { nombre: 'Dólares', simbolo: '$'  },
  { nombre: 'Euros',   simbolo: '€'  },
];

const getBankGradient = (nombre) => {
  const b = (nombre || '').toLowerCase();
  if (b.includes('bcp'))        return 'linear-gradient(145deg,#0d1e3d,#061020)';
  if (b.includes('bbva'))       return 'linear-gradient(145deg,#0d0d3d,#040420)';
  if (b.includes('interbank'))  return 'linear-gradient(145deg,#0d2a0d,#051005)';
  if (b.includes('scotiabank')) return 'linear-gradient(145deg,#3a0d0d,#1a0505)';
  return 'linear-gradient(145deg,#1e1812,#0e0a07)';
};

/* ── SVG helpers ── */
const ChipSVG = () => (
  <svg width="32" height="24" viewBox="0 0 32 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="1" y="1" width="30" height="22" rx="4" fill="rgba(212,165,116,0.25)" stroke="rgba(212,165,116,0.5)" strokeWidth="1"/>
    <rect x="11" y="1" width="10" height="22" fill="rgba(212,165,116,0.12)"/>
    <rect x="1" y="8" width="30" height="8" fill="rgba(212,165,116,0.12)"/>
    <rect x="11" y="8" width="10" height="8" fill="rgba(212,165,116,0.2)"/>
  </svg>
);

const WifiSVG = () => (
  <svg width="20" height="16" viewBox="0 0 20 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 12.5C10.8284 12.5 11.5 13.1716 11.5 14C11.5 14.8284 10.8284 15.5 10 15.5C9.17157 15.5 8.5 14.8284 8.5 14C8.5 13.1716 9.17157 12.5 10 12.5Z" fill="rgba(212,165,116,0.7)"/>
    <path d="M6.34 9.16C7.35 8.15 8.71 7.5 10 7.5C11.29 7.5 12.65 8.15 13.66 9.16L15.07 7.75C13.69 6.37 11.9 5.5 10 5.5C8.1 5.5 6.31 6.37 4.93 7.75L6.34 9.16Z" fill="rgba(212,165,116,0.6)"/>
    <path d="M2.93 5.57C4.68 3.82 7.22 2.75 10 2.75C12.78 2.75 15.32 3.82 17.07 5.57L18.5 4.14C16.37 2.01 13.34 0.75 10 0.75C6.66 0.75 3.63 2.01 1.5 4.14L2.93 5.57Z" fill="rgba(212,165,116,0.45)"/>
  </svg>
);

function AddCardModal({ isOpen, onClose, userId, slotNumero, onCardAdded }) {
  const [bancos, setBancos] = useState([]);
  const [bancosFiltered, setBancosFiltered] = useState([]);
  const [searchBanco, setSearchBanco] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [step, setStep] = useState(1);
  const [monedaCustom, setMonedaCustom] = useState(false);

  const [formData, setFormData] = useState({
    banco_id: '',
    banco_nombre_custom: '',
    tea_custom: '',
    nombre_tarjeta: '',
    linea_credito: '',
    deuda_actual: '0',
    pago_minimo: '0',
    moneda_nombre: '',
    moneda_simbolo: '',
    dia_inicio_ciclo: '',
    dia_cierre_ciclo: '',
    dia_pago: '',
    tasa_interes: '',
    comision_mantenimiento: '0',
    categoria_principal: '',
    notificar_dias_antes_cierre: '3',
    notificar_dias_antes_pago: '5'
  });

  const [errors, setErrors] = useState({});
  const [showBancoDropdown, setShowBancoDropdown] = useState(false);

  /* ── Load bancos ── */
  useEffect(() => {
    if (isOpen) {
      cardsApi.getBancos()
        .then(data => {
          if (data.success) {
            setBancos(data.bancos);
            setBancosFiltered(data.bancos);
          }
        })
        .catch(err => console.error('Error al cargar bancos:', err));
    }
  }, [isOpen]);

  /* ── Filter bancos ── */
  useEffect(() => {
    if (searchBanco && searchBanco !== 'Otro banco') {
      const filtered = bancos.filter(banco =>
        banco.nombre.toLowerCase().includes(searchBanco.toLowerCase())
      );
      setBancosFiltered(filtered);
    } else {
      setBancosFiltered(bancos);
    }
  }, [searchBanco, bancos]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleBancoSelect = (banco) => {
    if (banco.id === 'CUSTOM') {
      setFormData(prev => ({
        ...prev,
        banco_id: 'CUSTOM',
        banco_nombre_custom: '',
        tea_custom: '',
        tasa_interes: ''
      }));
      setSearchBanco('Otro banco');
    } else {
      setFormData(prev => ({
        ...prev,
        banco_id: banco.id,
        banco_nombre_custom: '',
        tea_custom: '',
        tasa_interes: banco.tea_promedio || ''
      }));
      setSearchBanco(banco.nombre);
    }
    setShowBancoDropdown(false);
    if (errors.banco_id) {
      setErrors(prev => ({ ...prev, banco_id: '' }));
    }
  };

  /* ── Per-step validation ── */
  const validateStep = (s) => {
    const newErrors = {};

    if (s === 1) {
      if (!formData.banco_id) {
        newErrors.banco_id = 'Selecciona un banco';
      }
      if (formData.banco_id === 'CUSTOM') {
        if (!formData.banco_nombre_custom) newErrors.banco_nombre_custom = 'Ingresa el nombre del banco';
        if (!formData.tea_custom || formData.tea_custom <= 0) newErrors.tea_custom = 'Ingresa la TEA';
      }
    }

    if (s === 2) {
      if (!formData.moneda_nombre) newErrors.moneda_nombre = 'Ingresa el nombre de la moneda';
      if (!formData.moneda_simbolo) newErrors.moneda_simbolo = 'Ingresa el símbolo';
      if (!formData.linea_credito || formData.linea_credito <= 0) newErrors.linea_credito = 'Ingresa la línea de crédito';
    }

    if (s === 3) {
      if (!formData.dia_inicio_ciclo || formData.dia_inicio_ciclo < 1 || formData.dia_inicio_ciclo > 31)
        newErrors.dia_inicio_ciclo = 'Día inválido (1-31)';
      if (!formData.dia_cierre_ciclo || formData.dia_cierre_ciclo < 1 || formData.dia_cierre_ciclo > 31)
        newErrors.dia_cierre_ciclo = 'Día inválido (1-31)';
      if (!formData.dia_pago || formData.dia_pago < 1 || formData.dia_pago > 31)
        newErrors.dia_pago = 'Día inválido (1-31)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) setStep(s => s + 1);
  };

  const handleBack = () => {
    setErrors({});
    setStep(s => s - 1);
  };

  /* ── Currency pill select ── */
  const handleMonedaPreset = (preset) => {
    setMonedaCustom(false);
    setFormData(prev => ({
      ...prev,
      moneda_nombre: preset.nombre,
      moneda_simbolo: preset.simbolo
    }));
    if (errors.moneda_nombre) setErrors(prev => ({ ...prev, moneda_nombre: '', moneda_simbolo: '' }));
  };

  const handleMonedaCustomToggle = () => {
    setMonedaCustom(true);
    setFormData(prev => ({ ...prev, moneda_nombre: '', moneda_simbolo: '' }));
  };

  /* ── Submit ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep(3)) {
      setToast({ message: 'Por favor completa todos los campos requeridos', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      const dataToSend = {
        usuario_id: userId,
        slot_numero: slotNumero,
        banco_id: formData.banco_id === 'CUSTOM' ? null : formData.banco_id,
        banco_nombre_custom: formData.banco_id === 'CUSTOM' ? formData.banco_nombre_custom : null,
        nombre_tarjeta: formData.nombre_tarjeta,
        linea_credito: parseFloat(formData.linea_credito),
        deuda_actual: parseFloat(formData.deuda_actual),
        pago_minimo: parseFloat(formData.pago_minimo),
        moneda: formData.moneda_nombre,
        simbolo_moneda: formData.moneda_simbolo,
        dia_inicio_ciclo: parseInt(formData.dia_inicio_ciclo),
        dia_cierre_ciclo: parseInt(formData.dia_cierre_ciclo),
        dia_pago: parseInt(formData.dia_pago),
        tasa_interes: formData.banco_id === 'CUSTOM'
          ? parseFloat(formData.tea_custom)
          : parseFloat(formData.tasa_interes),
        comision_mantenimiento: parseFloat(formData.comision_mantenimiento),
        categoria_principal: formData.categoria_principal,
        notificar_dias_antes_cierre: parseInt(formData.notificar_dias_antes_cierre),
        notificar_dias_antes_pago: parseInt(formData.notificar_dias_antes_pago)
      };

      const data = await cardsApi.updateCard(dataToSend);

      if (data.success) {
        setToast({ message: '¡Tarjeta agregada exitosamente!', type: 'success' });
        setTimeout(() => {
          onCardAdded();
          onClose();
          resetForm();
        }, 1500);
      } else {
        setToast({ message: data.message || 'Error al agregar tarjeta', type: 'error' });
      }
    } catch (error) {
      console.error('Error:', error);
      setToast({ message: 'Error de conexión. Inténtalo de nuevo', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      banco_id: '',
      banco_nombre_custom: '',
      tea_custom: '',
      nombre_tarjeta: '',
      linea_credito: '',
      deuda_actual: '0',
      pago_minimo: '0',
      moneda_nombre: '',
      moneda_simbolo: '',
      dia_inicio_ciclo: '',
      dia_cierre_ciclo: '',
      dia_pago: '',
      tasa_interes: '',
      comision_mantenimiento: '0',
      categoria_principal: '',
      notificar_dias_antes_cierre: '3',
      notificar_dias_antes_pago: '5'
    });
    setSearchBanco('');
    setErrors({});
    setStep(1);
    setMonedaCustom(false);
  };

  if (!isOpen) return null;

  const bancoSeleccionado = formData.banco_id === 'CUSTOM'
    ? { nombre: 'Otro banco' }
    : bancos.find(b => b.id === formData.banco_id);

  /* ── Derived values for card preview ── */
  const previewBankName = formData.banco_id === 'CUSTOM'
    ? (formData.banco_nombre_custom || 'Otro banco')
    : (bancoSeleccionado?.nombre || '');
  const previewCardName = formData.nombre_tarjeta || 'Mi Tarjeta';
  const previewSymbol = formData.moneda_simbolo || '';
  const previewAmount = formData.linea_credito
    ? `${previewSymbol} ${parseFloat(formData.linea_credito).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`
    : `${previewSymbol} ——`;
  const previewGradient = getBankGradient(previewBankName);

  /* ── Cycle preview text ── */
  const showCyclePreview =
    formData.dia_inicio_ciclo && formData.dia_cierre_ciclo && formData.dia_pago;

  return createPortal(
    <>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="acm-overlay" onClick={onClose}>
        <div className="acm-modal" onClick={(e) => e.stopPropagation()}>

          {/* ── HEADER ── */}
          <div className="acm-header">
            <div className="acm-header-left">
              <span className="acm-slot-badge">Slot {slotNumero}</span>
              <h2 className="acm-title">Agregar Tarjeta</h2>
            </div>
            <button className="acm-close" onClick={onClose} type="button" aria-label="Cerrar">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>

          {/* ── CARD PREVIEW ── */}
          <div className="acm-preview" style={{ background: previewGradient }}>
            <div className="acm-preview-chip"><ChipSVG /></div>
            <div className="acm-preview-wifi"><WifiSVG /></div>
            <div className="acm-preview-number">
              <span>••••</span><span>••••</span><span>••••</span><span>••••</span>
            </div>
            <div className="acm-preview-bottom">
              <div className="acm-preview-bank">
                <div className="acm-preview-bank-name">{previewBankName || 'Banco'}</div>
                <div className="acm-preview-card-name">{previewCardName}</div>
              </div>
              <div className="acm-preview-amount">{previewAmount}</div>
            </div>
          </div>

          {/* ── STEP INDICATOR ── */}
          <div className="acm-steps">
            {[1, 2, 3].map((n, i) => (
              <div key={n} className="acm-step-item">
                <div className={`acm-step-circle ${step === n ? 'active' : step > n ? 'done' : ''}`}>
                  {step > n ? (
                    <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
                      <path d="M1 5l3.5 3.5L11 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ) : n}
                </div>
                <span className={`acm-step-label ${step === n ? 'active' : step > n ? 'done' : ''}`}>
                  {n === 1 ? 'Tu banco' : n === 2 ? 'Financiero' : 'Ciclo'}
                </span>
                {i < 2 && <div className={`acm-step-line ${step > n ? 'done' : ''}`} />}
              </div>
            ))}
          </div>

          {/* ── FORM BODY ── */}
          <form onSubmit={handleSubmit} className="acm-body" noValidate>

            {/* ════════════════════════════
                STEP 1 — Tu banco
            ════════════════════════════ */}
            {step === 1 && (
              <>
                <div className="acm-section-label">Tu banco</div>

                {/* Banco search */}
                <div className="acm-form-group">
                  <label>Banco *</label>
                  <div className="banco-search-container">
                    <input
                      type="text"
                      className={`acm-input${errors.banco_id ? ' acm-input--error' : ''}`}
                      placeholder="Busca tu banco..."
                      value={searchBanco}
                      onChange={(e) => {
                        setSearchBanco(e.target.value);
                        setShowBancoDropdown(true);
                      }}
                      onFocus={() => setShowBancoDropdown(true)}
                      disabled={!!bancoSeleccionado}
                    />

                    {showBancoDropdown && !bancoSeleccionado && (
                      <div className="banco-dropdown">
                        {bancosFiltered.map(banco => (
                          <div
                            key={banco.id}
                            className={`banco-option${formData.banco_id === banco.id ? ' selected' : ''}`}
                            onClick={() => handleBancoSelect(banco)}
                          >
                            <div className="banco-info">
                              <span className="banco-nombre">{banco.nombre}</span>
                              <span className="banco-tea">TEA promedio: {banco.tea_promedio}%</span>
                            </div>
                          </div>
                        ))}
                        <div
                          className="banco-option banco-custom"
                          onClick={() => handleBancoSelect({ id: 'CUSTOM', nombre: 'Otro banco' })}
                        >
                          <div className="banco-info">
                            <span className="banco-nombre">🏦 Otro banco</span>
                            <span className="banco-tea">Ingresa manualmente</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {bancoSeleccionado && (
                      <div className="banco-selected">
                        <div className="banco-selected-info">
                          <span className="banco-selected-icon">✓</span>
                          <div className="banco-selected-text">
                            <span className="banco-selected-nombre">{bancoSeleccionado.nombre}</span>
                            {formData.banco_id !== 'CUSTOM' && bancoSeleccionado.tea_promedio && (
                              <span className="banco-selected-tea">TEA: {bancoSeleccionado.tea_promedio}%</span>
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          className="banco-deselect"
                          onClick={() => {
                            setFormData(prev => ({
                              ...prev,
                              banco_id: '',
                              banco_nombre_custom: '',
                              tea_custom: '',
                              tasa_interes: ''
                            }));
                            setSearchBanco('');
                          }}
                          title="Cambiar banco"
                        >×</button>
                      </div>
                    )}
                  </div>
                  {errors.banco_id && <span className="acm-error">{errors.banco_id}</span>}
                </div>

                {/* Custom bank fields */}
                {formData.banco_id === 'CUSTOM' && (
                  <div className="acm-row-2">
                    <div className="acm-form-group">
                      <label>Nombre del banco *</label>
                      <input
                        type="text"
                        name="banco_nombre_custom"
                        className={`acm-input${errors.banco_nombre_custom ? ' acm-input--error' : ''}`}
                        value={formData.banco_nombre_custom}
                        onChange={handleChange}
                        placeholder="Ej: Banco Crédito del Perú"
                      />
                      {errors.banco_nombre_custom && <span className="acm-error">{errors.banco_nombre_custom}</span>}
                    </div>
                    <div className="acm-form-group">
                      <label>TEA % *</label>
                      <input
                        type="number"
                        step="0.01"
                        name="tea_custom"
                        className={`acm-input${errors.tea_custom ? ' acm-input--error' : ''}`}
                        value={formData.tea_custom}
                        onChange={handleChange}
                        placeholder="85.00"
                      />
                      {errors.tea_custom && <span className="acm-error">{errors.tea_custom}</span>}
                    </div>
                  </div>
                )}

                {/* Nombre tarjeta */}
                <div className="acm-form-group">
                  <label>Nombre de la tarjeta</label>
                  <input
                    type="text"
                    name="nombre_tarjeta"
                    className="acm-input"
                    value={formData.nombre_tarjeta}
                    onChange={handleChange}
                    placeholder="Ej: Visa Gold"
                  />
                </div>

                {/* Categoría */}
                <div className="acm-form-group">
                  <label>Categoría principal</label>
                  <select
                    name="categoria_principal"
                    className="acm-select"
                    value={formData.categoria_principal}
                    onChange={handleChange}
                  >
                    <option value="">Selecciona...</option>
                    <option value="Compras">🛒 Compras</option>
                    <option value="Viajes">✈️ Viajes</option>
                    <option value="Gasolina">⛽ Gasolina</option>
                    <option value="Restaurantes">🍽️ Restaurantes</option>
                    <option value="Supermercado">🛍️ Supermercado</option>
                    <option value="General">📌 General</option>
                  </select>
                </div>

                <div className="acm-nav">
                  <button type="button" className="acm-btn-back" onClick={onClose}>Cancelar</button>
                  <button type="button" className="acm-btn-next" onClick={handleNext}>
                    Siguiente →
                  </button>
                </div>
              </>
            )}

            {/* ════════════════════════════
                STEP 2 — Datos financieros
            ════════════════════════════ */}
            {step === 2 && (
              <>
                <div className="acm-section-label">Datos financieros</div>

                {/* Currency pills */}
                <div className="acm-form-group">
                  <label>Moneda</label>
                  <div className="acm-currency-pills">
                    {MONEDAS_PRESET.map(p => {
                      const isSelected = !monedaCustom &&
                        formData.moneda_nombre === p.nombre &&
                        formData.moneda_simbolo === p.simbolo;
                      return (
                        <button
                          key={p.nombre}
                          type="button"
                          className={`acm-currency-pill${isSelected ? ' selected' : ''}`}
                          onClick={() => handleMonedaPreset(p)}
                        >
                          {p.simbolo} {p.nombre}
                        </button>
                      );
                    })}
                    <button
                      type="button"
                      className={`acm-currency-pill${monedaCustom ? ' selected' : ''}`}
                      onClick={handleMonedaCustomToggle}
                    >
                      + Otra
                    </button>
                  </div>
                </div>

                {/* Custom currency inputs */}
                {monedaCustom && (
                  <div className="acm-row-2">
                    <div className="acm-form-group">
                      <label>Nombre de moneda *</label>
                      <input
                        type="text"
                        name="moneda_nombre"
                        className={`acm-input${errors.moneda_nombre ? ' acm-input--error' : ''}`}
                        value={formData.moneda_nombre}
                        onChange={handleChange}
                        placeholder="Ej: Pesos, Reales"
                      />
                      {errors.moneda_nombre && <span className="acm-error">{errors.moneda_nombre}</span>}
                    </div>
                    <div className="acm-form-group">
                      <label>Símbolo *</label>
                      <input
                        type="text"
                        name="moneda_simbolo"
                        className={`acm-input${errors.moneda_simbolo ? ' acm-input--error' : ''}`}
                        value={formData.moneda_simbolo}
                        onChange={handleChange}
                        placeholder="Ej: $, R$, Bs"
                        maxLength="5"
                      />
                      {errors.moneda_simbolo && <span className="acm-error">{errors.moneda_simbolo}</span>}
                    </div>
                  </div>
                )}

                {/* Show preset currency errors only when not custom */}
                {!monedaCustom && errors.moneda_nombre && (
                  <span className="acm-error" style={{ display: 'block', marginBottom: 12 }}>
                    Selecciona una moneda
                  </span>
                )}

                {/* Línea de crédito */}
                <div className="acm-form-group">
                  <label>Línea de crédito *</label>
                  <div className="acm-input-currency-wrap">
                    <span className="acm-currency-sym">{formData.moneda_simbolo || '?'}</span>
                    <input
                      type="number"
                      name="linea_credito"
                      className={`acm-input acm-input--sym${errors.linea_credito ? ' acm-input--error' : ''}`}
                      value={formData.linea_credito}
                      onChange={handleChange}
                      placeholder="5000.00"
                      step="0.01"
                    />
                  </div>
                  {errors.linea_credito && <span className="acm-error">{errors.linea_credito}</span>}
                </div>

                {/* Deuda + Pago mínimo */}
                <div className="acm-row-2">
                  <div className="acm-form-group">
                    <label>Deuda actual</label>
                    <div className="acm-input-currency-wrap">
                      <span className="acm-currency-sym">{formData.moneda_simbolo || '?'}</span>
                      <input
                        type="number"
                        name="deuda_actual"
                        className="acm-input acm-input--sym"
                        value={formData.deuda_actual}
                        onChange={handleChange}
                        placeholder="0.00"
                        step="0.01"
                      />
                    </div>
                  </div>
                  <div className="acm-form-group">
                    <label>Pago mínimo</label>
                    <div className="acm-input-currency-wrap">
                      <span className="acm-currency-sym">{formData.moneda_simbolo || '?'}</span>
                      <input
                        type="number"
                        name="pago_minimo"
                        className="acm-input acm-input--sym"
                        value={formData.pago_minimo}
                        onChange={handleChange}
                        placeholder="0.00"
                        step="0.01"
                      />
                    </div>
                  </div>
                </div>

                <div className="acm-nav">
                  <button type="button" className="acm-btn-back" onClick={handleBack}>← Anterior</button>
                  <button type="button" className="acm-btn-next" onClick={handleNext}>
                    Siguiente →
                  </button>
                </div>
              </>
            )}

            {/* ════════════════════════════
                STEP 3 — Ciclo de pago
            ════════════════════════════ */}
            {step === 3 && (
              <>
                <div className="acm-section-label">Ciclo de pago</div>

                <div className="acm-row-3">
                  <div className="acm-form-group">
                    <label>Día inicio *</label>
                    <input
                      type="number"
                      name="dia_inicio_ciclo"
                      className={`acm-input${errors.dia_inicio_ciclo ? ' acm-input--error' : ''}`}
                      value={formData.dia_inicio_ciclo}
                      onChange={handleChange}
                      placeholder="26"
                      min="1"
                      max="31"
                    />
                    {errors.dia_inicio_ciclo && <span className="acm-error">{errors.dia_inicio_ciclo}</span>}
                  </div>

                  <div className="acm-form-group">
                    <label>Día cierre *</label>
                    <input
                      type="number"
                      name="dia_cierre_ciclo"
                      className={`acm-input${errors.dia_cierre_ciclo ? ' acm-input--error' : ''}`}
                      value={formData.dia_cierre_ciclo}
                      onChange={handleChange}
                      placeholder="25"
                      min="1"
                      max="31"
                    />
                    {errors.dia_cierre_ciclo && <span className="acm-error">{errors.dia_cierre_ciclo}</span>}
                  </div>

                  <div className="acm-form-group">
                    <label>Día pago *</label>
                    <input
                      type="number"
                      name="dia_pago"
                      className={`acm-input${errors.dia_pago ? ' acm-input--error' : ''}`}
                      value={formData.dia_pago}
                      onChange={handleChange}
                      placeholder="20"
                      min="1"
                      max="31"
                    />
                    {errors.dia_pago && <span className="acm-error">{errors.dia_pago}</span>}
                  </div>
                </div>

                {showCyclePreview && (
                  <div className="acm-cycle-preview">
                    <div className="acm-cycle-preview-row">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                      <span>
                        Ciclo del <strong>día {formData.dia_inicio_ciclo}</strong> al{' '}
                        <strong>día {formData.dia_cierre_ciclo}</strong> de cada mes
                      </span>
                    </div>
                    <div className="acm-cycle-preview-row">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                      <span>
                        Fecha de pago: <strong>día {formData.dia_pago}</strong> del mes siguiente
                      </span>
                    </div>
                  </div>
                )}

                <div className="acm-nav">
                  <button type="button" className="acm-btn-back" onClick={handleBack}>← Anterior</button>
                  <button
                    type="submit"
                    className="acm-btn-submit"
                    disabled={loading}
                  >
                    {loading ? 'Guardando...' : '✓ Agregar tarjeta'}
                  </button>
                </div>
              </>
            )}

          </form>
        </div>
      </div>
    </>,
    document.body
  );
}

export default AddCardModal;
