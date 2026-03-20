/**
 * field.js — SVG minimap renderer (Vertical layout).
 * 6 rows (top-to-bottom) x 3 columns (left-to-right).
 * Supports Ball marker and multi-entity offsets per zone.
 */

const SVG_W  = 180;
const SVG_H  = 360;
const PAD    = 10;
const CELL_W = (SVG_W - PAD*2) / 3;
const CELL_H = (SVG_H - PAD*2) / 6;

/** Column letter → column index (A=0, B=1, C=2) */
const colIdx = c => c === 'A' ? 0 : c === 'B' ? 1 : 2;
const rowIdx = r => r - 1;

function zoneToXY(zone) {
  const row = parseInt(zone[0]);
  const col = zone[1];
  const x = PAD + colIdx(col) * CELL_W + CELL_W / 2;
  const y = PAD + rowIdx(row) * CELL_H + CELL_H / 2;
  return { x, y };
}

let _svgEl = null;

export function initField(container) {
  if (!container) return;
  
  container.innerHTML = '';
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', `0 0 ${SVG_W} ${SVG_H}`);
  svg.style.width = '100%';
  svg.style.height = '100%';

  // Draw grid (Vertical)
  for (let r = 1; r <= 6; r++) {
    for (let c = 0; c < 3; c++) {
      const x = PAD + c * CELL_W;
      const y = PAD + (r - 1) * CELL_H;
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('x', x + 2);
      rect.setAttribute('y', y + 2);
      rect.setAttribute('width', CELL_W - 4);
      rect.setAttribute('height', CELL_H - 4);
      rect.setAttribute('rx', 6);
      rect.setAttribute('fill', 'rgba(255,255,255,0.02)');
      rect.setAttribute('stroke', 'rgba(255,255,255,0.05)');
      rect.setAttribute('stroke-width', '1');
      svg.appendChild(rect);
    }
  }

  container.appendChild(svg);
  _svgEl = svg;
}

export function renderField(state) {
  if (!_svgEl) {
    const container = document.getElementById('field-minimap-v2');
    if (container) initField(container);
    else return;
  }

  // Remove existing entities
  _svgEl.querySelectorAll('.player-dot, .ball-dot, .zone-highlight').forEach(el => el.remove());

  // Ball/Active Zone Highlight
  if (state.ballZone) {
    const r = parseInt(state.ballZone[0]);
    const c = colIdx(state.ballZone[1]);
    const highlight = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    highlight.setAttribute('x', PAD + c * CELL_W + 1);
    highlight.setAttribute('y', PAD + (r-1) * CELL_H + 1);
    highlight.setAttribute('width', CELL_W - 2);
    highlight.setAttribute('height', CELL_H - 2);
    highlight.setAttribute('rx', 6);
    highlight.setAttribute('fill', 'rgba(245,200,66,0.08)');
    highlight.setAttribute('stroke', 'var(--accent)');
    highlight.setAttribute('stroke-width', '1');
    highlight.setAttribute('class', 'zone-highlight');
    _svgEl.appendChild(highlight);
  }

  /** 
   * Entity Offset Logic:
   * Human: top-left (-10, -8)
   * AI: top-right (+10, -8)
   * Ball: bottom-center (0, +8)
   */
  state.humans.forEach(p => _drawDot(p.zone, '#5285e0', '#fff', -10, -8, 'player-dot'));
  state.ais.forEach(p => _drawDot(p.zone, '#ff9f43', '#fff', 10, -8, 'player-dot'));
  if (state.ballZone) {
    _drawDot(state.ballZone, '#fff', '#000', 0, 8, 'ball-dot', 3.5);
  }
}

function _drawDot(zone, fill, stroke, ox, oy, className, radius = 5) {
  if (!zone) return;
  const { x, y } = zoneToXY(zone);
  const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  circle.setAttribute('cx', x + ox);
  circle.setAttribute('cy', y + oy);
  circle.setAttribute('r', radius);
  circle.setAttribute('fill', fill);
  circle.setAttribute('stroke', stroke);
  circle.setAttribute('stroke-width', '1');
  circle.setAttribute('class', className);
  
  if (className === 'ball-dot') {
     circle.setAttribute('filter', 'drop-shadow(0 0 4px rgba(255,255,255,0.8))');
  }

  _svgEl.appendChild(circle);
}
