import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import fintuLogoSrc from '../assets/fintu-logo.png';

/* ═══════════════════════════════════════════════════════════
   generarEstadoCuenta  — Fintú & Co.
   Genera un PDF estilo estado de cuenta bancario real.

   @param {Object} tarjeta     – datos de la tarjeta
   @param {Array}  movimientos – lista de movimientos
   @param {string} simbolo     – símbolo de moneda (S/, $…)
   @param {string} [logoBase64] – logo en base64 (opcional)
═══════════════════════════════════════════════════════════ */
export const generarEstadoCuenta = async (tarjeta, movimientos = [], simbolo = 'S/') => {

  /* ── Cargar logo desde src/assets (import de Vite) ── */
  let logoBase64 = null;
  let logoFormat = 'PNG';
  try {
    const resp    = await fetch(fintuLogoSrc);
    const blob    = await resp.blob();
    const dataUrl = await new Promise((res) => {
      const r = new FileReader();
      r.onloadend = () => res(r.result);
      r.readAsDataURL(blob);
    });
    if      (dataUrl.startsWith('data:image/jpeg')) logoFormat = 'JPEG';
    else if (dataUrl.startsWith('data:image/webp')) logoFormat = 'WEBP';
    else                                             logoFormat = 'PNG';
    logoBase64 = dataUrl;
  } catch (_) { /* Sin logo → usa texto */ }

  /* ── Paleta y constantes ── */
  const W      = 210;
  const DARK   = [15,  15,  15 ];
  const GOLD   = [184, 140, 74 ];
  const GOLD2  = [212, 165, 116];
  const GRAY   = [100, 100, 100];
  const LGRAY  = [160, 160, 160];
  const XLGRAY = [210, 210, 210];
  const LINE   = [220, 215, 205];
  const BG     = [252, 250, 247];
  const BGALT  = [245, 243, 239];
  const RED    = [185,  45,  45];
  const GREEN  = [ 30, 120,  55];
  const AMB    = [160, 115,   0];

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  /* ── Helpers ── */
  const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  const fmt   = (n, sym = simbolo) =>
    `${sym} ${Math.abs(parseFloat(n || 0)).toLocaleString('es-PE',{ minimumFractionDigits:2, maximumFractionDigits:2 })}`;
  const fmtDate = (d) => d
    ? `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`
    : '—';
  const fmtDateLong = (d) => d
    ? `${d.getDate()} ${MESES[d.getMonth()]} ${d.getFullYear()}`
    : '—';

  const now     = new Date();
  const banco   = tarjeta.banco_nombre || tarjeta.banco_nombre_custom || 'Banco';
  const nombre  = tarjeta.nombre_tarjeta || tarjeta.categoria_principal || 'Tarjeta de crédito';
  const cliente = tarjeta.cliente_nombre || tarjeta.usuario_nombre || '';

  /* ── Calcular fechas del ciclo ── */
  const dI = tarjeta.dia_inicio_ciclo;
  const dC = tarjeta.dia_cierre_ciclo;
  const dP = tarjeta.dia_pago;

  let fi;
  if (now.getDate() >= dI) fi = new Date(now.getFullYear(), now.getMonth(), dI);
  else                     fi = new Date(now.getFullYear(), now.getMonth() - 1, dI);

  let fc = new Date(fi);
  if (dC >= dI) { fc.setDate(dC); }
  else          { fc.setMonth(fc.getMonth() + 1); fc.setDate(dC); }

  let fp = new Date(fc);
  if (dP >= dC) { fp.setDate(dP); }
  else          { fp.setMonth(fp.getMonth() + 1); fp.setDate(dP); }

  /* ── Datos financieros ── */
  const lineaNum   = parseFloat(tarjeta.linea_credito || 0);
  const deudaNum   = parseFloat(tarjeta.deuda_actual  || 0);
  const disponible = lineaNum - deudaNum;
  const uso        = lineaNum > 0 ? Math.round((deudaNum / lineaNum) * 100) : 0;

  /* Totales de movimientos */
  const gastos   = movimientos.filter(m => m.tipo === 'gasto');
  const pagos    = movimientos.filter(m => m.tipo === 'pago');
  const totalG   = gastos.reduce((s,m) => s + parseFloat(m.monto),0);
  const totalP   = pagos.reduce ((s,m) => s + parseFloat(m.monto),0);

  /* ═════════════════════════════════════════
     1. CABECERA — panel oscuro derecho + título izquierdo
  ═════════════════════════════════════════ */

  const HEADER_H  = 52;   // altura total del header
  const LOGO_PANW = 88;   // ancho reservado para el logo (derecho)

  /* Franja dorada top */
  doc.setFillColor(...GOLD);
  doc.rect(0, 0, W, 1.5, 'F');

  /* Línea dorada separadora vertical (sutil) */
  doc.setFillColor(...LINE);
  doc.rect(W - LOGO_PANW, 4, 0.4, HEADER_H - 8, 'F');

  /* ── Logo sobre fondo blanco — centrado en zona derecha ── */
  let logoInserted = false;
  if (logoBase64) {
    try {
      const lgH = HEADER_H - 4;           // casi toda la altura del header
      const lgW = LOGO_PANW - 4;          // casi todo el ancho reservado
      const lgX = W - LOGO_PANW + 2;      // margen izquierdo
      const lgY = 2;                       // margen top
      doc.addImage(logoBase64, logoFormat, lgX, lgY, lgW, lgH);
      logoInserted = true;
    } catch (_) { /* Fallback a texto */ }
  }
  if (!logoInserted) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(...GOLD);
    doc.text('FINTÚ & CO.', W - LOGO_PANW / 2, HEADER_H / 2 - 2, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...LGRAY);
    doc.text('SAGITARIO', W - LOGO_PANW / 2, HEADER_H / 2 + 4, { align: 'center' });
  }

  /* ── Título izquierdo ── */
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(...DARK);
  doc.text('Estado de Cuenta', 12, 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(...GRAY);
  doc.text(`${banco}  ·  ${nombre}`, 12, 25);

  if (cliente) {
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...DARK);
    doc.text(cliente.toUpperCase(), 12, 33);
  }

  /* Línea divisoria bajo el header completo */
  doc.setDrawColor(...LINE);
  doc.setLineWidth(0.4);
  doc.line(0, HEADER_H, W - LOGO_PANW - 0.8, HEADER_H);

  /* ── Bloque de información clave — fondo gris suave ── */
  const infoY   = HEADER_H;
  const infoH   = 20;
  const usableW = W - LOGO_PANW - 0.8; // zona blanca disponible

  doc.setFillColor(...BGALT);
  doc.rect(0, infoY, usableW, infoH, 'F');
  doc.setDrawColor(...LINE);
  doc.setLineWidth(0.3);
  doc.line(0, infoY + infoH, usableW, infoY + infoH);

  /* Divisor vertical central */
  const mid = usableW / 2;
  doc.line(mid, infoY + 3, mid, infoY + infoH - 3);

  /* Col 1 — Ciclo de facturación */
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6);
  doc.setTextColor(...LGRAY);
  doc.text('CICLO DE FACTURACIÓN', 10, infoY + 6);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...DARK);
  doc.text(`Del ${fmtDate(fi)}`, 10, infoY + 12);
  doc.setFont('helvetica', 'bold');
  doc.text(`Al  ${fmtDate(fc)}`, 10, infoY + 17);

  /* Col 2 — Fecha límite de pago */
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6);
  doc.setTextColor(...LGRAY);
  doc.text('FECHA LÍMITE DE PAGO', mid + 6, infoY + 6);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...RED);
  doc.text(fmtDateLong(fp), mid + 6, infoY + 15);

  /* "Generado el" — esquina inferior derecha zona blanca */
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(...LGRAY);
  doc.text(`Generado: ${fmtDateLong(now)}`, usableW - 4, infoY + infoH - 2, { align: 'right' });

  /* ═════════════════════════════════════════
     2. LÍNEA DE CRÉDITO
  ═════════════════════════════════════════ */
  let y = infoY + infoH + 8;

  /* Título sección */
  doc.setFillColor(...BGALT);
  doc.rect(12, y - 4, W - 24, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...DARK);
  doc.text('LÍNEA DE CRÉDITO', 15, y);

  y += 5;

  /* 3 cajas horizontales */
  const lcW = (W - 24 - 4) / 3;
  const lcData = [
    { label: `Línea de crédito ${simbolo}`, value: fmt(lineaNum,'') , color: DARK  },
    { label: `Línea utilizada ${simbolo}`,  value: fmt(deudaNum,'') , color: deudaNum > 0 ? RED : DARK },
    { label: `Crédito disponible ${simbolo}`, value: fmt(disponible,''), color: disponible > 0 ? GREEN : RED },
  ];

  lcData.forEach((c, i) => {
    const bx = 12 + i * (lcW + 2);
    doc.setDrawColor(...LINE);
    doc.setLineWidth(0.3);
    doc.rect(bx, y, lcW, 14, 'S');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(...LGRAY);
    doc.text(c.label, bx + 3, y + 5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...c.color);
    doc.text(c.value, bx + lcW - 3, y + 11, { align: 'right' });
  });

  /* Barra de uso */
  y += 17;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...LGRAY);
  doc.text(`Uso de línea: ${uso}%`, 12, y);

  const barW  = W - 24;
  const barH  = 4;
  doc.setFillColor(230, 225, 215);
  doc.roundedRect(12, y + 2, barW, barH, 1, 1, 'F');
  const fillW = Math.max(2, (uso / 100) * barW);
  const barC  = uso >= 70 ? RED : uso >= 30 ? AMB : GREEN;
  doc.setFillColor(...barC);
  doc.roundedRect(12, y + 2, fillW, barH, 1, 1, 'F');

  y += 10;
  doc.setDrawColor(...LINE);
  doc.line(12, y, W - 12, y);

  /* ═════════════════════════════════════════
     3. RESUMEN DE PAGOS
  ═════════════════════════════════════════ */
  y += 5;
  doc.setFillColor(...BGALT);
  doc.rect(12, y - 4, W - 24, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...DARK);
  doc.text('PAGOS', 15, y);

  y += 5;

  const pagoData = [
    { label: 'Pago mínimo', value: fmt(lineaNum * 0.05), sub: '(estimado, 5% de la línea)' },
    { label: 'Pago total de contado', value: fmt(deudaNum), sub: 'Evita intereses pagando el total' },
    { label: 'Total pagado este período', value: fmt(totalP), sub: `${pagos.length} pago${pagos.length!==1?'s':''}` },
  ];

  const pgW = (W - 24 - 4) / 3;
  pagoData.forEach((p, i) => {
    const bx = 12 + i * (pgW + 2);
    doc.setDrawColor(...LINE);
    doc.setLineWidth(0.3);
    doc.rect(bx, y, pgW, 18, 'S');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(...LGRAY);
    doc.text(p.label, bx + 3, y + 5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...(i === 2 ? GREEN : DARK));
    doc.text(p.value, bx + pgW - 3, y + 12, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.5);
    doc.setTextColor(...LGRAY);
    doc.text(p.sub, bx + 3, y + 17);
  });

  y += 22;
  doc.setDrawColor(...LINE);
  doc.line(12, y, W - 12, y);

  /* ═════════════════════════════════════════
     4. TABLA DE MOVIMIENTOS
  ═════════════════════════════════════════ */
  y += 5;
  doc.setFillColor(...BGALT);
  doc.rect(12, y - 4, W - 24, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...DARK);
  doc.text('MOVIMIENTOS DEL PERÍODO', 15, y);

  y += 3;

  if (!movimientos || movimientos.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(...LGRAY);
    doc.text('Sin movimientos registrados para este período.', 12, y + 10);
    y += 18;
  } else {
    const tableRows = movimientos.map((m) => {
      const fd = new Date(m.fecha_movimiento);
      const esPago = m.tipo === 'pago';
      return [
        fmtDate(fd),
        fmtDate(fd),
        m.descripcion || (esPago ? 'PAGO RECIBIDO' : 'CONSUMO CON TARJETA'),
        esPago ? 'PAGO' : 'CONSUMO',
        esPago ? '' : fmt(m.monto, ''),
        esPago ? fmt(m.monto, '') : '',
      ];
    });

    autoTable(doc, {
      startY: y,
      head: [['F. Proceso','F. Consumo','Descripción','Tipo','Cargo','Abono']],
      body: tableRows,
      margin: { left: 12, right: 12 },
      styles: {
        fontSize:    7,
        cellPadding: 2.5,
        textColor:   DARK,
        lineColor:   LINE,
        lineWidth:   0.2,
        font:        'helvetica',
      },
      headStyles: {
        fillColor:   DARK,
        textColor:   [255, 220, 150],
        fontStyle:   'bold',
        fontSize:    6.5,
        cellPadding: 3,
      },
      alternateRowStyles: { fillColor: BG },
      columnStyles: {
        0: { cellWidth: 20, halign: 'center' },
        1: { cellWidth: 20, halign: 'center' },
        2: { cellWidth: 'auto' },
        3: { cellWidth: 22, halign: 'center' },
        4: { cellWidth: 28, halign: 'right' },
        5: { cellWidth: 28, halign: 'right' },
      },
      didParseCell: (data) => {
        if (data.section !== 'body') return;
        /* Cargos en rojo oscuro, abonos en verde */
        if (data.column.index === 4 && data.cell.raw) {
          data.cell.styles.textColor = RED;
          data.cell.styles.fontStyle  = 'bold';
        }
        if (data.column.index === 5 && data.cell.raw) {
          data.cell.styles.textColor = GREEN;
          data.cell.styles.fontStyle  = 'bold';
        }
        /* Tipo en negrita */
        if (data.column.index === 3) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fontSize  = 6;
          data.cell.styles.textColor = data.cell.raw === 'PAGO' ? GREEN : GRAY;
        }
      },
    });

    y = doc.lastAutoTable.finalY + 4;
  }

  /* ── Fila de totales ── */
  doc.setDrawColor(...LINE);
  doc.line(12, y, W - 12, y);
  y += 5;

  const totW = 55;
  const tx   = W - 12;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...DARK);
  doc.text('TOTAL CARGOS DEL PERÍODO', tx - totW - 4, y, { align: 'right' });
  doc.setTextColor(...RED);
  doc.text(fmt(totalG), tx, y, { align: 'right' });

  y += 6;
  doc.setTextColor(...DARK);
  doc.text('TOTAL ABONOS DEL PERÍODO', tx - totW - 4, y, { align: 'right' });
  doc.setTextColor(...GREEN);
  doc.text(fmt(totalP), tx, y, { align: 'right' });

  y += 6;
  doc.setDrawColor(...DARK);
  doc.setLineWidth(0.5);
  doc.line(tx - totW - 4 - 4, y - 1, tx, y - 1);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...DARK);
  doc.text('SALDO ACTUAL', tx - totW - 4, y + 5, { align: 'right' });
  doc.setTextColor(...(deudaNum > 0 ? RED : GREEN));
  doc.text(fmt(deudaNum), tx, y + 5, { align: 'right' });

  y += 14;

  /* ═════════════════════════════════════════
     5. AVISO LEGAL
  ═════════════════════════════════════════ */
  doc.setDrawColor(...LINE);
  doc.setLineWidth(0.3);
  doc.line(12, y, W - 12, y);
  y += 4;

  const disclaimer = [
    'Este documento es referencial y no reemplaza el estado de cuenta oficial emitido por tu entidad bancaria.',
    `Los movimientos mostrados corresponden a los registros en Fintú & Co. al ${fmtDateLong(now)}.`,
    'Para consultas sobre tu deuda real, intereses o cobros, comunícate directamente con tu banco.',
  ];

  disclaimer.forEach((line) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(...LGRAY);
    doc.text(line, 12, y);
    y += 4;
  });

  /* ═════════════════════════════════════════
     6. PIE DE PÁGINA
  ═════════════════════════════════════════ */
  const pageH = 297;
  doc.setFillColor(...DARK);
  doc.rect(0, pageH - 14, W, 14, 'F');
  doc.setFillColor(...GOLD);
  doc.rect(0, pageH - 14, W, 0.6, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...GOLD2);
  doc.text('FINTÚ & CO.', 12, pageH - 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(130, 120, 100);
  doc.text(
    `Estado de cuenta referencial  ·  Slot ${tarjeta.slot_numero}  ·  ${banco}  ·  Generado ${fmtDateLong(now)}`,
    W / 2, pageH - 7, { align: 'center' }
  );

  /* Número de página */
  doc.setTextColor(...GOLD);
  doc.setFontSize(7);
  doc.text('Pág. 1 de 1', W - 12, pageH - 7, { align: 'right' });

  /* ── Guardar ── */
  const ts    = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}`;
  const nb    = banco.replace(/\s+/g,'_').replace(/[^a-zA-Z0-9_]/g,'');
  doc.save(`FintuCo_${nb}_${ts}.pdf`);
};
