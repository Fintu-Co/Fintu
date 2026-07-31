import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { parseISODate } from './fecha';
import { calcularCiclo } from './ciclo';

/* ═══════════════════════════════════════════════════════════
   generarEstadoCuenta — Fintú & Co.
   Estado de cuenta editorial: navy + gold, hairlines, aire.

   @param {Object} tarjeta      – datos de la tarjeta
   @param {Array}  movimientos  – lista de movimientos del ciclo
   @param {string} simbolo      – símbolo de moneda (S/, $…)
   @param {Object} opciones     – { usuario, modo: 'guardar' | 'blob' }
   @returns {Object} { nombreArchivo, blob? }
═══════════════════════════════════════════════════════════ */
export const generarEstadoCuenta = async (
  tarjeta,
  movimientos = [],
  simbolo = 'S/',
  opciones = {}
) => {

  const { usuario = null, modo = 'guardar' } = opciones;

  /* ── Paleta de marca ── */
  const W = 210, H = 297, M = 14;
  const NAVY    = [15,  23,  41 ];   // #0f1729
  const GOLD    = [196, 154, 60 ];   // #c49a3c
  const GOLD_L  = [219, 185, 106];   // #dbb96a
  const TEXT    = [26,  29,  46 ];   // #1a1d2e
  const MUTED   = [92,  100, 128];   // #5c6480
  const DIM     = [154, 164, 192];   // #9aa4c0
  const SOFT    = [176, 183, 201];   // texto suave sobre navy
  const HAIR    = [225, 228, 236];   // hairlines
  const BG_ALT  = [249, 250, 253];   // zebra de tabla / panel
  const GREEN   = [21,  122, 85 ];   // #157a55
  const RED     = [186, 38,  38 ];
  const AMB     = [217, 119, 6  ];

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  /* ── Helpers de formato ── */
  const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

  /** Número seguro: nunca NaN, nunca null. */
  const num = (v) => {
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : 0;
  };
  const fmt = (n, sym = simbolo) =>
    `${sym} ${Math.abs(num(n)).toLocaleString('es-PE',{ minimumFractionDigits:2, maximumFractionDigits:2 })}`.trim();
  const fmt0 = (n) => Math.round(num(n)).toLocaleString('es-PE');
  const fmtDate = (d) => d && !isNaN(d)
    ? `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`
    : '—';
  const fmtDateLong = (d) => d && !isNaN(d) ? `${d.getDate()} ${MESES[d.getMonth()]} ${d.getFullYear()}` : '—';
  /** Small caps espaciadas del sistema editorial. */
  const sc = (txt) => String(txt).toUpperCase().split('').join(' ');

  const now     = new Date();
  const banco   = tarjeta.banco_nombre || tarjeta.banco_nombre_custom || 'Banco';
  const nombre  = tarjeta.nombre_tarjeta || tarjeta.categoria_principal || 'Tarjeta de crédito';
  const cliente = usuario
    ? [usuario.nombre, usuario.apellido].filter(Boolean).join(' ').trim()
    : (tarjeta.cliente_nombre || tarjeta.usuario_nombre || '');

  /* ── Fechas del ciclo (fuente única: shared/utils/ciclo) ── */
  const { inicio: fi, cierre: fc, pago: fp, diasParaPago } = calcularCiclo(tarjeta, now);

  /* ── Datos financieros ── */
  const lineaNum   = num(tarjeta.linea_credito);
  const deudaNum   = num(tarjeta.deuda_actual);
  const pagoMinNum = num(tarjeta.pago_minimo);
  const teaNum     = num(tarjeta.tasa_interes);
  const disponible = lineaNum - deudaNum;
  const uso        = lineaNum > 0 ? Math.round((deudaNum / lineaNum) * 100) : 0;

  /* Movimientos: fecha sin corrimiento de zona, recortados al ciclo y en orden.
     El recorte es una red de seguridad: el documento no puede listar
     movimientos fuera del ciclo que declara en su encabezado. */
  const desdeMs = fi.getTime();
  const hastaMs = new Date(fc.getFullYear(), fc.getMonth(), fc.getDate(), 23, 59, 59, 999).getTime();

  const movs = [...(movimientos || [])]
    .map((m) => ({ ...m, _fecha: parseISODate(m.fecha_movimiento) }))
    .filter((m) => {
      const t = m._fecha?.getTime();
      return Number.isFinite(t) && t >= desdeMs && t <= hastaMs;
    })
    .sort((a, b) => a._fecha - b._fecha);

  const gastos = movs.filter(m => m.tipo === 'gasto');
  const pagos  = movs.filter(m => m.tipo === 'pago');
  const totalG = gastos.reduce((s,m) => s + num(m.monto), 0);
  const totalP = pagos.reduce ((s,m) => s + num(m.monto), 0);

  /* ═════════════════════════════════════════
     Proyección del pago mínimo
     Simulación mes a mes (TEA → tasa mensual efectiva). El último pago
     es parcial, así que mínimo × meses sobreestimaría los intereses.
     Misma fórmula que PaymentPlan, para que app y PDF no se contradigan.
  ═════════════════════════════════════════ */
  const proyectarMinimo = (deuda, pagoMin, tea) => {
    const i = tea > 0 ? Math.pow(1 + tea / 100, 1 / 12) - 1 : 0;
    if (!(deuda > 0) || !(pagoMin > 0) || i <= 0) return null;

    const interesMes = deuda * i;
    if (pagoMin <= interesMes) return { imposible: true, interesMes };

    let saldo = deuda, meses = 0, pagado = 0;
    while (saldo > 0.01 && meses < 600) {
      saldo = saldo * (1 + i);
      const p = Math.min(pagoMin, saldo);
      saldo -= p;
      pagado += p;
      meses++;
    }
    return { imposible: false, meses, interesTotal: Math.max(0, pagado - deuda) };
  };
  const proy = proyectarMinimo(deudaNum, pagoMinNum, teaNum);

  /* ═════════════════════════════════════════
     Helpers de dibujo
  ═════════════════════════════════════════ */

  /** Reduce el cuerpo hasta que quepa en maxW (evita que los montos se pisen). */
  const fitSize = (txt, maxW, base, min = 6.5) => {
    let s = base;
    doc.setFontSize(s);
    while (doc.getTextWidth(txt) > maxW && s > min) {
      s -= 0.25;
      doc.setFontSize(s);
    }
    return s;
  };

  /** Título de sección: small caps gold + hairline hasta el margen. */
  const sectionTitle = (txt, y) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...GOLD);
    const spaced = sc(txt);
    doc.text(spaced, M, y);
    const tw = doc.getTextWidth(spaced);
    doc.setDrawColor(...HAIR);
    doc.setLineWidth(0.25);
    doc.line(M + tw + 4, y - 1, W - M, y - 1);
  };

  /** Mini stat sin caja: label micro + valor que se autoajusta al ancho. */
  const stat = (label, value, x, y, color = TEXT, size = 12.5, maxW = 40) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5.8);
    doc.setTextColor(...DIM);
    doc.text(sc(label), x, y);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(fitSize(value, maxW, size));
    doc.setTextColor(...color);
    doc.text(value, x, y + 7);
  };

  /** Cabecera reducida para las páginas 2 en adelante. */
  const cabeceraContinuacion = () => {
    doc.setFillColor(...NAVY);
    doc.rect(0, 0, W, 15, 'F');
    doc.setFillColor(...GOLD);
    doc.rect(0, 15, W, 0.4, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...GOLD_L);
    doc.text('F I N T Ú   &   C O .', M, 9.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...SOFT);
    doc.text(`Estado de cuenta · ${banco} · continuación`, W - M, 9.5, { align: 'right' });
  };

  /** Salta de página (con cabecera de continuación) si no entran `alto` mm. */
  const LIMITE = H - 20;   // deja libre la banda del pie
  const asegurarEspacio = (y, alto) => {
    if (y + alto <= LIMITE) return y;
    doc.addPage();
    cabeceraContinuacion();
    return 26;
  };

  /* ═════════════════════════════════════════
     1. CABECERA — banda navy con firma dorada
  ═════════════════════════════════════════ */
  const BAND_H = 38;

  doc.setFillColor(...GOLD);
  doc.rect(0, 0, W, 1.1, 'F');                 // hairline dorada superior
  doc.setFillColor(...NAVY);
  doc.rect(0, 1.1, W, BAND_H, 'F');            // banda navy

  /* Wordmark espaciado */
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...GOLD_L);
  doc.text('F I N T Ú   &   C O .', M, 12);

  /* Título */
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  doc.setTextColor(255, 255, 255);
  doc.text('Estado de Cuenta', M, 23);

  /* Subtítulo */
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...SOFT);
  doc.text(`${banco}  ·  ${nombre}`, M, 30.5);

  /* Meta derecha */
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.5);
  doc.setTextColor(...GOLD);
  doc.text(sc('Documento referencial'), W - M, 12, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...SOFT);
  doc.text(`Generado el ${fmtDateLong(now)}`, W - M, 22, { align: 'right' });
  doc.text(`Ciclo: ${fmtDate(fi)} — ${fmtDate(fc)}`, W - M, 28, { align: 'right' });

  /* Hairline dorada inferior de la banda */
  doc.setFillColor(...GOLD);
  doc.rect(0, 1.1 + BAND_H - 0.4, W, 0.4, 'F');

  /* ═════════════════════════════════════════
     2. TITULAR + FECHA LÍMITE
  ═════════════════════════════════════════ */
  let y = BAND_H + 13;

  if (cliente) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5.8);
    doc.setTextColor(...DIM);
    doc.text(sc('Titular'), M, y);
    doc.setFontSize(10.5);
    doc.setTextColor(...TEXT);
    doc.text(cliente.toUpperCase(), M, y + 6);
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.8);
  doc.setTextColor(...DIM);
  doc.text(sc('Pagar antes del'), W - M, y, { align: 'right' });
  doc.setFontSize(11.5);
  doc.setTextColor(...NAVY);
  doc.text(fmtDateLong(fp), W - M, y + 6, { align: 'right' });

  /* Subrayado dorado bajo la fecha de pago */
  const fpW = doc.getTextWidth(fmtDateLong(fp));
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.5);
  doc.line(W - M - fpW, y + 8, W - M, y + 8);

  /* Cuenta regresiva — solo si el pago sigue vigente */
  if (diasParaPago >= 0 && diasParaPago <= 45) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.2);
    doc.setTextColor(...(diasParaPago <= 3 ? RED : diasParaPago <= 7 ? AMB : MUTED));
    doc.text(
      diasParaPago === 0 ? 'Vence hoy'
        : `En ${diasParaPago} día${diasParaPago === 1 ? '' : 's'}`,
      W - M, y + 12, { align: 'right' }
    );
  }

  y += 15;
  doc.setDrawColor(...HAIR);
  doc.setLineWidth(0.25);
  doc.line(M, y, W - M, y);

  /* ═════════════════════════════════════════
     3. LÍNEA DE CRÉDITO — 4 stats sin cajas + barra fina
  ═════════════════════════════════════════ */
  y += 9;
  sectionTitle('Línea de crédito', y);
  y += 8;

  const usoColor = uso >= 70 ? RED : uso >= 30 ? AMB : GREEN;
  const usoLabel = uso >= 70 ? 'Uso elevado' : uso >= 30 ? 'Zona de precaución' : 'Uso saludable';
  const colW = (W - 2 * M) / 4;
  const maxW4 = colW - 4;

  stat('Línea total',  fmt(lineaNum),   M,            y, TEXT, 12.5, maxW4);
  stat('Deuda actual', fmt(deudaNum),   M + colW,     y, deudaNum > 0 ? RED : TEXT, 12.5, maxW4);
  stat('Disponible',   fmt(disponible), M + colW * 2, y, disponible > 0 ? GREEN : RED, 12.5, maxW4);
  stat('Uso de línea', `${uso}%`,       M + colW * 3, y, usoColor, 12.5, maxW4);

  /* Barra de uso — fina, redondeada */
  y += 12;
  const barW = W - 2 * M;
  doc.setFillColor(233, 236, 243);
  doc.roundedRect(M, y, barW, 2.2, 1.1, 1.1, 'F');
  if (uso > 0) {
    doc.setFillColor(...usoColor);
    doc.roundedRect(M, y, Math.max(3, Math.min(uso, 100) / 100 * barW), 2.2, 1.1, 1.1, 'F');
  }
  /* Marca del 30% recomendado */
  doc.setDrawColor(...DIM);
  doc.setLineWidth(0.3);
  doc.line(M + barW * 0.3, y - 1, M + barW * 0.3, y + 3.2);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(...MUTED);
  doc.text(usoLabel, M, y + 7);
  doc.text('Meta recomendada: bajo 30%', W - M, y + 7, { align: 'right' });

  /* ═════════════════════════════════════════
     4. PAGOS DEL PERÍODO
  ═════════════════════════════════════════ */
  y += 15;
  sectionTitle('Pagos del período', y);
  y += 8;

  const colW3 = (W - 2 * M) / 3;
  const maxW3 = colW3 - 6;

  stat('Pago mínimo',        pagoMinNum > 0 ? fmt(pagoMinNum) : '—', M,             y, TEXT,  11, maxW3);
  stat('Pago total',         fmt(deudaNum),                          M + colW3,     y, TEXT,  11, maxW3);
  stat('Pagado este período', fmt(totalP),                           M + colW3 * 2, y, GREEN, 11, maxW3);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.8);
  doc.setTextColor(...DIM);
  doc.text(
    pagoMinNum > 0 ? 'Solo evita la mora' : 'No registrado en la app',
    M, y + 11
  );
  doc.text('Evita intereses pagando el total', M + colW3, y + 11);
  doc.text(
    `${pagos.length} pago${pagos.length !== 1 ? 's' : ''} registrado${pagos.length !== 1 ? 's' : ''}`,
    M + colW3 * 2, y + 11
  );
  y += 11;   // baja hasta la línea de sub-etiquetas (si no, la siguiente sección se le encima)

  /* ═════════════════════════════════════════
     5. COSTO DEL FINANCIAMIENTO
     Solo tiene sentido con deuda viva y TEA registrada.
  ═════════════════════════════════════════ */
  if (deudaNum > 0 && teaNum > 0) {
    y += 8;
    sectionTitle('Costo del financiamiento', y);
    y += 5;

    const PH = 21;
    doc.setFillColor(...BG_ALT);
    doc.roundedRect(M, y, W - 2 * M, PH, 1.5, 1.5, 'F');
    doc.setFillColor(...GOLD);
    doc.rect(M, y, 1.2, PH, 'F');                 // filete dorado a la izquierda

    const px = M + 7;
    const pw = (W - 2 * M - 14) / 3;

    /* TEA */
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5.8);
    doc.setTextColor(...DIM);
    doc.text(sc('TEA de tu tarjeta'), px, y + 6);
    doc.setFontSize(11);
    doc.setTextColor(teaNum >= 70 ? RED[0] : NAVY[0], teaNum >= 70 ? RED[1] : NAVY[1], teaNum >= 70 ? RED[2] : NAVY[2]);
    doc.text(`${teaNum}%`, px, y + 12.5);

    /* Plazo y costo pagando solo el mínimo */
    if (proy && !proy.imposible) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(5.8);
      doc.setTextColor(...DIM);
      doc.text(sc('Pagando solo el mínimo'), px + pw, y + 6);
      doc.setFontSize(11);
      doc.setTextColor(...AMB);
      doc.text(`${proy.meses} ${proy.meses === 1 ? 'mes' : 'meses'}`, px + pw, y + 12.5);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(5.8);
      doc.setTextColor(...DIM);
      doc.text(sc('Intereses que pagarías'), px + pw * 2, y + 6);
      doc.setFontSize(11);
      doc.setTextColor(...RED);
      doc.text(`${simbolo} ${fmt0(proy.interesTotal)}`, px + pw * 2, y + 12.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.2);
      doc.setTextColor(...MUTED);
      doc.text(
        `Pagando el total (${fmt(deudaNum)}) antes del ${fmtDate(fp)} no pagas intereses.`,
        px, y + 18
      );
    } else if (proy && proy.imposible) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(5.8);
      doc.setTextColor(...DIM);
      doc.text(sc('Intereses del mes'), px + pw, y + 6);
      doc.setFontSize(11);
      doc.setTextColor(...RED);
      doc.text(`${simbolo} ${fmt0(proy.interesMes)}`, px + pw, y + 12.5);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(5.8);
      doc.setTextColor(...DIM);
      doc.text(sc('Alerta'), px + pw * 2, y + 6);
      doc.setFontSize(9);
      doc.setTextColor(...RED);
      doc.text('Deuda creciente', px + pw * 2, y + 12.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.2);
      doc.setTextColor(...MUTED);
      doc.text(
        'Tu pago mínimo no cubre ni los intereses del mes: la deuda sube aunque pagues.',
        px, y + 18
      );
    } else {
      /* Hay TEA pero no pago mínimo registrado */
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(5.8);
      doc.setTextColor(...DIM);
      doc.text(sc('Interés estimado por mes'), px + pw, y + 6);
      doc.setFontSize(11);
      doc.setTextColor(...RED);
      doc.text(
        `${simbolo} ${fmt0(deudaNum * (Math.pow(1 + teaNum / 100, 1 / 12) - 1))}`,
        px + pw, y + 12.5
      );

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.2);
      doc.setTextColor(...MUTED);
      doc.text(
        'Registra tu pago mínimo en la app para proyectar en cuántos meses saldarías la deuda.',
        px, y + 18
      );
    }

    y += PH;
  }

  /* ═════════════════════════════════════════
     6. MOVIMIENTOS
  ═════════════════════════════════════════ */
  y += 14;
  y = asegurarEspacio(y, 26);
  sectionTitle('Movimientos del período', y);
  y += 4;

  if (movs.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8.5);
    doc.setTextColor(...DIM);
    doc.text('Sin movimientos registrados para este período.', M, y + 8);
    y += 14;
  } else {
    const tableRows = movs.map((m) => {
      const esPago = m.tipo === 'pago';
      return [
        fmtDate(m._fecha),
        m.descripcion || (esPago ? 'Pago recibido' : 'Consumo con tarjeta'),
        esPago ? 'PAGO' : 'CONSUMO',
        esPago ? '' : fmt(m.monto, ''),
        esPago ? fmt(m.monto, '') : '',
      ];
    });

    autoTable(doc, {
      startY: y,
      head: [['Fecha', 'Descripción', 'Tipo', `Cargo ${simbolo}`, `Abono ${simbolo}`]],
      body: tableRows,
      /* top rige las páginas 2+: deja aire bajo la cabecera de continuación */
      margin: { top: 26, left: M, right: M, bottom: 26 },
      styles: {
        font: 'helvetica',
        fontSize: 7.5,
        cellPadding: { top: 2.6, bottom: 2.6, left: 2, right: 2 },
        textColor: TEXT,
        lineColor: HAIR,
        lineWidth: 0,
        overflow: 'linebreak',
      },
      headStyles: {
        fillColor: NAVY,
        textColor: GOLD_L,
        fontStyle: 'bold',
        fontSize: 6.5,
        cellPadding: { top: 3, bottom: 3, left: 2, right: 2 },
      },
      bodyStyles: { lineWidth: { bottom: 0.15 }, lineColor: HAIR },
      alternateRowStyles: { fillColor: BG_ALT },
      columnStyles: {
        0: { cellWidth: 22 },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 22, halign: 'center' },
        3: { cellWidth: 27, halign: 'right' },
        4: { cellWidth: 27, halign: 'right' },
      },
      didParseCell: (data) => {
        if (data.section !== 'body') return;
        if (data.column.index === 3 && data.cell.raw) {
          data.cell.styles.textColor = RED;
          data.cell.styles.fontStyle = 'bold';
        }
        if (data.column.index === 4 && data.cell.raw) {
          data.cell.styles.textColor = GREEN;
          data.cell.styles.fontStyle = 'bold';
        }
        if (data.column.index === 2) {
          data.cell.styles.fontSize  = 5.8;
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.textColor = data.cell.raw === 'PAGO' ? GREEN : DIM;
        }
      },
      didDrawPage: (data) => {
        if (data.pageNumber > 1) cabeceraContinuacion();
      },
    });

    y = doc.lastAutoTable.finalY + 8;
  }

  /* ═════════════════════════════════════════
     7. TOTALES — bloque derecho fino
  ═════════════════════════════════════════ */
  y = asegurarEspacio(y, 26);

  const tx  = W - M;
  const lbX = tx - 62;

  const totalRow = (label, value, color, yy, size = 8) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(size - 1);
    doc.setTextColor(...MUTED);
    doc.text(label, lbX, yy);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(size);
    doc.setTextColor(...color);
    doc.text(value, tx, yy, { align: 'right' });
  };

  totalRow(`Total cargos (${gastos.length})`, fmt(totalG), RED,   y);
  totalRow(`Total abonos (${pagos.length})`,  fmt(totalP), GREEN, y + 6);

  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.4);
  doc.line(lbX, y + 9.5, tx, y + 9.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.2);
  doc.setTextColor(...DIM);
  doc.text(sc('Saldo actual'), lbX, y + 15.5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(fitSize(fmt(deudaNum), 44, 13));
  doc.setTextColor(...(deudaNum > 0 ? NAVY : GREEN));
  doc.text(fmt(deudaNum), tx, y + 15.5, { align: 'right' });

  y += 24;

  /* ═════════════════════════════════════════
     8. AVISO LEGAL
  ═════════════════════════════════════════ */
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  const legal = doc.splitTextToSize(
    `Documento referencial generado por Fintú & Co. el ${fmtDateLong(now)}. No reemplaza el estado de cuenta oficial de tu entidad bancaria. ` +
    'Los montos corresponden a los registros ingresados manualmente en la app y las proyecciones de intereses son estimaciones basadas en la TEA registrada. ' +
    'Para consultas sobre tu deuda real, intereses o cobros, comunícate directamente con tu banco.',
    W - 2 * M
  );

  y = asegurarEspacio(y, 6 + legal.length * 2.6);
  doc.setDrawColor(...HAIR);
  doc.setLineWidth(0.25);
  doc.line(M, y, W - M, y);
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(...DIM);
  doc.text(legal, M, y);

  /* ═════════════════════════════════════════
     9. PIE DE PÁGINA — en todas las páginas
  ═════════════════════════════════════════ */
  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    doc.setFillColor(...NAVY);
    doc.rect(0, H - 13, W, 13, 'F');
    doc.setFillColor(...GOLD);
    doc.rect(0, H - 13, W, 0.5, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(...GOLD_L);
    doc.text('F I N T Ú   &   C O .', M, H - 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(...SOFT);
    doc.text(
      `${banco} · Slot ${tarjeta.slot_numero} · Ciclo ${fmtDate(fi)}—${fmtDate(fc)}`,
      W / 2, H - 6, { align: 'center' }
    );

    doc.setTextColor(...GOLD);
    doc.setFontSize(6.5);
    doc.text(`Pág. ${p} de ${pages}`, W - M, H - 6, { align: 'right' });
  }

  /* ═════════════════════════════════════════
     10. METADATOS + SALIDA
  ═════════════════════════════════════════ */
  const cicloTag = `${fi.getFullYear()}${String(fi.getMonth() + 1).padStart(2, '0')}`;
  const nb = banco.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');

  doc.setProperties({
    title:    `Estado de cuenta ${banco} · ${cicloTag}`,
    subject:  `Ciclo ${fmtDate(fi)} — ${fmtDate(fc)}`,
    author:   'Fintú & Co.',
    creator:  'Fintú & Co.',
    keywords: ['estado de cuenta', 'tarjeta de crédito', banco, nombre].join(', '),
  });

  /* Slot y ciclo en el nombre: dos tarjetas del mismo banco ya no se pisan. */
  const nombreArchivo = `FintuCo_EstadoCuenta_${nb}_Slot${tarjeta.slot_numero}_${cicloTag}.pdf`;

  if (modo === 'blob') return { nombreArchivo, blob: doc.output('blob') };

  doc.save(nombreArchivo);
  return { nombreArchivo };
};
