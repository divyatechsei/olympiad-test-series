'use client';
import { useRef, useEffect } from 'react';

const NAVY = '#1a2b4c';

/* ============================================================
   DIAGRAM CANVAS — ports the diagram generators to browser canvas
   ============================================================ */
function drawShapePrimitive(ctx, sh, cx, cy, r) {
  ctx.fillStyle = '#c0392b';
  ctx.strokeStyle = NAVY;
  ctx.lineWidth = 2;
  if (sh === 'C') {
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  } else if (sh === 'T') {
    ctx.beginPath();
    ctx.moveTo(cx, cy - r * 1.1); ctx.lineTo(cx - r, cy + r * 0.9); ctx.lineTo(cx + r, cy + r * 0.9);
    ctx.closePath(); ctx.fill(); ctx.stroke();
  } else if (sh === 'Ti') {
    ctx.beginPath();
    ctx.moveTo(cx, cy + r * 1.1); ctx.lineTo(cx - r, cy - r * 0.9); ctx.lineTo(cx + r, cy - r * 0.9);
    ctx.closePath(); ctx.fill(); ctx.stroke();
  } else if (sh === 'S') {
    const side = r * 1.7;
    ctx.beginPath(); ctx.rect(cx - side / 2, cy - side / 2, side, side); ctx.fill(); ctx.stroke();
  } else if (sh === 'D') {
    ctx.beginPath();
    ctx.moveTo(cx, cy - r); ctx.lineTo(cx + r, cy); ctx.lineTo(cx, cy + r); ctx.lineTo(cx - r, cy);
    ctx.closePath(); ctx.fill(); ctx.stroke();
  }
}

function drawShapesRowInBox(ctx, boxX, boxY, boxW, boxH, order, opts = {}) {
  const n = order.length;
  const pad = opts.pad || 22;
  const usableW = boxW - 2 * pad;
  const maxSpacing = n > 1 ? usableW / (n - 1) : 0;
  const spacing = Math.min(opts.spacing || 46, maxSpacing);
  const r = Math.min(opts.r || 14, spacing / 2.4, (boxH - 2 * pad) / 2.4);
  const centerX = boxX + boxW / 2;
  const centerY = boxY + boxH / 2 + (opts.yOffset || 0);
  const startCx = centerX - (spacing * (n - 1)) / 2;
  order.forEach((sh, i) => drawShapePrimitive(ctx, sh, startCx + i * spacing, centerY, r));
}

function drawBoxOutline(ctx, x, y, w, h, color = NAVY, lw = 1.5) {
  ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.strokeRect(x, y, w, h);
}

function drawPattern(ctx, { startAngle, step }) {
  const boxSize = 120, gap = 30, startX = 20, y = 30;
  const angles = [startAngle, startAngle + step, startAngle + 2 * step];
  function drawArrow(cx, cy, angleDeg) {
    const len = 40, rad = (angleDeg * Math.PI) / 180;
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(rad);
    ctx.strokeStyle = '#c0392b'; ctx.fillStyle = '#c0392b'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(0, len / 2); ctx.lineTo(0, -len / 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, -len / 2 - 4); ctx.lineTo(-10, -len / 2 + 12); ctx.lineTo(10, -len / 2 + 12);
    ctx.closePath(); ctx.fill(); ctx.restore();
  }
  for (let i = 0; i < 3; i++) {
    const x = startX + i * (boxSize + gap);
    drawBoxOutline(ctx, x, y, boxSize, boxSize);
    drawArrow(x + boxSize / 2, y + boxSize / 2, angles[i]);
  }
  const qx = startX + 3 * (boxSize + gap);
  drawBoxOutline(ctx, qx, y, boxSize, boxSize);
  ctx.fillStyle = NAVY; ctx.font = 'bold 60px sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('?', qx + boxSize / 2, y + boxSize / 2 + 4);
}

function drawClassification(ctx, { regularShapes, oddShape, oddPosition }) {
  const cellW = 150, cy = 100;
  const centers = [90, 90 + cellW, 90 + 2 * cellW, 90 + 3 * cellW];
  function regularPolygon(cx, cyy, r, sides, rotate = -Math.PI / 2) {
    ctx.fillStyle = '#dce6f2'; ctx.strokeStyle = NAVY; ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let i = 0; i < sides; i++) {
      const ang = rotate + (i * 2 * Math.PI) / sides;
      const px = cx + r * Math.cos(ang), py = cyy + r * Math.sin(ang);
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath(); ctx.fill(); ctx.stroke();
  }
  function drawByCode(code, cx, cyy) {
    if (code === 'S') { ctx.fillStyle = '#dce6f2'; ctx.strokeStyle = NAVY; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.rect(cx - 40, cyy - 40, 80, 80); ctx.fill(); ctx.stroke(); }
    else if (code === 'P') regularPolygon(cx, cyy, 48, 5);
    else if (code === 'H') regularPolygon(cx, cyy, 46, 6, 0);
    else if (code === 'Eq') regularPolygon(cx, cyy, 48, 3, -Math.PI / 2);
    else if (code === 'R') { ctx.fillStyle = '#dce6f2'; ctx.strokeStyle = NAVY; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.rect(cx - 55, cyy - 32, 110, 64); ctx.fill(); ctx.stroke(); }
  }
  const codes = [];
  let ri = 0;
  for (let i = 0; i < 4; i++) codes.push(i === oddPosition ? oddShape : regularShapes[ri++]);
  codes.forEach((code, i) => drawByCode(code, centers[i], cy));
  ctx.fillStyle = NAVY; ctx.font = 'bold 22px sans-serif'; ctx.textAlign = 'center';
  ['1', '2', '3', '4'].forEach((lab, i) => ctx.fillText(lab, centers[i], cy + 75));
}

function drawShapeCount(ctx, { variant }) {
  ctx.strokeStyle = NAVY; ctx.lineWidth = 3;
  if (variant === 'square_diagonals' || variant === 'rectangle_diagonals') {
    const isSquare = variant === 'square_diagonals';
    const m = isSquare ? 60 : 50, w = isSquare ? 300 : 320, h = isSquare ? 300 : 220, top = isSquare ? 60 : 100;
    ctx.strokeRect(m, top, w, h);
    ctx.beginPath(); ctx.moveTo(m, top); ctx.lineTo(m + w, top + h);
    ctx.moveTo(m + w, top); ctx.lineTo(m, top + h); ctx.stroke();
  } else if (variant === 'grid_squares_2x2') {
    const m = 60, cell = 130;
    for (let i = 0; i <= 2; i++) {
      ctx.beginPath(); ctx.moveTo(m + i * cell, m); ctx.lineTo(m + i * cell, m + 2 * cell); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(m, m + i * cell); ctx.lineTo(m + 2 * cell, m + i * cell); ctx.stroke();
    }
  } else if (variant === 'medial_triangle') {
    const ax = 210, ay = 60, bx = 60, by = 340, cx = 360, cy = 340;
    ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.lineTo(cx, cy); ctx.closePath(); ctx.stroke();
    const mAB = { x: (ax + bx) / 2, y: (ay + by) / 2 }, mBC = { x: (bx + cx) / 2, y: (by + cy) / 2 }, mCA = { x: (cx + ax) / 2, y: (cy + ay) / 2 };
    ctx.beginPath(); ctx.moveTo(mAB.x, mAB.y); ctx.lineTo(mBC.x, mBC.y); ctx.lineTo(mCA.x, mCA.y); ctx.closePath(); ctx.stroke();
  }
}

function drawMirror(ctx, { figure, optionShapes }) {
  ctx.fillStyle = NAVY; ctx.textAlign = 'left'; ctx.font = 'bold 20px sans-serif';
  ctx.fillText('Given Figure:', 30, 40);
  drawShapesRowInBox(ctx, 20, 55, 220, 70, figure, { spacing: 55, r: 18, pad: 20 });
  ctx.save(); ctx.setLineDash([6, 6]); ctx.strokeStyle = '#555';
  ctx.beginPath(); ctx.moveTo(230, 40); ctx.lineTo(230, 140); ctx.stroke(); ctx.restore();
  ctx.fillStyle = NAVY; ctx.font = '14px sans-serif'; ctx.fillText('Mirror Line', 190, 155);
  ctx.font = 'bold 20px sans-serif'; ctx.fillText('Answer Options (mirror image of the given figure):', 30, 190);

  const boxW = 190, boxH = 100, startX = 40, startY = 220, gapX = 20, gapY = 20;
  const labels = ['(A)', '(B)', '(C)', '(D)'];
  optionShapes.forEach((opt, idx) => {
    const col = idx % 2, row = Math.floor(idx / 2);
    const x = startX + col * (boxW + gapX), y = startY + row * (boxH + gapY);
    drawBoxOutline(ctx, x, y, boxW, boxH);
    ctx.font = 'bold 16px sans-serif'; ctx.textAlign = 'left'; ctx.fillStyle = NAVY;
    ctx.fillText(labels[idx], x + 10, y + 24);
    drawShapesRowInBox(ctx, x, y + 18, boxW, boxH - 18, opt, { spacing: 44, r: 13, pad: 24 });
  });
}

function drawAngle(ctx, { angle }) {
  const ox = 80, oy = 260, len = 220;
  ctx.strokeStyle = NAVY; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + len, oy); ctx.stroke();
  const rad = (angle * Math.PI) / 180;
  const x2 = ox + len * 0.85 * Math.cos(rad), y2 = oy - len * 0.85 * Math.sin(rad);
  ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(x2, y2); ctx.stroke();
  ctx.beginPath(); ctx.strokeStyle = '#c0392b'; ctx.lineWidth = 2; ctx.arc(ox, oy, 50, -rad, 0, false); ctx.stroke();
  ctx.fillStyle = NAVY; ctx.font = 'bold 18px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('O', ox - 15, oy + 15); ctx.fillText('A', ox + len + 15, oy + 5); ctx.fillText('B', x2 - 10, y2 - 10);
}

function drawRectangleDiagram(ctx, { l, b }) {
  const x = 60, y = 40, w = 300, h = 140;
  ctx.strokeStyle = NAVY; ctx.fillStyle = '#eaf0fb'; ctx.lineWidth = 3;
  ctx.fillRect(x, y, w, h); ctx.strokeRect(x, y, w, h);
  ctx.fillStyle = NAVY; ctx.font = 'bold 20px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText(`${l} cm`, x + w / 2, y - 12);
  ctx.save(); ctx.translate(x - 25, y + h / 2); ctx.rotate(-Math.PI / 2); ctx.fillText(`${b} cm`, 0, 0); ctx.restore();
}

function drawBarGraphDiagram(ctx, { data }) {
  const originX = 60, originY = 280;
  const maxVal = Math.ceil(Math.max(...data.map((d) => d.value)) / 10) * 10 + 5;
  const chartH = 220, barW = 60, gap = 40;
  ctx.strokeStyle = NAVY; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(originX, originY - chartH - 10); ctx.lineTo(originX, originY);
  ctx.lineTo(originX + data.length * (barW + gap) + 10, originY); ctx.stroke();
  ctx.fillStyle = NAVY; ctx.font = '13px sans-serif'; ctx.textAlign = 'right';
  const step = Math.max(5, Math.ceil(maxVal / 5 / 5) * 5);
  for (let v = 0; v <= maxVal; v += step) {
    const yy = originY - (v / maxVal) * chartH;
    ctx.fillText(String(v), originX - 8, yy + 4);
    ctx.strokeStyle = '#dddddd'; ctx.beginPath(); ctx.moveTo(originX, yy); ctx.lineTo(originX + data.length * (barW + gap), yy); ctx.stroke();
  }
  data.forEach((d, i) => {
    const barH = (d.value / maxVal) * chartH;
    const x = originX + 25 + i * (barW + gap), y = originY - barH;
    ctx.fillStyle = d.color; ctx.fillRect(x, y, barW, barH);
    ctx.strokeStyle = NAVY; ctx.lineWidth = 1.5; ctx.strokeRect(x, y, barW, barH);
    ctx.fillStyle = NAVY; ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(String(d.value), x + barW / 2, y - 8);
    ctx.font = '13px sans-serif'; ctx.fillText(d.label, x + barW / 2, originY + 20);
  });
}

function drawPictographDiagram(ctx, { rows, unit, unitLabel }) {
  const startX = 140, startY = 40, rowH = 55;
  const label = unitLabel || 'items';
  function drawBook(x, y, fraction) {
    ctx.save(); ctx.beginPath(); ctx.rect(x, y, 26 * fraction, 20); ctx.clip();
    ctx.fillStyle = '#2e6da4'; ctx.fillRect(x, y, 26, 20);
    ctx.strokeStyle = NAVY; ctx.lineWidth = 1.5; ctx.strokeRect(x, y, 26, 20);
    ctx.beginPath(); ctx.moveTo(x + 13, y); ctx.lineTo(x + 13, y + 20); ctx.stroke(); ctx.restore();
    if (fraction < 1) { ctx.strokeStyle = NAVY; ctx.lineWidth = 1.5; ctx.strokeRect(x, y, 26, 20); }
  }
  rows.forEach((r, i) => {
    const y = startY + i * rowH;
    ctx.textAlign = 'right'; ctx.font = 'bold 16px sans-serif'; ctx.fillStyle = NAVY;
    ctx.fillText(r.name, startX - 15, y + 15);
    const symbols = r.count / unit;
    let full = Math.floor(symbols);
    let hasHalf = Math.abs(symbols - full - 0.5) < 1e-6;
    let x = startX;
    for (let s = 0; s < full; s++) { drawBook(x, y, 1); x += 34; }
    if (hasHalf) drawBook(x, y, 0.5);
  });
  ctx.textAlign = 'left'; ctx.font = '14px sans-serif'; ctx.fillStyle = NAVY;
  const keyY = startY + rows.length * rowH + 15;
  drawBook(startX, keyY, 1);
  ctx.fillText(`= ${unit} ${label}`, startX + 34, keyY + 15);
}

function drawClock(ctx, { hour, minute = 0 }) {
  const cx = 150, cy = 150, r = 120;
  ctx.strokeStyle = NAVY; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = NAVY;
  ctx.beginPath(); ctx.arc(cx, cy, 5, 0, Math.PI * 2); ctx.fill();

  // Hour ticks + numbers
  ctx.font = 'bold 18px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (let n = 1; n <= 12; n++) {
    const ang = (n / 12) * 2 * Math.PI - Math.PI / 2;
    const tx = cx + Math.cos(ang) * (r - 22);
    const ty = cy + Math.sin(ang) * (r - 22);
    ctx.fillText(String(n), tx, ty);
    const tickOuter = { x: cx + Math.cos(ang) * r, y: cy + Math.sin(ang) * r };
    const tickInner = { x: cx + Math.cos(ang) * (r - 10), y: cy + Math.sin(ang) * (r - 10) };
    ctx.strokeStyle = NAVY; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(tickOuter.x, tickOuter.y); ctx.lineTo(tickInner.x, tickInner.y); ctx.stroke();
  }

  // Hour hand
  const hourAngle = ((hour % 12) + minute / 60) / 12 * 2 * Math.PI - Math.PI / 2;
  ctx.strokeStyle = NAVY; ctx.lineWidth = 6; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(hourAngle) * (r * 0.5), cy + Math.sin(hourAngle) * (r * 0.5)); ctx.stroke();

  // Minute hand
  const minAngle = (minute / 60) * 2 * Math.PI - Math.PI / 2;
  ctx.strokeStyle = '#c0392b'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(minAngle) * (r * 0.8), cy + Math.sin(minAngle) * (r * 0.8)); ctx.stroke();
}

function drawThermometer(ctx, { value, min = 0, max = 50 }) {
  const bulbCx = 150, bulbCy = 330, bulbR = 28;
  const tubeX = bulbCx - 12, tubeY = 40, tubeW = 24, tubeH = 300;
  ctx.strokeStyle = NAVY; ctx.lineWidth = 3; ctx.fillStyle = '#f1f5f9';
  ctx.beginPath();
  ctx.roundRect ? ctx.roundRect(tubeX, tubeY, tubeW, tubeH, 12) : ctx.rect(tubeX, tubeY, tubeW, tubeH);
  ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.arc(bulbCx, bulbCy, bulbR, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

  const pct = Math.max(0, Math.min(1, (value - min) / (max - min)));
  const fillTop = tubeY + tubeH - pct * tubeH;
  ctx.fillStyle = '#c0392b';
  ctx.beginPath(); ctx.arc(bulbCx, bulbCy, bulbR - 5, 0, Math.PI * 2); ctx.fill();
  ctx.fillRect(tubeX + 5, fillTop, tubeW - 10, (tubeY + tubeH) - fillTop);

  ctx.strokeStyle = NAVY; ctx.lineWidth = 1.5;
  ctx.font = '13px sans-serif'; ctx.textAlign = 'right'; ctx.fillStyle = NAVY;
  const step = (max - min) / 5;
  for (let v = min; v <= max; v += step) {
    const y = tubeY + tubeH - ((v - min) / (max - min)) * tubeH;
    ctx.beginPath(); ctx.moveTo(tubeX - 6, y); ctx.lineTo(tubeX, y); ctx.stroke();
    ctx.fillText(`${Math.round(v)}°`, tubeX - 10, y + 4);
  }
}

const CANVAS_DIMS = {
  pattern: [640, 200], classification: [640, 220], shapecount: [420, 420],
  mirror: [500, 460], angle: [400, 320], rectangle: [420, 260],
  bargraph: [480, 340], pictograph: null, clock: [300, 300], thermometer: [220, 380],
};

export function DiagramCanvas({ params }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    if (!params || !canvasRef.current) return;
    const canvas = canvasRef.current;
    let [w, h] = CANVAS_DIMS[params.type] || [400, 300];
    if (params.type === 'pictograph') { h = 60 + params.rows.length * 55 + 60; w = 480; }
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, w, h);
    try {
      if (params.type === 'pattern') drawPattern(ctx, params);
      else if (params.type === 'classification') drawClassification(ctx, params);
      else if (params.type === 'shapecount') drawShapeCount(ctx, params);
      else if (params.type === 'mirror') drawMirror(ctx, params);
      else if (params.type === 'angle') drawAngle(ctx, params);
      else if (params.type === 'rectangle') drawRectangleDiagram(ctx, params);
      else if (params.type === 'bargraph') drawBarGraphDiagram(ctx, params);
      else if (params.type === 'pictograph') drawPictographDiagram(ctx, params);
      else if (params.type === 'clock') drawClock(ctx, params);
      else if (params.type === 'thermometer') drawThermometer(ctx, params);
    } catch (e) { /* fail silently */ }
  }, [params]);

  if (!params) return null;
  return (
    <div className="my-3 flex justify-center">
      <canvas ref={canvasRef} className="max-w-full border border-slate-200 rounded-lg bg-white" style={{ width: '100%', maxWidth: 480, height: 'auto' }} />
    </div>
  );
}

/* ============================================================
   UI PRIMITIVES
   ============================================================ */
export function Button({ children, onClick, variant = 'primary', size = 'md', className = '', disabled, type = 'button' }) {
  const base = 'inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95';
  const sizes = { md: 'px-4 py-2.5 text-sm', sm: 'px-3 py-1.5 text-xs' };
  const variants = {
    primary: 'text-white shadow-sm hover:shadow-md',
    secondary: 'bg-white border-2 hover:bg-slate-50',
    ghost: 'hover:bg-slate-100',
    danger: 'bg-red-600 text-white hover:bg-red-700',
  };
  const style = variant === 'primary' ? { backgroundColor: NAVY } : variant === 'secondary' ? { borderColor: NAVY, color: NAVY } : {};
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${sizes[size]} ${variants[variant]} ${className}`} style={style}>
      {children}
    </button>
  );
}

export function Card({ children, className = '', onClick, ...rest }) {
  return (
    <div className={`bg-white rounded-2xl border border-slate-200 shadow-sm ${className}`} onClick={onClick} {...rest}>
      {children}
    </div>
  );
}
