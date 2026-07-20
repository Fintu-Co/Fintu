import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { movementsApi } from '@/modules/movements/services/movementsApi';
import ConfirmDialog from '@/shared/components/ConfirmDialog';
import './MovementsTable.css';

/* ── SVG icons ── */
const IcBuy = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>);
const IcPay = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>);
const IcEmpty = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="3"/><line x1="8" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="13" y2="14"/></svg>);
const IcPlus = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>);
const IcDots = () => (<svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><circle cx="12" cy="5" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="12" cy="19" r="1.6"/></svg>);
const IcTrash = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>);

const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

function MovementsTable({ tarjetaId, userId, simboloMoneda, refreshTrigger, onAdd }) {
  const [movimientos, setMovimientos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [menu, setMenu] = useState(null);       // { id, top, left }
  const [deleting, setDeleting] = useState(null);
  const [confirmId, setConfirmId] = useState(null);

  const simbolo = simboloMoneda || 'S/';

  useEffect(() => {
    let activo = true;
    (async () => {
      try {
        setLoading(true);
        const data = await movementsApi.getByCard(`${tarjetaId}?limite=6`);
        // Tope de 6 también en el cliente (el backend no siempre respeta ?limite)
        if (activo && data.success) setMovimientos((data.movimientos || []).slice(0, 6));
      } catch (e) {
        console.error('Error al cargar movimientos:', e);
      } finally {
        if (activo) setLoading(false);
      }
    })();
    return () => { activo = false; };
  }, [tarjetaId, refreshTrigger]);

  // Cerrar el menú al hacer click fuera o al hacer scroll
  useEffect(() => {
    if (!menu) return;
    const close = () => setMenu(null);
    window.addEventListener('click', close);
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return () => {
      window.removeEventListener('click', close);
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [menu]);

  const openMenu = (e, id) => {
    e.stopPropagation();
    const r = e.currentTarget.getBoundingClientRect();
    setMenu(menu?.id === id ? null : { id, top: r.bottom + 6, left: r.right - 168 });
  };

  const handleDelete = async (id) => {
    setConfirmId(null);
    try {
      setDeleting(id);
      const data = await movementsApi.delete({ movimientoId: id, userId });
      if (data.success) setMovimientos((prev) => prev.filter((m) => m.id !== id));
      else console.error('No se pudo eliminar:', data.message);
    } catch (e) {
      console.error('Error al eliminar movimiento:', e);
    } finally {
      setDeleting(null);
    }
  };

  const fmtFecha = (iso) => {
    const d = new Date(iso);
    return `${d.getDate()} ${MESES[d.getMonth()]} ${d.getFullYear()}`;
  };
  const fmtMonto = (n) => parseFloat(n).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  if (loading) {
    return (
      <div className="mtb-state">
        <div className="mtb-spinner" />
        <span>Cargando movimientos…</span>
      </div>
    );
  }

  if (movimientos.length === 0) {
    return (
      <div className="mtb-state">
        <div className="mtb-empty-ic"><IcEmpty /></div>
        <p className="mtb-empty-title">Aún no hay movimientos</p>
        <span className="mtb-empty-hint">Registra tus consumos y pagos para ver tu actividad aquí.</span>
        {onAdd && (
          <button className="mtb-empty-btn" onClick={onAdd}>
            <IcPlus /> Registrar movimiento
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="mtb-scroll">
      <table className="mtb-table">
        <thead>
          <tr>
            <th>Concepto</th>
            <th>Fecha</th>
            <th className="mtb-right">Monto</th>
            <th>Tipo</th>
            <th className="mtb-menu-col" aria-label="Acciones" />
          </tr>
        </thead>
        <tbody>
          {movimientos.map((m) => {
            const esGasto = m.tipo === 'gasto';
            return (
              <tr key={m.id} className={deleting === m.id ? 'mtb-row-deleting' : ''}>
                <td>
                  <div className="mtb-concept">
                    <span className={`mtb-ic ${esGasto ? 'buy' : 'pay'}`}>
                      {esGasto ? <IcBuy /> : <IcPay />}
                    </span>
                    <span className="mtb-desc">
                      {m.descripcion || (esGasto ? 'Consumo registrado' : 'Pago realizado')}
                    </span>
                  </div>
                </td>
                <td className="mtb-muted">{fmtFecha(m.fecha_movimiento)}</td>
                <td className={`mtb-right mtb-amount ${esGasto ? 'buy' : 'pay'}`}>
                  {esGasto ? '+' : '−'} {simbolo} {fmtMonto(m.monto)}
                </td>
                <td>
                  <span className={`mtb-badge ${esGasto ? 'buy' : 'pay'}`}>
                    {esGasto ? 'Consumo' : 'Pago'}
                  </span>
                </td>
                <td className="mtb-menu-col">
                  <button
                    className={`mtb-dots${menu?.id === m.id ? ' active' : ''}`}
                    onClick={(e) => openMenu(e, m.id)}
                    aria-label="Opciones del movimiento"
                    title="Opciones"
                  >
                    <IcDots />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {menu && createPortal(
        <div
          className="mtb-menu"
          style={{ top: menu.top, left: menu.left }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="mtb-menu-item danger"
            onClick={() => { const id = menu.id; setMenu(null); setConfirmId(id); }}
          >
            <IcTrash /> Eliminar movimiento
          </button>
        </div>,
        document.body
      )}

      <ConfirmDialog
        open={!!confirmId}
        title="¿Eliminar este movimiento?"
        message="Se quitará de tu historial y la deuda de la tarjeta se ajustará automáticamente. No se puede deshacer."
        confirmText="Eliminar"
        onConfirm={() => handleDelete(confirmId)}
        onCancel={() => setConfirmId(null)}
      />
    </div>
  );
}

export default MovementsTable;
