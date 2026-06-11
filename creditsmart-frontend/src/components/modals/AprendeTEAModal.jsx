import { useState } from 'react';
import { createPortal } from 'react-dom';
import './AprendeTEAModal.css';

const TABS = [
  { id: 'tea', label: 'TEA', icon: '📌' },
  { id: 'tcea', label: 'TEA vs TCEA', icon: '⚖️' },  
  { id: 'intereses', label: 'Intereses', icon: '💸' },
  { id: 'pagos', label: 'Tipos de pago', icon: '💳' },
  { id: 'reglas', label: 'Reglas de oro', icon: '🏆' },
];

// Simulador simple de deuda
const simularDeuda = (deuda, teaAnual, mesesMax = 36) => {
  const tasaMensual = Math.pow(1 + teaAnual / 100, 1 / 12) - 1;
  const pagoMinimo = deuda * tasaMensual + deuda * 0.05;
  const pagoTotal = deuda;

  let saldoMinimo = deuda;
  let interesesMinimo = 0;
  let meses = 0;

  while (saldoMinimo > 0.01 && meses < mesesMax) {
    const interes = saldoMinimo * tasaMensual;
    const capital = Math.min(pagoMinimo - interes, saldoMinimo);
    saldoMinimo -= capital;
    interesesMinimo += interes;
    meses++;
  }

  return {
    tasaMensual: (tasaMensual * 100).toFixed(2),
    pagoMinimo: pagoMinimo.toFixed(2),
    mesesMinimo: meses,
    interesesMinimo: interesesMinimo.toFixed(2),
    totalMinimo: (deuda + interesesMinimo).toFixed(2),
    interesesTotal: 0,
    totalTotal: pagoTotal.toFixed(2),
  };
};

function AprendeTEAModal({ onClose }) {
  const [tab, setTab] = useState('tea');
  const [teaEjemplo, setTeaEjemplo] = useState(85);
  const [deudaEjemplo, setDeudaEjemplo] = useState(1000);

  const sim = simularDeuda(deudaEjemplo, teaEjemplo);

  return createPortal(
    <div className="tea-overlay" onClick={onClose}>
      <div className="tea-modal" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="tea-header">
          <div className="tea-header-left">
            <span className="tea-header-icon">🎓</span>
            <div>
              <h2>Educación Financiera</h2>
              <span className="tea-header-sub">Aprende a manejar tu dinero</span>
            </div>
          </div>
          <button className="tea-close" onClick={onClose}>×</button>
        </div>

        {/* Tabs */}
        <div className="tea-tabs">
          {TABS.map(t => (
            <button
              key={t.id}
              className={`tea-tab ${tab === t.id ? 'active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              <span className="tea-tab-icon">{t.icon}</span>
              <span className="tea-tab-label">{t.label}</span>
            </button>
          ))}
        </div>

        {/* Contenido */}
        <div className="tea-content">

          {/* ===== TAB: QUÉ ES LA TEA ===== */}
          {tab === 'tea' && (
            <div className="tea-section">

              <div className="tea-hero-card">
                <div className="tea-hero-icon">📌</div>
                <h3>TEA = Tasa Efectiva Anual</h3>
                <p>Es el costo <strong>real</strong> de tu deuda en un año completo. Incluye todos los intereses que pagarás.</p>
              </div>

              {/* Analogía simple */}
              <div className="tea-analogy">
                <span className="tea-analogy-icon">💡</span>
                <div>
                  <strong>Piénsalo así:</strong>
                  <p>Si pides prestado <strong>S/ 1,000</strong> con una TEA de <strong>85%</strong>, al cabo de un año habrás pagado <strong>S/ 850 solo en intereses</strong> si nunca abonaste nada.</p>
                </div>
              </div>

              {/* Simulador interactivo */}
              <div className="tea-simulator">
                <h4>🧮 Simula con tu TEA</h4>

                <div className="tea-sim-inputs">
                  <div className="tea-sim-group">
                    <label>TEA anual (%)</label>
                    <div className="tea-sim-slider-wrap">
                      <input
                        type="range"
                        min="20"
                        max="150"
                        value={teaEjemplo}
                        onChange={e => setTeaEjemplo(Number(e.target.value))}
                        className="tea-slider"
                      />
                      <span className="tea-slider-value">{teaEjemplo}%</span>
                    </div>
                  </div>

                  <div className="tea-sim-group">
                    <label>Deuda (S/)</label>
                    <div className="tea-sim-slider-wrap">
                      <input
                        type="range"
                        min="100"
                        max="10000"
                        step="100"
                        value={deudaEjemplo}
                        onChange={e => setDeudaEjemplo(Number(e.target.value))}
                        className="tea-slider"
                      />
                      <span className="tea-slider-value">S/ {deudaEjemplo.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="tea-sim-results">
                  <div className="tea-sim-result-item">
                    <span className="tea-sim-label">Tasa mensual equivalente</span>
                    <span className="tea-sim-value gold">{sim.tasaMensual}%</span>
                  </div>
                  <div className="tea-sim-result-item">
                    <span className="tea-sim-label">Interés solo este mes</span>
                    <span className="tea-sim-value warn">
                      S/ {(deudaEjemplo * Math.pow(1 + teaEjemplo / 100, 1 / 12) - deudaEjemplo).toFixed(2)}
                    </span>
                  </div>
                  <div className="tea-sim-result-item">
                    <span className="tea-sim-label">Si pagas solo el mínimo ({sim.mesesMinimo} meses)</span>
                    <span className="tea-sim-value danger">S/ {sim.interesesMinimo} en intereses</span>
                  </div>
                </div>
              </div>

              {/* TEAs del mercado */}
              <div className="tea-market">
                <h4>📊 TEAs típicas en Perú</h4>
                <div className="tea-market-list">
                  {[
                    { tipo: 'Tarjetas de tiendas', tea: '62% - 82%', color: 'green' },
                    { tipo: 'Tarjetas de bancos', tea: '75% - 95%', color: 'yellow' },
                    { tipo: 'Tarjetas premium', tea: '45% - 65%', color: 'green' },
                    { tipo: 'Financieras', tea: '90% - 150%', color: 'red' },
                  ].map((item, i) => (
                    <div key={i} className={`tea-market-item ${item.color}`}>
                      <span className="tea-market-tipo">{item.tipo}</span>
                      <span className={`tea-market-tea ${item.color}`}>{item.tea}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}
          {/* ===== TAB: TEA vs TCEA ===== */}
    {tab === 'tcea' && (
      <div className="tea-section">

        <div className="tea-hero-card">
          <div className="tea-hero-icon">⚖️</div>
          <h3>TEA vs TCEA</h3>
          <p>Son parecidas pero <strong>no son lo mismo</strong>. Entender la diferencia te ayuda a calcular el costo real de tu tarjeta.</p>
       </div>

        {/* Definiciones */}
        <div className="tcea-definitions">
          <div className="tcea-def-card tea-side">
            <div className="tcea-def-header">
              <span className="tcea-def-badge tea">TEA</span>
              <h4>Tasa Efectiva Anual</h4>
        </div>
        <p>Solo mide el costo de los <strong>intereses</strong> sobre tu deuda. No incluye otros cobros.</p>
        <div className="tcea-def-includes">
          <div className="tcea-include yes">✅ Intereses</div>
          <div className="tcea-include no">❌ Comisiones</div>
          <div className="tcea-include no">❌ Seguros</div>
          <div className="tcea-include no">❌ Membresía</div>
        </div>
      </div>

      <div className="tcea-def-card tcea-side">
        <div className="tcea-def-header">
          <span className="tcea-def-badge tcea">TCEA</span>
          <h4>Tasa de Costo Efectivo Anual</h4>
        </div>
        <p>Mide el costo <strong>total real</strong> de tu deuda. Incluye todo lo que pagas al banco.</p>
        <div className="tcea-def-includes">
          <div className="tcea-include yes">✅ Intereses</div>
          <div className="tcea-include yes">✅ Comisiones</div>
          <div className="tcea-include yes">✅ Seguros</div>
          <div className="tcea-include yes">✅ Membresía anual</div>
        </div>
      </div>
    </div>

        {/* Ejemplo visual */}
        <div className="tcea-example">
          <h4>📊 Ejemplo real</h4>
          <p className="tcea-example-sub">Tarjeta con TEA 85% — deuda S/ 1,000</p>

          <div className="tcea-breakdown">
            <div className="tcea-breakdown-item">
              <span className="tcea-breakdown-label">Intereses (TEA 85%)</span>
          <div className="tcea-breakdown-bar-wrap">
            <div className="tcea-breakdown-bar tea" style={{ width: '70%' }}></div>
          </div>
          <span className="tcea-breakdown-value">S/ 68/mes</span>
        </div>
        <div className="tcea-breakdown-item">
          <span className="tcea-breakdown-label">Seguro desgravamen</span>
          <div className="tcea-breakdown-bar-wrap">
            <div className="tcea-breakdown-bar seguro" style={{ width: '15%' }}></div>
          </div>
          <span className="tcea-breakdown-value">~ S/ 5/mes</span>
        </div>
        <div className="tcea-breakdown-item">
          <span className="tcea-breakdown-label">Membresía anual</span>
          <div className="tcea-breakdown-bar-wrap">
            <div className="tcea-breakdown-bar membresia" style={{ width: '10%' }}></div>
              </div>
              <span className="tcea-breakdown-value">~ S/ 8/mes</span>
            </div>
            <div className="tcea-breakdown-total">
              <span>Costo real total (TCEA)</span>
              <span className="tcea-total-value">~ S/ 81/mes</span>
            </div>
          </div>
        </div>

        {/* Regla legal */}
        <div className="tcea-legal">
          <span>⚖️</span>
          <div>
            <strong>Por ley en Perú</strong>
            <p>La SBS obliga a todos los bancos a informarte la TCEA antes de que contrates una tarjeta. Si solo te muestran la TEA, tienes derecho a pedir la TCEA completa.</p>
          </div>
        </div>

          {/* Consejo práctico */}
           <div className="tcea-tip">
           <span>🎯</span>
              <div>
                <strong>¿Cuál usar para comparar?</strong>
              <p>Siempre compara con la <strong>TCEA</strong>. Dos tarjetas con la misma TEA pueden tener TCEA muy diferentes por las comisiones y seguros.</p>
             </div>
           </div>

         </div>
          )}

          {/* ===== TAB: INTERESES ===== */}
          {tab === 'intereses' && (
            <div className="tea-section">

              <div className="tea-hero-card warning">
                <div className="tea-hero-icon">💸</div>
                <h3>¿Cómo crece tu deuda?</h3>
                <p>Los intereses se calculan <strong>sobre tu saldo pendiente</strong> cada mes. Mientras más demores en pagar, más pagas.</p>
              </div>

              {/* Ejemplo visual mes a mes */}
              <div className="tea-monthly-example">
                <h4>📅 Ejemplo: S/ 1,000 con TEA 85%</h4>
                <p className="tea-example-sub">Pagando solo el mínimo cada mes</p>

                <div className="tea-months-list">
                  {[1, 3, 6, 12].map(mes => {
                    const tasaMes = Math.pow(1 + 85 / 100, 1 / 12) - 1;
                    const pago = 1000 * tasaMes + 1000 * 0.05;
                    let saldo = 1000;
                    let interesesAcum = 0;
                    for (let i = 0; i < mes; i++) {
                      const interes = saldo * tasaMes;
                      const capital = Math.min(pago - interes, saldo);
                      saldo -= capital;
                      interesesAcum += interes;
                    }
                    return (
                      <div key={mes} className="tea-month-row">
                        <div className="tea-month-label">
                          <span className="tea-month-num">Mes {mes}</span>
                        </div>
                        <div className="tea-month-bar-wrap">
                          <div
                            className="tea-month-bar"
                            style={{ width: `${Math.min((saldo / 1000) * 100, 100)}%` }}
                          ></div>
                        </div>
                        <div className="tea-month-data">
                          <span className="tea-month-saldo">S/ {Math.max(saldo, 0).toFixed(0)} restante</span>
                          <span className="tea-month-interest danger">+S/ {interesesAcum.toFixed(0)} intereses</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Comparación dramática */}
              <div className="tea-comparison-dramatic">
                <h4>⚖️ La diferencia importa</h4>
                <div className="tea-compare-cards">
                  <div className="tea-compare-card bad">
                    <div className="tea-compare-header">
                      <span>😰</span>
                      <strong>Solo el mínimo</strong>
                    </div>
                    <div className="tea-compare-stat">
                      <span>Tiempo</span>
                      <strong>{sim.mesesMinimo} meses</strong>
                    </div>
                    <div className="tea-compare-stat">
                      <span>Intereses pagados</span>
                      <strong className="danger">S/ {sim.interesesMinimo}</strong>
                    </div>
                    <div className="tea-compare-stat total">
                      <span>Total pagado</span>
                      <strong>S/ {sim.totalMinimo}</strong>
                    </div>
                  </div>

                  <div className="tea-compare-vs">VS</div>

                  <div className="tea-compare-card good">
                    <div className="tea-compare-header">
                      <span>😎</span>
                      <strong>Pago total</strong>
                    </div>
                    <div className="tea-compare-stat">
                      <span>Tiempo</span>
                      <strong>1 mes</strong>
                    </div>
                    <div className="tea-compare-stat">
                      <span>Intereses pagados</span>
                      <strong className="good">S/ 0.00</strong>
                    </div>
                    <div className="tea-compare-stat total">
                      <span>Total pagado</span>
                      <strong>S/ {deudaEjemplo.toLocaleString()}</strong>
                    </div>
                  </div>
                </div>

                <div className="tea-saving-badge">
                  💰 Pagarías S/ {sim.interesesMinimo} menos pagando el total
                </div>
              </div>

              {/* Cómo funciona el interés compuesto */}
              <div className="tea-compound-explainer">
                <span>🔄</span>
                <div>
                  <strong>Interés sobre interés</strong>
                  <p>Si no pagas los intereses del mes, se suman a tu deuda y el siguiente mes pagas intereses sobre una deuda más grande. Esto se llama <strong>interés compuesto</strong> y es lo que hace que las deudas crezcan rápido.</p>
                </div>
              </div>

            </div>
          )}

          {/* ===== TAB: TIPOS DE PAGO ===== */}
          {tab === 'pagos' && (
            <div className="tea-section">

              <div className="tea-hero-card">
                <div className="tea-hero-icon">💳</div>
                <h3>¿Cuánto debo pagar?</h3>
                <p>La decisión de cuánto pagar cada mes tiene un <strong>impacto enorme</strong> en lo que terminas pagando.</p>
              </div>

              {/* Los 3 tipos */}
              <div className="tea-payment-types">

                <div className="tea-payment-type best">
                  <div className="tea-payment-top">
                    <span className="tea-payment-emoji">🏆</span>
                    <div>
                      <div className="tea-payment-title-row">
                        <h4>Pago Total</h4>
                        <span className="tea-payment-badge best">Ideal</span>
                      </div>
                      <p>Pagas todo lo que debes antes del vencimiento</p>
                    </div>
                  </div>
                  <div className="tea-payment-benefits">
                    <div className="tea-benefit">✅ Cero intereses</div>
                    <div className="tea-benefit">✅ Mejora tu score más rápido</div>
                    <div className="tea-benefit">✅ Sin deudas acumuladas</div>
                  </div>
                  <div className="tea-payment-tip">
                    Usa tu tarjeta como método de pago, no como préstamo.
                  </div>
                </div>

                <div className="tea-payment-type ok">
                  <div className="tea-payment-top">
                    <span className="tea-payment-emoji">⚖️</span>
                    <div>
                      <div className="tea-payment-title-row">
                        <h4>Pago Parcial</h4>
                        <span className="tea-payment-badge ok">Aceptable</span>
                      </div>
                      <p>Pagas más del mínimo pero no el total</p>
                    </div>
                  </div>
                  <div className="tea-payment-benefits">
                    <div className="tea-benefit">✅ Reduce tu deuda gradualmente</div>
                    <div className="tea-benefit">⚠️ Genera intereses, pero menos</div>
                    <div className="tea-benefit">✅ Mejor que solo el mínimo</div>
                  </div>
                  <div className="tea-payment-tip">
                    Paga siempre lo más que puedas, no lo mínimo posible.
                  </div>
                </div>

                <div className="tea-payment-type bad">
                  <div className="tea-payment-top">
                    <span className="tea-payment-emoji">⚠️</span>
                    <div>
                      <div className="tea-payment-title-row">
                        <h4>Pago Mínimo</h4>
                        <span className="tea-payment-badge bad">Solo emergencias</span>
                      </div>
                      <p>La cantidad mínima para no entrar en mora</p>
                    </div>
                  </div>
                  <div className="tea-payment-benefits">
                    <div className="tea-benefit">✅ Evita cargos por mora</div>
                    <div className="tea-benefit">❌ Genera altos intereses</div>
                    <div className="tea-benefit">❌ La deuda tarda mucho en bajar</div>
                  </div>
                  <div className="tea-payment-tip">
                    El mínimo es una medida de emergencia, no una estrategia habitual.
                  </div>
                </div>

              </div>

              {/* Cómo se calcula el mínimo */}
              <div className="tea-minimum-explainer">
                <h4>🧮 ¿Cómo se calcula el pago mínimo?</h4>
                <div className="tea-formula">
                  <div className="tea-formula-item">
                    <span className="tea-formula-icon">➕</span>
                    <div>
                      <strong>Intereses del mes</strong>
                      <p>Lo que cobró el banco por prestarte el dinero</p>
                    </div>
                  </div>
                  <div className="tea-formula-item">
                    <span className="tea-formula-icon">➕</span>
                    <div>
                      <strong>5% de tu deuda principal</strong>
                      <p>La mínima parte del capital que debes amortizar</p>
                    </div>
                  </div>
                  <div className="tea-formula-item">
                    <span className="tea-formula-icon">➕</span>
                    <div>
                      <strong>Comisiones y seguros</strong>
                      <p>Si aplican según tu tarjeta</p>
                    </div>
                  </div>
                  <div className="tea-formula-result">
                    <span>=</span>
                    <strong>Pago Mínimo</strong>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* ===== TAB: REGLAS DE ORO ===== */}
          {tab === 'reglas' && (
            <div className="tea-section">

              <div className="tea-hero-card gold">
                <div className="tea-hero-icon">🏆</div>
                <h3>Reglas de Oro</h3>
                <p>Sigue estas reglas y tendrás un manejo financiero <strong>saludable y sostenible</strong>.</p>
              </div>

              <div className="tea-rules-list">

                <div className="tea-rule">
                  <div className="tea-rule-number">01</div>
                  <div className="tea-rule-content">
                    <h4>No uses más del 30% de tu línea</h4>
                    <p>Si tu línea es S/ 5,000, mantén tu deuda bajo S/ 1,500. Esto cuida tu historial crediticio.</p>
                    <div className="tea-rule-example">
                      <div className="tea-rule-bar-wrap">
                        <div className="tea-rule-bar" style={{ width: '30%' }}>
                          <span>30% → Ideal</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="tea-rule">
                  <div className="tea-rule-number">02</div>
                  <div className="tea-rule-content">
                    <h4>No destines más del 15% de tu ingreso a tarjetas</h4>
                    <p>Si ganas S/ 3,000 al mes, tus pagos de tarjeta no deben superar S/ 450 mensuales.</p>
                    <div className="tea-rule-example">
                      <div className="tea-rule-example-calc">
                        <span>Ingreso mensual × 15% = Límite de pagos</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="tea-rule">
                  <div className="tea-rule-number">03</div>
                  <div className="tea-rule-content">
                    <h4>Paga siempre antes del cierre del ciclo</h4>
                    <p>Pagar antes del cierre reduce el saldo que el banco reporta a las centrales de riesgo, mejorando tu score.</p>
                  </div>
                </div>

                <div className="tea-rule">
                  <div className="tea-rule-number">04</div>
                  <div className="tea-rule-content">
                    <h4>Nunca pagues solo el mínimo de forma habitual</h4>
                    <p>Pagar solo el mínimo puede triplicar el tiempo que tardas en saldar tu deuda.</p>
                  </div>
                </div>

                <div className="tea-rule">
                  <div className="tea-rule-number">05</div>
                  <div className="tea-rule-content">
                    <h4>Elige la tarjeta según tu objetivo</h4>
                    <div className="tea-card-types">
                      <div className="tea-card-type">
                        <span>✈️</span>
                        <div>
                          <strong>Viajes</strong>
                          <p>Tarjetas con millas o puntos canjeables</p>
                        </div>
                      </div>
                      <div className="tea-card-type">
                        <span>💰</span>
                        <div>
                          <strong>Cashback</strong>
                          <p>Te devuelven % de tus compras en efectivo</p>
                        </div>
                      </div>
                      <div className="tea-card-type">
                        <span>🛒</span>
                        <div>
                          <strong>Primera tarjeta</strong>
                          <p>Busca la de menor TEA y sin membresía</p>
                        </div>
                      </div>
                      <div className="tea-card-type">
                        <span>🏥</span>
                        <div>
                          <strong>Seguros</strong>
                          <p>Incluyen seguro de vida o accidentes</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Resumen final */}
              <div className="tea-summary-box">
                <h4>📋 Resumen rápido</h4>
                <ul className="tea-summary-list">
                  <li><span>💳</span> Usa máximo el 30% de tu línea</li>
                  <li><span>💵</span> Destina máximo el 15% de tu ingreso</li>
                  <li><span>📅</span> Paga antes del cierre del ciclo</li>
                  <li><span>🚫</span> Nunca uses el mínimo como hábito</li>
                  <li><span>🎯</span> Elige tu tarjeta según tu objetivo</li>
                </ul>
              </div>

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="tea-footer">
          <button className="tea-btn-close" onClick={onClose}>
            Entendido ✓
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
}

export default AprendeTEAModal;