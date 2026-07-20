import { useState, useEffect } from 'react';
import { useAuth } from '@/modules/auth/context/AuthContext';
import { cardsApi } from '@/modules/cards/services/cardsApi';
import Sidebar from '@/shared/components/Sidebar';
/* El armazón (.dashboard-dark/-layout/-main/-header y los tokens :root) vive
   en Dashboard.css aunque lo usen seis páginas. Sin este import, al entrar
   directo aquí la página carga sin estructura.
   TODO: extraer ese armazón a shared/styles/app-shell.css. */
import '@/modules/cards/pages/Dashboard.css';
import './Comparador.css';

/*
  Fuente y vigencia de las TEAs mostradas.
  ⚠️ IMPORTANTE: actualiza TEA_ACTUALIZADO cada vez que refresques las tasas.
  Publicar cifras atribuidas a bancos sin fuente ni fecha es el punto débil
  frente a la normativa de publicidad comparativa (INDECOPI).
*/
const TEA_FUENTE = 'SBS · Superintendencia de Banca, Seguros y AFP';
const TEA_ACTUALIZADO = 'julio 2026';

/*
  Criterios para comparar. La sección enseña a decidir, no recomienda un banco:
  destacar "el mejor" sería una recomendación (y además impreciso: la TEA más
  baja no es la mejor tarjeta para todos).
*/
const CRITERIOS = [
  {
    n: '01',
    titulo: 'La TEA',
    texto: 'Es el costo del crédito cuando no pagas el total del mes. La que ves aquí es un promedio del banco — la tuya depende de tu perfil y del producto.',
  },
  {
    n: '02',
    titulo: 'Membresía y comisiones',
    texto: 'Muchas tarjetas cobran cuota anual o mantenimiento, y algunas la eximen si superas un consumo mínimo. Súmalo al costo real.',
  },
  {
    n: '03',
    titulo: 'Beneficios que sí uses',
    texto: 'Millas, cashback o descuentos solo valen si encajan con tus gastos reales. Un beneficio que no usas no compensa una tasa más alta.',
  },
  {
    n: '04',
    titulo: 'Requisitos y tu perfil',
    texto: 'Ingreso mínimo, historial y línea aprobada. La tarjeta que te sirve es la que te aprueban y puedes pagar a tiempo.',
  },
];

const OBJETIVOS = [
  { id: 'todos',     label: 'Todos' },
  { id: 'primera',   label: 'Primera tarjeta' },
  { id: 'bajo_costo',label: 'Menor TEA' },
  { id: 'premium',   label: 'Premium' },
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

function Comparador() {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
      const data = await cardsApi.getBancos();
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

  // Rango del mercado: se muestra como referencia, no como recomendación.
  const teas = bancos.map(b => parseFloat(b.tea_promedio)).filter(n => !isNaN(n));
  const rangoTEA = teas.length
    ? { min: Math.min(...teas).toFixed(2), max: Math.max(...teas).toFixed(2) }
    : null;

  if (!user) return <div className="loading-screen"><div className="spinner"></div></div>;

  return (
    <div className="dashboard-dark comp-page">

      <Sidebar active="comparador" open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="dashboard-layout">

        {/* HEADER */}
        <header className="dashboard-header">
          <div className="header-left">
            <button className="menu-toggle" onClick={() => setSidebarOpen(true)} aria-label="Abrir menú">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="3" y1="6"  x2="21" y2="6"/>
                <line x1="3" y1="12" x2="21" y2="12"/>
                <line x1="3" y1="18" x2="15" y2="18"/>
              </svg>
            </button>
            <h1 className="header-title">Comparador de Bancos</h1>
          </div>
          <div className="header-right">
            <div className="header-avatar" title={`${user.nombre} ${user.apellido}`}>
              {user.nombre?.charAt(0).toUpperCase()}{user.apellido?.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        <main className="dashboard-main">
          <div className="dashboard-content">

            {/* ── HERO NAVY ── */}
            <div className="edu-hero">
              <div className="edu-hero-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/>
                  <polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/>
                </svg>
              </div>
              <div className="edu-hero-text">
                <h1>Comparador de Bancos</h1>
                <p>TEAs referenciales del mercado peruano. Encuentra la tarjeta que menos intereses te cobra.</p>
              </div>
            </div>

            {/* Fuente y vigencia de los datos — debe verse junto a las tasas */}
            <div className="comp-fuente">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
              <p>
                Tasas <strong>referenciales</strong> según {TEA_FUENTE} · actualizado {TEA_ACTUALIZADO}.
                La TEA que te aplique depende de tu perfil crediticio y del producto —
                confírmala siempre con tu banco. Fintú &amp; Co. no está afiliada ni respaldada
                por ninguna entidad financiera; las marcas mencionadas pertenecen a sus titulares.
              </p>
            </div>

            {loading ? (
              <div className="comp-loading">
                <div className="spinner"></div>
                <p>Cargando bancos...</p>
              </div>
            ) : (
              <>
                {/* Guía: cómo comparar — enseña el criterio en vez de recomendar un banco */}
                <div className="comp-guia">
                  <div className="comp-guia-head">
                    <div className="comp-guia-ico">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
                      </svg>
                    </div>
                    <div>
                      <h3>Cómo comparar una tarjeta</h3>
                      <p>La TEA es solo uno de los factores. Mira estos cuatro antes de decidir cuál te conviene a ti.</p>
                    </div>
                  </div>

                  <div className="comp-guia-grid">
                    {CRITERIOS.map((c, i) => (
                      <div className="comp-guia-item" key={c.n} style={{ animationDelay: `${i * 0.09}s` }}>
                        <span className="comp-guia-num" aria-hidden="true">{c.n}</span>
                        <h4>{c.titulo}</h4>
                        <p>{c.texto}</p>
                      </div>
                    ))}
                  </div>

                  {rangoTEA && (
                    <div className="comp-guia-rango">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
                      </svg>
                      <span>
                        Hoy el mercado se mueve entre <strong>{rangoTEA.min}%</strong> y <strong>{rangoTEA.max}%</strong> de TEA.
                        Y ojo: si pagas el total cada mes, la TEA casi no te afecta — ahí pesan más la membresía y los beneficios.
                      </span>
                    </div>
                  )}
                </div>

                {/* Filtros por objetivo */}
                <div className="comp-objetivos">
                  <span className="comp-objetivos-label">Filtrar por objetivo</span>
                  <div className="comp-objetivos-list">
                    {OBJETIVOS.map(obj => (
                      <button
                        key={obj.id}
                        className={`comp-objetivo-btn ${objetivo === obj.id ? 'active' : ''}`}
                        onClick={() => setObjetivo(obj.id)}
                      >
                        {obj.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Descripción del objetivo */}
                {OBJETIVO_CONFIG[objetivo]?.descripcion && (
                  <div className="comp-objetivo-desc">
                    <p>{OBJETIVO_CONFIG[objetivo].descripcion}</p>
                  </div>
                )}

                {/* Buscador + orden */}
                <div className="comp-toolbar">
                  <input
                    type="text"
                    className="comp-search"
                    placeholder="Buscar banco..."
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
                              {esMejor && <span className="comp-row-mejor">Menor TEA promedio</span>}
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
                                  <span>Interés mensual</span>
                                  <strong>S/ {calcularInteresMensual(banco.tea_promedio)} por cada S/ 1,000</strong>
                                </div>
                                <div className="comp-detail-item">
                                  <span>TEA anual</span>
                                  <strong>{banco.tea_promedio}%</strong>
                                </div>
                                <div className="comp-detail-item">
                                  <span>Si debes S/ 5,000 un mes</span>
                                  <strong className="danger">S/ {calcularInteresMensual(banco.tea_promedio, 5000)} en intereses</strong>
                                </div>
                                <div className="comp-detail-item">
                                  <span>Ranking</span>
                                  <strong>#{i + 1} de {bancos.length} bancos</strong>
                                </div>
                              </div>
                              <div className="comp-detail-tip">
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
                      <div>
                        <strong>Primera tarjeta</strong>
                        <p>Busca la menor TEA y sin membresía anual. Prioriza aprender a usarla bien.</p>
                      </div>
                    </div>
                    <div className="comp-edu-card">
                      <div>
                        <strong>Si pagas el total</strong>
                        <p>La TEA no importa tanto. Enfócate en los beneficios: millas, cashback, descuentos.</p>
                      </div>
                    </div>
                    <div className="comp-edu-card">
                      <div>
                        <strong>Si no puedes pagar el total</strong>
                        <p>La TEA es lo más importante. Una TEA menor puede ahorrarte cientos de soles al año.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <p className="comp-footer-note">
                  * TEAs referenciales. Pueden variar según perfil crediticio y producto específico.
                </p>
              </>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}

export default Comparador;
