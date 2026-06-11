import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import './CompararBancosModal.css';

const OBJETIVOS = [
  { id: 'todos', label: 'Todos', icon: '🏦' },
  { id: 'primera', label: 'Primera tarjeta', icon: '🌱' },
  { id: 'bajo_costo', label: 'Menor TEA', icon: '💰' },
  { id: 'premium', label: 'Premium', icon: '💎' },
];

const OBJETIVO_CONFIG = {
  primera: {
    descripcion: 'Para quienes recién empiezan, lo más importante es la TEA más baja posible.',
    filtro: (b) => b.tea_promedio <= 80,
  },
  bajo_costo: {
    descripcion: 'Ordenados de menor a mayor TEA. Menos intereses = más ahorro.',
    filtro: () => true,
    orden: 'asc',
  },
  premium: {
    descripcion: 'Tarjetas con beneficios adicionales como millas, seguros y cashback.',
    filtro: (b) => ['Diners Club', 'BBVA', 'Scotiabank', 'Interbank'].includes(b.nombre),
  },
  todos: {
    filtro: () => true,
  },
};

const getTEAColor = (tea) => {
  if (tea <= 60) return 'green';
  if (tea <= 80) return 'yellow';
  return 'red';
};

const getTEALabel = (tea) => {
  if (tea <= 60) return 'Baja';
  if (tea <= 80) return 'Media';
  return 'Alta';
};

// Cuánto pagarías de interés en 1 mes con S/1000
const calcularInteresMensual = (tea, monto = 1000) => {
  const tasaMensual = Math.pow(1 + tea / 100, 1 / 12) - 1;
  return (monto * tasaMensual).toFixed(2);
};

function CompararBancosModal({ onClose }) {
  const [bancos, setBancos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [objetivo, setObjetivo] = useState('todos');
  const [ordenAsc, setOrdenAsc] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [bancoDetalle, setBancoDetalle] = useState(null);

  useEffect(() => {
    cargarBancos();
  }, []);

  const cargarBancos = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/cards/bancos`);
      const data = await res.json();
      if (data.success) {
        setBancos(data.bancos);
      }
    } catch (error) {
      console.error('Error al cargar bancos:', error);
    } finally {
      setLoading(false);
    }
  };

  const bancosFiltrados = bancos
    .filter(b => {
      const config = OBJETIVO_CONFIG[objetivo];
      const pasaObjetivo = config.filtro(b);
      const pasaBusqueda = b.nombre.toLowerCase().includes(busqueda.toLowerCase());
      return pasaObjetivo && pasaBusqueda;
    })
    .sort((a, b) => ordenAsc
      ? a.tea_promedio - b.tea_promedio
      : b.tea_promedio - a.tea_promedio
    );

  const mejorBanco = [...bancos].sort((a, b) => a.tea_promedio - b.tea_promedio)[0];

  return createPortal(
    <div className="comp-overlay" onClick={onClose}>
      <div className="comp-modal" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="comp-header">
          <div className="comp-header-left">
            <span className="comp-header-icon">⚖️</span>
            <div>
              <h2>Comparar Bancos</h2>
              <span className="comp-header-sub">TEAs actuales del mercado peruano</span>
            </div>
          </div>
          <button className="comp-close" onClick={onClose}>×</button>
        </div>

        {/* Contenido scrollable */}
        <div className="comp-content">

          {loading ? (
            <div className="comp-loading">
              <div className="comp-spinner"></div>
              <p>Cargando bancos...</p>
            </div>
          ) : (
            <>
              {/* Mejor opción destacada */}
              {mejorBanco && (
                <div className="comp-best-card">
                  <div className="comp-best-left">
                    <span className="comp-best-crown">👑</span>
                    <div>
                      <span className="comp-best-label">Menor TEA disponible</span>
                      <h3>{mejorBanco.nombre}</h3>
                    </div>
                  </div>
                  <div className="comp-best-right">
                    <span className="comp-best-tea">{mejorBanco.tea_promedio}%</span>
                    <span className="comp-best-tea-label">TEA anual</span>
                  </div>
                </div>
              )}

              {/* Filtros por objetivo */}
              <div className="comp-objetivos">
                <span className="comp-objetivos-label">Filtrar por objetivo:</span>
                <div className="comp-objetivos-list">
                  {OBJETIVOS.map(obj => (
                    <button
                      key={obj.id}
                      className={`comp-objetivo-btn ${objetivo === obj.id ? 'active' : ''}`}
                      onClick={() => setObjetivo(obj.id)}
                    >
                      <span>{obj.icon}</span>
                      <span>{obj.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Descripción del objetivo */}
              {OBJETIVO_CONFIG[objetivo]?.descripcion && (
                <div className="comp-objetivo-desc">
                  <span>💡</span>
                  <p>{OBJETIVO_CONFIG[objetivo].descripcion}</p>
                </div>
              )}

              {/* Buscador + orden */}
              <div className="comp-toolbar">
                <input
                  type="text"
                  className="comp-search"
                  placeholder="🔍 Buscar banco..."
                  value={busqueda}
                  onChange={e => setBusqueda(e.target.value)}
                />
                <button
                  className="comp-sort-btn"
                  onClick={() => setOrdenAsc(!ordenAsc)}
                  title="Cambiar orden"
                >
                  {ordenAsc ? '↑ Menor TEA' : '↓ Mayor TEA'}
                </button>
              </div>

              {/* Tabla de bancos */}
              <div className="comp-table">
                <div className="comp-table-header">
                  <span>Banco</span>
                  <span>TEA anual</span>
                  <span>Interés / S/ 1,000</span>
                  <span>Nivel</span>
                </div>

                {bancosFiltrados.length === 0 ? (
                  <div className="comp-empty">
                    <span>🔍</span>
                    <p>No se encontraron bancos con ese filtro</p>
                  </div>
                ) : (
                  bancosFiltrados.map((banco, i) => {
                    const color = getTEAColor(banco.tea_promedio);
                    const esMejor = banco.id === mejorBanco?.id;
                    return (
                      <div
                        key={banco.id}
                        className={`comp-table-row ${esMejor ? 'best' : ''} ${bancoDetalle?.id === banco.id ? 'expanded' : ''}`}
                        onClick={() => setBancoDetalle(bancoDetalle?.id === banco.id ? null : banco)}
                      >
                        <div className="comp-row-banco">
                          <span className="comp-row-rank">#{i + 1}</span>
                          <div>
                            <span className="comp-row-nombre">{banco.nombre}</span>
                            {esMejor && <span className="comp-row-mejor">Mejor opción</span>}
                          </div>
                        </div>

                        <span className={`comp-row-tea ${color}`}>
                          {banco.tea_promedio}%
                        </span>

                        <span className="comp-row-interes">
                          S/ {calcularInteresMensual(banco.tea_promedio)}/mes
                        </span>

                        <span className={`comp-row-nivel ${color}`}>
                          {getTEALabel(banco.tea_promedio)}
                        </span>

                        {/* Detalle expandible */}
                        {bancoDetalle?.id === banco.id && (
                          <div className="comp-row-detail" onClick={e => e.stopPropagation()}>
                            <div className="comp-detail-grid">
                              <div className="comp-detail-item">
                                <span>📅 Interés mensual</span>
                                <strong>S/ {calcularInteresMensual(banco.tea_promedio)} por cada S/ 1,000</strong>
                              </div>
                              <div className="comp-detail-item">
                                <span>📈 TEA anual</span>
                                <strong>{banco.tea_promedio}%</strong>
                              </div>
                              <div className="comp-detail-item">
                                <span>💸 Si debes S/ 5,000 un mes</span>
                                <strong className="danger">S/ {calcularInteresMensual(banco.tea_promedio, 5000)} en intereses</strong>
                              </div>
                              <div className="comp-detail-item">
                                <span>🏆 Ranking</span>
                                <strong>#{i + 1} de {bancos.length} bancos</strong>
                              </div>
                            </div>
                            <div className="comp-detail-tip">
                              <span>💡</span>
                              {banco.tea_promedio <= 60 && <p>Excelente opción. TEA muy competitiva para el mercado peruano.</p>}
                              {banco.tea_promedio > 60 && banco.tea_promedio <= 80 && <p>TEA promedio del mercado. Considera pagar siempre el total para no generar intereses.</p>}
                              {banco.tea_promedio > 80 && <p>TEA alta. Si la usas, paga el total cada mes para evitar intereses elevados.</p>}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Guía educativa al final */}
              <div className="comp-edu-section">
                <h4>¿Cómo elegir la mejor tarjeta?</h4>
                <div className="comp-edu-cards">
                  <div className="comp-edu-card">
                    <span>🌱</span>
                    <div>
                      <strong>Primera tarjeta</strong>
                      <p>Busca la menor TEA y sin membresía anual. Prioriza aprender a usarla bien.</p>
                    </div>
                  </div>
                  <div className="comp-edu-card">
                    <span>💳</span>
                    <div>
                      <strong>Si pagas el total</strong>
                      <p>La TEA no importa tanto. Enfócate en los beneficios: millas, cashback, descuentos.</p>
                    </div>
                  </div>
                  <div className="comp-edu-card">
                    <span>⚠️</span>
                    <div>
                      <strong>Si no puedes pagar el total</strong>
                      <p>La TEA es lo más importante. Una TEA menor puede ahorrarte cientos de soles al año.</p>
                    </div>
                  </div>
                </div>
              </div>

            </>
          )}

        </div>

        {/* Footer */}
        <div className="comp-footer">
          <p className="comp-footer-note">
            * TEAs referenciales. Pueden variar según perfil crediticio y producto específico.
          </p>
          <button className="comp-btn-close" onClick={onClose}>
            Entendido ✓
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
}

export default CompararBancosModal;